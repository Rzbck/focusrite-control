'use strict'
const fs = require('node:fs')
const path = require('node:path')
const { resultsDir, nowIso } = require('./FullTestBenchBase')
const { summarizeRows } = require('./FullTestBenchCapabilityV4')

function csvEscape(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`
}

function redactCommonPrivacyText(value) {
  return String(value || '')
    .replace(/\b[A-Za-z]:[\\/][^\s;,)]*/g, '<path-redacted>')
    .replace(/\/(?:Users|home)\/[^\s;,)]*/g, '<path-redacted>')
    .replace(/https?:\/\/[^\s;,)]*/gi, '<url-redacted>')
    .replace(/\b(?:localhost|(?:\d{1,3}\.){3}\d{1,3}|[A-Za-z0-9.-]+\.local):\d{2,5}\b/gi, '<endpoint-redacted>')
    .replace(/\b(?:client|device|connection)[-_ ]?id\s*[=:]\s*[^\s;,)]*/gi, '<id-redacted>')
    .replace(/\b(?:hostname|host|server)[-_ ]?(?:name)?\s*[=:]\s*[^\s;,)]*/gi, '<host-redacted>')
}

function redactShareableDetail(row) {
  if (/nickname/i.test(String(row.family || '')) || /nickname/i.test(String(row.id || ''))) {
    return row.detail ? 'Nickname capability result recorded; live/test nickname values are redacted from the shareable report.' : ''
  }
  return redactCommonPrivacyText(row.detail)
}

function sanitizeCapabilityRow(row) {
  return {
    id: row.id,
    family: row.family,
    availability: row.availability,
    r9ProbeCount: row.r9ProbeCount,
    stateKnown: Boolean(row.stateKnown),
    capability: Boolean(row.capability),
    risk: row.risk,
    dependency: row.dependency,
    status: row.status,
    detail: redactShareableDetail(row),
  }
}

function sanitizeSignalPathSafety(value) {
  if (!Array.isArray(value)) return undefined
  return value.map((item) => ({
    output: Number(item.output),
    availability: String(item.availability || 'UNKNOWN'),
    safe: item.safe === true,
    reason: redactCommonPrivacyText(item.reason || 'no-confirmed-guard'),
  }))
}

function sanitizeMeta(meta = {}) {
  const allowed = [
    'completed',
    'hardwareWrites',
    'reason',
    'revision',
    'signature',
    'model',
    'r9Probes',
    'r9Definitions',
    'globalSignalPathSafety',
  ]
  const clean = Object.fromEntries(allowed.filter((key) => Object.hasOwn(meta, key)).map((key) => [key, meta[key]]))
  const safety = sanitizeSignalPathSafety(meta.signalPathSafety)
  if (safety) clean.signalPathSafety = safety
  return clean
}

function buildShareablePayload({ rows, meta = {}, feedbackBefore = null, feedbackAfter = null, generatedAt = nowIso() }) {
  return {
    schemaVersion: 4,
    reportClass: 'shareable-sanitized',
    generatedAt,
    meta: sanitizeMeta(meta),
    summary: summarizeRows(rows),
    feedbackBefore,
    feedbackAfter,
    capabilities: rows.map(sanitizeCapabilityRow),
    privacy: 'Sanitized for sharing: no live state values, nicknames, serials, hostnames, network endpoints, server/client/device IDs, ports, keys, raw XML/page exports, diagnostics paths, or connection IDs.',
  }
}

function writeCapabilityReportV4({ rows, meta = {}, feedbackBefore = null, feedbackAfter = null }) {
  fs.mkdirSync(resultsDir, { recursive: true })
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
  const base = path.join(resultsDir, `capability-lab_${stamp}`)
  const generatedAt = nowIso()
  const payload = {
    schemaVersion: 4,
    reportClass: 'private-local-diagnostic',
    generatedAt,
    meta,
    summary: summarizeRows(rows),
    feedbackBefore,
    feedbackAfter,
    capabilities: rows,
    privacy: 'PRIVATE LOCAL DIAGNOSTIC: may contain live state/nickname values. Do not publish or commit this raw JSON.',
  }
  fs.writeFileSync(`${base}.json`, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

  const shareable = buildShareablePayload({ rows, meta, feedbackBefore, feedbackAfter, generatedAt })
  const shareablePath = `${base}.shareable.json`
  const latestShareablePath = path.join(resultsDir, 'LATEST_SHAREABLE.json')
  fs.writeFileSync(shareablePath, `${JSON.stringify(shareable, null, 2)}\n`, 'utf8')
  fs.writeFileSync(latestShareablePath, `${JSON.stringify(shareable, null, 2)}\n`, 'utf8')

  const columns = ['id', 'family', 'variable', 'availability', 'r9ProbeCount', 'stateKnown', 'risk', 'dependency', 'status', 'detail']
  const csv = [columns.map(csvEscape).join(',')]
  for (const row of rows) csv.push(columns.map((key) => csvEscape(row[key])).join(','))
  fs.writeFileSync(`${base}.csv`, `${csv.join('\n')}\n`, 'utf8')
  const summary = summarizeRows(rows)
  const txt = [
    'Focusrite Capability Lab v5 pair-aware safety',
    `Generated: ${payload.generatedAt}`,
    '',
    ...Object.entries(summary).sort().map(([status, count]) => `${status}: ${count}`),
    '',
    'This report distinguishes discovered/schema capability, r9 coverage, hardware result, skip reason and restoration/quarantine.',
    'Disruptive settings remain excluded from automatic FULL. Monitor gain 1677 and unsafe raw writes remain blocked.',
    'Raw JSON is private. Use the .shareable.json or LATEST_SHAREABLE.json file when sharing results.',
  ]
  fs.writeFileSync(`${base}.txt`, `${txt.join('\n')}\n`, 'utf8')
  return { json: `${base}.json`, shareable: shareablePath, latestShareable: latestShareablePath, csv: `${base}.csv`, txt: `${base}.txt` }
}

module.exports = { redactCommonPrivacyText, redactShareableDetail, sanitizeCapabilityRow, sanitizeSignalPathSafety, buildShareablePayload, writeCapabilityReportV4 }

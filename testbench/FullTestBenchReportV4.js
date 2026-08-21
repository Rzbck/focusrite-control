'use strict'
const fs = require('node:fs')
const path = require('node:path')
const { resultsDir, nowIso } = require('./FullTestBenchBase')
const { summarizeRows } = require('./FullTestBenchCapabilityV4')

function csvEscape(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`
}

function writeCapabilityReportV4({ rows, meta = {}, feedbackBefore = null, feedbackAfter = null }) {
  fs.mkdirSync(resultsDir, { recursive: true })
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
  const base = path.join(resultsDir, `capability-lab_${stamp}`)
  const payload = {
    schemaVersion: 4,
    generatedAt: nowIso(),
    meta,
    summary: summarizeRows(rows),
    feedbackBefore,
    feedbackAfter,
    capabilities: rows,
    privacy: 'No serial, hostname, server port, client key, connection IDs, raw XML/page export, or live nickname contents are stored.',
  }
  fs.writeFileSync(`${base}.json`, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  const columns = ['id', 'family', 'variable', 'availability', 'r9ProbeCount', 'stateKnown', 'risk', 'dependency', 'status', 'detail']
  const csv = [columns.map(csvEscape).join(',')]
  for (const row of rows) csv.push(columns.map((key) => csvEscape(row[key])).join(','))
  fs.writeFileSync(`${base}.csv`, `${csv.join('\n')}\n`, 'utf8')
  const summary = summarizeRows(rows)
  const txt = [
    'Focusrite Capability Lab v4',
    `Generated: ${payload.generatedAt}`,
    '',
    ...Object.entries(summary).sort().map(([status, count]) => `${status}: ${count}`),
    '',
    'This report distinguishes discovered/schema capability, r9 coverage, hardware result, skip reason and restoration/quarantine.',
    'Disruptive settings remain excluded from automatic FULL. Monitor gain 1677 and unsafe raw writes remain blocked.',
  ]
  fs.writeFileSync(`${base}.txt`, `${txt.join('\n')}\n`, 'utf8')
  return { json: `${base}.json`, csv: `${base}.csv`, txt: `${base}.txt` }
}

module.exports = { writeCapabilityReportV4 }

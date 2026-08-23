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
		.replace(
			/\b(?:localhost|(?:\d{1,3}\.){3}\d{1,3}|[A-Za-z0-9.-]+\.local):\d{2,5}\b/gi,
			'<endpoint-redacted>',
		)
		.replace(/\b(?:client|device|connection)[-_ ]?id\s*[=:]\s*[^\s;,)]*/gi, '<id-redacted>')
		.replace(/\b(?:hostname|host|server)[-_ ]?(?:name)?\s*[=:]\s*[^\s;,)]*/gi, '<host-redacted>')
}

function redactShareableDetail(row) {
	if (/nickname/i.test(String(row.family || '')) || /nickname/i.test(String(row.id || ''))) {
		return row.detail
			? 'Nickname capability result recorded; live/test nickname values are redacted from the shareable report.'
			: ''
	}
	return redactCommonPrivacyText(row.detail)
}

function sanitizeCapabilityRow(row) {
	return {
		id: row.id,
		family: row.family,
		classification: row.classification || 'UNKNOWN',
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

function sanitizeEvidenceAudit(value) {
	if (!value || typeof value !== 'object') return undefined
	const keys = [
		'complete',
		'inventoryRows',
		'classifiedRows',
		'snapshotObserved',
		'snapshotMapped',
		'coreObserved',
		'coreMapped',
		'feedbackProbes',
		'feedbackDefinitions',
		'unclassifiedCount',
	]
	return Object.fromEntries(keys.filter((key) => Object.hasOwn(value, key)).map((key) => [key, value[key]]))
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
		'physicalIsolationConfirmed',
		'diagnosticResumePhase',
	]
	const clean = Object.fromEntries(
		allowed.filter((key) => Object.hasOwn(meta, key)).map((key) => [key, meta[key]]),
	)
	const safety = sanitizeSignalPathSafety(meta.signalPathSafety)
	if (safety) clean.signalPathSafety = safety
	const evidenceAudit = sanitizeEvidenceAudit(meta.evidenceAudit)
	if (evidenceAudit) clean.evidenceAudit = evidenceAudit
	return clean
}

function buildShareablePayload({
	rows,
	meta = {},
	feedbackBefore = null,
	feedbackAfter = null,
	feedbackDynamic = null,
	generatedAt = nowIso(),
}) {
	return {
		schemaVersion: 4,
		reportClass: 'shareable-sanitized',
		generatedAt,
		meta: sanitizeMeta(meta),
		summary: summarizeRows(rows),
		feedbackBefore,
		feedbackAfter,
		feedbackDynamic,
		capabilities: rows.map(sanitizeCapabilityRow),
		privacy:
			'Sanitized for sharing: no live state values, nicknames, serials, hostnames, network endpoints, server/client/device IDs, ports, keys, raw XML/page exports, diagnostics paths, or connection IDs.',
	}
}

function writeCapabilityReportV4({
	rows,
	meta = {},
	feedbackBefore = null,
	feedbackAfter = null,
	feedbackDynamic = null,
}) {
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
		feedbackDynamic,
		capabilities: rows,
		privacy: 'PRIVATE LOCAL DIAGNOSTIC: may contain live state/nickname values. Do not publish or commit this raw JSON.',
	}
	fs.writeFileSync(`${base}.json`, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

	const shareable = buildShareablePayload({
		rows,
		meta,
		feedbackBefore,
		feedbackAfter,
		feedbackDynamic,
		generatedAt,
	})
	const shareablePath = `${base}.shareable.json`
	const latestShareablePath = path.join(resultsDir, 'LATEST_SHAREABLE.json')
	fs.writeFileSync(shareablePath, `${JSON.stringify(shareable, null, 2)}\n`, 'utf8')
	fs.writeFileSync(latestShareablePath, `${JSON.stringify(shareable, null, 2)}\n`, 'utf8')

	const columns = [
		'id',
		'family',
		'classification',
		'variable',
		'availability',
		'r9ProbeCount',
		'stateKnown',
		'risk',
		'dependency',
		'status',
		'detail',
	]
	const csv = [columns.map(csvEscape).join(',')]
	for (const row of rows) csv.push(columns.map((key) => csvEscape(row[key])).join(','))
	fs.writeFileSync(`${base}.csv`, `${csv.join('\n')}\n`, 'utf8')
	const summary = summarizeRows(rows)
	const txt = [
		`Focusrite Capability Lab ${meta.revision || 'current'}`,
		`Generated: ${payload.generatedAt}`,
		'',
		...Object.entries(summary)
			.sort()
			.map(([status, count]) => `${status}: ${count}`),
		'',
		'This report separates per-run status from semantic capability classification. A skipped diagnostic row can retain prior hardware evidence without being misreported as a new PASS.',
		'Every observed snapshot/Core variable must map to the inventory; unknown/unclassified observations fail closed instead of disappearing silently.',
		'Device-wide source-pair topology is reported per pair and remains source-specific evidence; it is not promoted into mute/stereo semantics.',
		'Global server-side signal-path safety and explicit physical ALL_ISOLATED confirmation are separate report fields.',
		'Manual feedback work remains MANUAL_PENDING until real physical/signal interaction is observed.',
		'Disruptive settings remain excluded from automatic FULL. Monitor gain 1677 stays read-only and unsafe raw writes remain blocked.',
		'Raw JSON is private. Use the .shareable.json or LATEST_SHAREABLE.json file when sharing results.',
	]
	fs.writeFileSync(`${base}.txt`, `${txt.join('\n')}\n`, 'utf8')
	return {
		json: `${base}.json`,
		shareable: shareablePath,
		latestShareable: latestShareablePath,
		csv: `${base}.csv`,
		txt: `${base}.txt`,
	}
}

module.exports = {
	redactCommonPrivacyText,
	redactShareableDetail,
	sanitizeCapabilityRow,
	sanitizeSignalPathSafety,
	sanitizeEvidenceAudit,
	buildShareablePayload,
	writeCapabilityReportV4,
}

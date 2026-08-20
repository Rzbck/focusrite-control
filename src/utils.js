function xmlDecode(value) {
	if (value === undefined || value === null) return ''
	return String(value)
		.replaceAll('&quot;', '"')
		.replaceAll('&apos;', "'")
		.replaceAll('&lt;', '<')
		.replaceAll('&gt;', '>')
		.replaceAll('&amp;', '&')
}

function xmlEncode(value) {
	return String(value ?? '')
		.replaceAll('&', '&amp;')
		.replaceAll('"', '&quot;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll("'", '&apos;')
}

function parseAttrs(text = '') {
	const attrs = {}
	const rx = /([A-Za-z0-9_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g
	let match
	while ((match = rx.exec(text)) !== null) attrs[match[1]] = xmlDecode(match[2] ?? match[3] ?? '')
	return attrs
}

function boolValue(value) {
	return value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true'
}

function clamp(value, min, max) {
	return Math.min(max, Math.max(min, value))
}

function safeVariableId(value) {
	return String(value).replace(/[^A-Za-z0-9_-]/g, '_')
}

function normalizeNumber(value, fallback = 0) {
	const n = Number(value)
	return Number.isFinite(n) ? n : fallback
}

function choice(id, label) {
	return { id: String(id), label: String(label) }
}

module.exports = {
	xmlDecode,
	xmlEncode,
	parseAttrs,
	boolValue,
	clamp,
	safeVariableId,
	normalizeNumber,
	choice,
}

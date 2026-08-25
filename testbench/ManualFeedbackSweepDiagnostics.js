'use strict'

const { canonicalBool, mapLimit, readVariableOptional, sleep } = require('./FullTestBenchBase')

const DIAGNOSTIC_SCAN_MIN_INTERVAL_MS = 750
const DIAGNOSTIC_READ_CONCURRENCY = 32
const SAFE_PROVENANCE = new Set(['arrival', 'set', 'arrival+set', 'never-observed'])

function addDiagnosticTarget(targets, id, label, kind) {
	if (!id || targets.has(id)) return
	targets.set(id, { id, label, kind })
}

function mixLaneBase(options = {}) {
	if (!options.mix || !options.side) return ''
	const mix = String(options.mix).toLowerCase().replace(/\s+/g, '_')
	const side = options.side === 'left' ? 'l' : 'r'
	return `mix_${mix}_${side}`
}

function addOutputTargets(targets, output) {
	const label = `Output ${output}`
	addDiagnosticTarget(targets, `output_${output}_available`, `${label}: available`, 'bool')
	addDiagnosticTarget(targets, `output_${output}_mute`, `${label}: mute`, 'bool')
	addDiagnosticTarget(targets, `output_${output}_stereo`, `${label}: stereo`, 'bool')
	addDiagnosticTarget(targets, `output_${output}_source_name`, `${label}: source`, 'sourceName')
	addDiagnosticTarget(targets, `output_${output}_gain`, `${label}: gain`, 'opaque')
	addDiagnosticTarget(targets, `output_${output}_assign_mix_class`, `${label}: assign-mix class`, 'assignMixClass')
	addDiagnosticTarget(
		targets,
		`output_${output}_assign_mix_provenance`,
		`${label}: assign-mix provenance`,
		'provenance',
	)
}

function addMixerSlotTargets(targets, slot) {
	const label = `Mixer slot ${slot}`
	addDiagnosticTarget(targets, `mixer_slot_${slot}_source_name`, `${label}: source`, 'sourceName')
	addDiagnosticTarget(targets, `mixer_slot_${slot}_stereo`, `${label}: stereo`, 'bool')
}

function addMixLaneTargets(targets, lane, slots) {
	addDiagnosticTarget(targets, `${lane}_talkback`, `${lane}: talkback`, 'bool')
	for (const slot of [...slots].sort((a, b) => a - b)) {
		const label = `${lane} slot ${slot}`
		addDiagnosticTarget(targets, `${lane}_slot_${slot}_gain`, `${label}: gain`, 'opaque')
		addDiagnosticTarget(targets, `${lane}_slot_${slot}_pan`, `${label}: pan`, 'opaque')
	}
}

function buildDiagnosticTargets(probes) {
	const targets = new Map()
	const outputNumbers = new Set()
	const mixerSlots = new Set()
	const mixLaneSlots = new Map()

	for (const probe of probes || []) {
		const options = probe.options || {}
		if (probe.definitionId?.startsWith('output_')) {
			const output = Number(options.output) + 1
			if (Number.isInteger(output) && output > 0) outputNumbers.add(output)
		}
		if (probe.definitionId === 'mixer_slot_source' || probe.definitionId === 'mixer_slot_stereo') {
			const slot = Number(options.slot)
			if (Number.isInteger(slot) && slot > 0) mixerSlots.add(slot)
		}
		if (probe.definitionId?.startsWith('mix_')) {
			const lane = mixLaneBase(options)
			if (!lane) continue
			if (!mixLaneSlots.has(lane)) mixLaneSlots.set(lane, new Set())
			const slot = Number(options.slot)
			if (Number.isInteger(slot) && slot > 0) mixLaneSlots.get(lane).add(slot)
		}
	}

	for (const output of [...outputNumbers].sort((a, b) => a - b)) {
		addOutputTargets(targets, output)
	}
	for (const slot of [...mixerSlots].sort((a, b) => a - b)) {
		addMixerSlotTargets(targets, slot)
	}
	for (const [lane, slots] of [...mixLaneSlots.entries()].sort(([a], [b]) => a.localeCompare(b))) {
		addMixLaneTargets(targets, lane, slots)
	}

	for (const [id, label, kind] of [
		['monitor_mute', 'Monitor mute', 'bool'],
		['monitor_dim', 'Monitor dim', 'bool'],
		['monitor_talkback', 'Monitor talkback', 'bool'],
		['monitor_altEnable', 'Monitor alt enable', 'bool'],
		['monitor_alt', 'Monitor alt select', 'bool'],
		['monitor_preset', 'Monitor output preset', 'semantic'],
		['device_phantomPersistence', 'Retain 48V', 'bool'],
		['device_talkbackInputSource', 'Talkback input source', 'opaque'],
	]) {
		addDiagnosticTarget(targets, id, label, kind)
	}

	return [...targets.values()]
}

function sanitizeSemanticText(raw, fallback = 'UNKNOWN') {
	const text = String(raw ?? '').trim().replace(/[\r\n\t]+/g, ' ')
	if (!text) return fallback
	return text.length > 120 ? `${text.slice(0, 117)}...` : text
}

function classifyDiagnosticValue(target, raw, track) {
	const text = String(raw ?? '').trim()
	if (!text) return 'UNKNOWN'
	if (target.kind === 'bool') {
		const value = canonicalBool(text)
		return value || 'KNOWN_BOOL'
	}
	if (target.kind === 'sourceName') {
		if (/^-?\d+(?:\.\d+)?$/.test(text)) return 'UNRESOLVED_SOURCE'
		return sanitizeSemanticText(text)
	}
	if (target.kind === 'provenance') return SAFE_PROVENANCE.has(text) ? text : 'KNOWN_PROVENANCE'
	if (target.kind === 'assignMixClass') return /^V\d+$/.test(text) ? text : 'KNOWN_ASSIGN_MIX_CLASS'
	if (target.kind === 'semantic') return sanitizeSemanticText(text)
	if (!track.valueClasses.has(text)) {
		track.valueClasses.set(text, `V${track.nextClass}`)
		track.nextClass += 1
	}
	return track.valueClasses.get(text)
}

function newDiagnosticTrack(target, item) {
	const track = {
		target,
		baseline: 'UNKNOWN',
		current: 'UNKNOWN',
		transitions: 0,
		observed: new Set(),
		valueClasses: new Map(),
		nextClass: 1,
	}
	const value = classifyDiagnosticValue(target, item?.value, track)
	track.baseline = value
	track.current = value
	track.observed.add(value)
	return track
}

async function seedDiagnosticTracks(context, targets) {
	const rows = await mapLimit(targets, DIAGNOSTIC_READ_CONCURRENCY, async (target) => {
		const item = await readVariableOptional(context.baseUrl, context.label, target.id, 1800)
		return item.exists ? [target.id, newDiagnosticTrack(target, item)] : null
	})
	const tracks = new Map(rows.filter(Boolean))
	return { candidateCount: targets.length, exposedCount: tracks.size, tracks }
}

function applyDiagnosticObservation(track, value) {
	if (value === track.current) return false
	track.current = value
	track.transitions += 1
	track.observed.add(value)
	return true
}

function summarizeDiagnosticTracks(tracks) {
	const summary = { total: tracks.size, changed: 0, transitions: 0, unknownBaseline: 0, unknownCurrent: 0 }
	for (const track of tracks.values()) {
		if (track.transitions > 0) summary.changed += 1
		summary.transitions += track.transitions
		if (track.baseline === 'UNKNOWN') summary.unknownBaseline += 1
		if (track.current === 'UNKNOWN') summary.unknownCurrent += 1
	}
	return summary
}

function diagnosticPaths(tracks) {
	return [...tracks.values()].map((track) => ({
		id: track.target.id,
		label: track.target.label,
		kind: track.target.kind,
		baseline: track.baseline,
		current: track.current,
		transitions: track.transitions,
		observed: [...track.observed],
	}))
}

async function observeDiagnostics(context, tracks, stopState, recording, onChange) {
	while (!stopState.stop) {
		const cycleStart = Date.now()
		const rows = await mapLimit([...tracks.values()], DIAGNOSTIC_READ_CONCURRENCY, async (track) => {
			const item = await readVariableOptional(context.baseUrl, context.label, track.target.id, 1800)
			if (!item.exists) return null
			return [track, classifyDiagnosticValue(track.target, item.value, track)]
		})
		const atMs = Date.now() - recording.startedAtMs
		let changed = 0
		for (const row of rows) {
			if (!row) continue
			const [track, value] = row
			const before = track.current
			if (!applyDiagnosticObservation(track, value)) continue
			changed += 1
			recording.diagnosticEvents.push({
				atMs,
				id: track.target.id,
				label: track.target.label,
				kind: track.target.kind,
				before,
				after: value,
			})
			const elapsed = (atMs / 1000).toFixed(1).padStart(6)
			console.log(`REC-DIAG +${elapsed}s  ${track.target.label}: ${before} -> ${value}`)
		}
		if (changed && onChange) onChange()
		const cycleMs = Date.now() - cycleStart
		recording.diagnosticScanCycles += 1
		recording.diagnosticTotalScanCycleMs += cycleMs
		recording.diagnosticMaxScanCycleMs = Math.max(recording.diagnosticMaxScanCycleMs, cycleMs)
		const remaining = DIAGNOSTIC_SCAN_MIN_INTERVAL_MS - cycleMs
		if (!stopState.stop && remaining > 0) await sleep(remaining)
	}
}

module.exports = {
	DIAGNOSTIC_SCAN_MIN_INTERVAL_MS,
	buildDiagnosticTargets,
	classifyDiagnosticValue,
	newDiagnosticTrack,
	seedDiagnosticTracks,
	applyDiagnosticObservation,
	summarizeDiagnosticTracks,
	diagnosticPaths,
	observeDiagnostics,
}

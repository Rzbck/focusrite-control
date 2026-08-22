'use strict'

const readline = require('node:readline/promises')
const { stdin, stdout } = require('node:process')
const { mapLimit, readVariableOptional, sleep } = require('./FullTestBenchBase')
const { readFeedbackMarker } = require('./FullTestBenchAudit')
const {
	METER_DEFINITIONS,
	feedbackOracle,
	evaluateOracle,
	sweepFeedbacksV6,
	observeMonitorGain,
} = require('./FullTestBenchFeedbackV6')

const DYNAMIC_DEFINITIONS = new Set([
	'monitor_mute',
	'monitor_dim',
	'monitor_talkback',
	'monitor_alt',
	'monitor_alt_enable',
	'monitor_preset',
	'input_air',
	'input_pad',
	'input_mode',
	'output_mute',
	'output_stereo',
	'output_source',
	'mixer_slot_stereo',
	'mixer_slot_source',
	'mix_mute',
	'mix_solo',
	'mix_talkback',
	'talkback_source',
	'phantom_persistence',
])

function probeKey(probe) {
	return `${probe.row}/${probe.column}`
}

function newTrack(probe) {
	return {
		definitionId: probe.definitionId,
		seenTrue: false,
		seenFalse: false,
		mismatch: false,
		observations: 0,
	}
}

async function sampleProbe({ baseUrl, label, pageNumber, probe, oracle }) {
	const [marker, item] = await Promise.all([
		readFeedbackMarker(baseUrl, pageNumber, probe),
		readVariableOptional(baseUrl, label, oracle.source, 1500),
	])
	if (!marker || !item.exists || item.value === '') return null
	const evaluated = evaluateOracle(oracle, item.value)
	if (!evaluated.evaluable) return null
	return { actual: marker === 'T', wanted: evaluated.wanted }
}

async function observeProbe({ baseUrl, label, pageNumber, probe, track }) {
	const oracle = feedbackOracle(probe)
	if (!oracle.source || oracle.kind === 'unmapped') return false
	let last = null
	for (const delay of [0, 180, 420]) {
		if (delay) await sleep(delay)
		last = await sampleProbe({ baseUrl, label, pageNumber, probe, oracle })
		if (!last) continue
		if (last.actual === last.wanted) {
			track.observations++
			if (last.actual) track.seenTrue = true
			else track.seenFalse = true
			return true
		}
	}
	if (!last) return false
	track.observations++
	track.mismatch = true
	return true
}

function summarizeTracks(tracks) {
	let bothStates = 0
	let singleState = 0
	let neverObserved = 0
	let fail = 0
	const definitions = {}
	for (const track of tracks.values()) {
		if (!definitions[track.definitionId]) {
			definitions[track.definitionId] = { total: 0, bothStates: 0, singleState: 0, neverObserved: 0, fail: 0 }
		}
		const counts = definitions[track.definitionId]
		counts.total++
		if (track.mismatch) {
			fail++
			counts.fail++
		}
		if (track.seenTrue && track.seenFalse) {
			bothStates++
			counts.bothStates++
		} else if (track.observations > 0) {
			singleState++
			counts.singleState++
		} else {
			neverObserved++
			counts.neverObserved++
		}
	}
	return { total: tracks.size, bothStates, singleState, neverObserved, fail, definitions }
}

function createTransitionFeedbackObserver({ baseUrl, label, r9 }) {
	const bySource = new Map()
	const tracks = new Map()
	for (const probe of r9.probes) {
		if (!DYNAMIC_DEFINITIONS.has(probe.definitionId)) continue
		const oracle = feedbackOracle(probe)
		if (!oracle.source || oracle.kind === 'unmapped' || METER_DEFINITIONS.has(probe.definitionId)) continue
		const list = bySource.get(oracle.source) || []
		list.push(probe)
		bySource.set(oracle.source, list)
		tracks.set(probeKey(probe), newTrack(probe))
	}

	return {
		async observeVariable(variable) {
			const probes = bySource.get(variable) || []
			await mapLimit(probes, 8, async (probe) => {
				const track = tracks.get(probeKey(probe))
				if (track) await observeProbe({ baseUrl, label, pageNumber: r9.pageNumber, probe, track })
			})
		},
		async observeVariables(variables) {
			const unique = [...new Set(variables || [])]
			await mapLimit(unique, 8, async (variable) => this.observeVariable(variable))
		},
		summary() {
			return summarizeTracks(tracks)
		},
	}
}

async function askManual(prompt) {
	if (!stdin.isTTY || !stdout.isTTY) return 'SKIP'
	const rl = readline.createInterface({ input: stdin, output: stdout })
	try {
		return String(await rl.question(prompt)).trim()
	} finally {
		rl.close()
	}
}

async function captureMeterPhase({ baseUrl, label, r9, probes, tracks, rounds = 2 }) {
	for (let round = 0; round < rounds; round++) {
		await mapLimit(probes, 16, async (probe) => {
			const track = tracks.get(probeKey(probe))
			if (track) await observeProbe({ baseUrl, label, pageNumber: r9.pageNumber, probe, track })
		})
		if (round + 1 < rounds) await sleep(250)
	}
}

async function observeMeterDynamicsV7({ baseUrl, label, r9, enabled }) {
	const probes = r9.probes.filter((probe) => METER_DEFINITIONS.has(probe.definitionId))
	const tracks = new Map(probes.map((probe) => [probeKey(probe), newTrack(probe)]))
	if (!probes.length) return { attempted: false, skipped: true, ...summarizeTracks(tracks) }
	if (!enabled) return { attempted: false, skipped: true, ...summarizeTracks(tracks) }

	console.log('')
	console.log('MANUAL FEEDBACK V7 - METERS / PHASE SILENCE')
	console.log('Mets les chemins que tu peux exercer au silence, puis laisse les niveaux stables pendant la capture.')
	const silence = (await askManual('Tape SILENT puis Entree pour capturer la phase silence, ou SKIP : ')).toUpperCase()
	if (silence !== 'SILENT') return { attempted: false, skipped: true, ...summarizeTracks(tracks) }
	await captureMeterPhase({ baseUrl, label, r9, probes, tracks })

	console.log('')
	console.log('MANUAL FEEDBACK V7 - METERS / PHASE SIGNAL')
	console.log('Cree maintenant un signal reel sur les chemins disponibles. Ne change aucun routing Focusrite pendant cette phase.')
	const signal = (await askManual('Tape SIGNAL puis Entree quand le signal est stable, ou SKIP : ')).toUpperCase()
	if (signal === 'SIGNAL') await captureMeterPhase({ baseUrl, label, r9, probes, tracks, rounds: 3 })

	console.log('Capture meters terminee. Tu peux remettre les niveaux/sources manuels dans leur etat normal.')
	return { attempted: true, skipped: signal !== 'SIGNAL', ...summarizeTracks(tracks) }
}

module.exports = {
	DYNAMIC_DEFINITIONS,
	feedbackOracle,
	evaluateOracle,
	sweepFeedbacksV6,
	observeMonitorGain,
	createTransitionFeedbackObserver,
	observeMeterDynamicsV7,
	summarizeTracks,
}

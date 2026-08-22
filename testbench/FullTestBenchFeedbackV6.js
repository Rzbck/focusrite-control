'use strict'

const readline = require('node:readline/promises')
const { stdin, stdout } = require('node:process')
const {
	canonicalBool,
	line,
	mapLimit,
	readVariableOptional,
	sleep,
} = require('./FullTestBenchBase')
const { readFeedbackMarker } = require('./FullTestBenchAudit')

const METER_DEFINITIONS = new Set(['input_meter', 'output_meter', 'mix_meter'])

function feedbackOracle(probe) {
	const o = probe.options || {}
	const input = Number(o.input) + 1
	const output = Number(o.output) + 1
	const slot = Number(o.slot)
	const lane =
		o.mix && o.side
			? `mix_${String(o.mix).toLowerCase().replace(/\s+/g, '_')}_${o.side === 'left' ? 'l' : 'r'}`
			: ''
	const map = {
		connected: { kind: 'connected', source: 'connection_status' },
		authorised: { kind: 'bool', source: 'client_authorised' },
		monitor_mute: { kind: 'bool', source: 'monitor_mute' },
		monitor_dim: { kind: 'bool', source: 'monitor_dim' },
		monitor_talkback: { kind: 'bool', source: 'monitor_talkback' },
		monitor_alt: { kind: 'bool', source: 'monitor_alt' },
		monitor_alt_enable: { kind: 'bool', source: 'monitor_altEnable' },
		monitor_preset: { kind: 'equals', source: 'monitor_preset', value: String(o.value) },
		device_preset: { kind: 'equals', source: 'device_devicePreset', value: String(o.value) },
		clock_source: { kind: 'equals', source: 'device_clockSource', value: String(o.value) },
		sample_rate: { kind: 'equals', source: 'device_sampleRate', value: String(o.value) },
		spdif_mode: { kind: 'equals', source: 'device_spdifMode', value: String(o.value) },
		clock_locked: { kind: 'bool', source: 'device_clockLocked' },
		talkback_source: { kind: 'equals', source: 'device_talkbackInputSource', value: String(o.source) },
		phantom_persistence: { kind: 'bool', source: 'device_phantomPersistence' },
	}
	if (map[probe.definitionId]) return map[probe.definitionId]
	if (probe.definitionId === 'input_air') return { kind: 'bool', source: `input_${input}_air` }
	if (probe.definitionId === 'input_pad') return { kind: 'bool', source: `input_${input}_pad` }
	if (probe.definitionId === 'input_available') return { kind: 'bool', source: `input_${input}_available` }
	if (probe.definitionId === 'input_mode') {
		return { kind: 'equals', source: `input_${input}_mode`, value: String(o.mode) }
	}
	if (probe.definitionId === 'input_meter') {
		return { kind: 'threshold', source: `input_${input}_meter`, threshold: Number(o.threshold) }
	}
	if (probe.definitionId === 'output_mute') return { kind: 'bool', source: `output_${output}_mute` }
	if (probe.definitionId === 'output_stereo') return { kind: 'bool', source: `output_${output}_stereo` }
	if (probe.definitionId === 'output_source') {
		return { kind: 'equals', source: `output_${output}_source`, value: String(o.source) }
	}
	if (probe.definitionId === 'output_available') return { kind: 'bool', source: `output_${output}_available` }
	if (probe.definitionId === 'output_meter') {
		return { kind: 'threshold', source: `output_${output}_meter`, threshold: Number(o.threshold) }
	}
	if (probe.definitionId === 'mixer_slot_stereo') return { kind: 'bool', source: `mixer_slot_${slot}_stereo` }
	if (probe.definitionId === 'mixer_slot_source') {
		return { kind: 'equals', source: `mixer_slot_${slot}_source`, value: String(o.source) }
	}
	if (probe.definitionId === 'mix_mute') return { kind: 'optionalBool', source: `${lane}_slot_${slot}_mute` }
	if (probe.definitionId === 'mix_solo') return { kind: 'optionalBool', source: `${lane}_slot_${slot}_solo` }
	if (probe.definitionId === 'mix_talkback') return { kind: 'bool', source: `${lane}_talkback` }
	if (probe.definitionId === 'mix_meter') {
		return { kind: 'threshold', source: `${lane}_meter`, threshold: Number(o.threshold) }
	}
	return { kind: 'unmapped' }
}

function evaluateOracle(oracle, raw) {
	if (oracle.kind === 'connected') return { evaluable: true, wanted: String(raw).startsWith('Connected') }
	if (oracle.kind === 'bool' || oracle.kind === 'optionalBool') {
		const value = canonicalBool(raw)
		return { evaluable: value !== null, wanted: value === 'true' }
	}
	if (oracle.kind === 'equals') return { evaluable: true, wanted: String(raw) === String(oracle.value) }
	if (oracle.kind === 'threshold') {
		const number = Number(raw)
		if (!Number.isFinite(number) || !Number.isFinite(oracle.threshold)) return { evaluable: false, wanted: false }
		return { evaluable: true, wanted: number >= oracle.threshold }
	}
	return { evaluable: false, wanted: false }
}

function definitionCounter(map, definitionId) {
	if (!map[definitionId]) map[definitionId] = { total: 0, pass: 0, evalOnly: 0, fail: 0 }
	return map[definitionId]
}

async function sweepFeedbacksV6(baseUrl, label, r9, report, phase) {
	line(
		'INFO',
		'Feedback sweep',
		`${phase}: ${r9.probes.length} probes / ${new Set(r9.probes.map((p) => p.definitionId)).size} definitions`,
	)
	let pass = 0
	let evalOnly = 0
	let fail = 0
	let completed = 0
	const definitions = {}
	await mapLimit(r9.probes, 20, async (probe) => {
		const counts = definitionCounter(definitions, probe.definitionId)
		counts.total++
		const marker = await readFeedbackMarker(baseUrl, r9.pageNumber, probe)
		const oracle = feedbackOracle(probe)
		let status = 'EVAL_ONLY'
		let detail = `definition=${probe.definitionId}; marker=${marker || '?'}`
		if (!marker) {
			status = 'FAIL'
			detail += '; unresolved rendered feedback marker'
			fail++
			counts.fail++
		} else if (oracle.kind === 'unmapped') {
			evalOnly++
			counts.evalOnly++
			detail += '; independent oracle is not mapped yet'
		} else {
			const item = await readVariableOptional(baseUrl, label, oracle.source, 2500)
			if (!item.exists || item.value === '') {
				evalOnly++
				counts.evalOnly++
				detail += `; independent server state unavailable (${oracle.source})`
			} else {
				const evaluated = evaluateOracle(oracle, item.value)
				if (!evaluated.evaluable) {
					evalOnly++
					counts.evalOnly++
					detail += `; independent server state could not be evaluated (${oracle.source})`
				} else {
					const actual = marker === 'T'
					if (actual === evaluated.wanted) {
						status = 'PASS'
						pass++
						counts.pass++
					} else {
						status = 'FAIL'
						fail++
						counts.fail++
					}
					detail += `; expected=${evaluated.wanted ? 'T' : 'F'}; source=${oracle.source}`
				}
			}
		}
		report.add(phase, `fb:${probe.row}/${probe.column}`, status, detail)
		completed++
		if (completed % 100 === 0) line('INFO', 'Feedback progress', `${completed}/${r9.probes.length}`)
	})
	line(fail ? 'FAIL' : 'PASS', 'Feedback sweep result', `PASS=${pass} EVAL_ONLY=${evalOnly} FAIL=${fail}`)
	return { pass, evalOnly, fail, total: r9.probes.length, definitions }
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

async function observeMeterDynamics({ baseUrl, label, r9, enabled, durationMs = 20000 }) {
	const probes = r9.probes.filter((probe) => METER_DEFINITIONS.has(probe.definitionId))
	if (!probes.length) {
		return { attempted: false, skipped: true, total: 0, bothStates: 0, singleState: 0, fail: 0 }
	}
	if (!enabled) {
		return {
			attempted: false,
			skipped: true,
			total: probes.length,
			bothStates: 0,
			singleState: probes.length,
			fail: 0,
		}
	}

	console.log('')
	console.log('MANUAL FEEDBACK - METERS')
	console.log('Pendant la fenetre, fais du silence puis du signal sur autant de chemins reels que possible.')
	console.log('Le TestBench ne change aucun routing dans cette phase. Les meters non traverses resteront MANUAL_PENDING.')
	const answer = (await askManual('Tape READY puis Entree pour lancer 20 s de capture, ou SKIP : ')).toUpperCase()
	if (answer !== 'READY') {
		return {
			attempted: false,
			skipped: true,
			total: probes.length,
			bothStates: 0,
			singleState: probes.length,
			fail: 0,
		}
	}

	const state = new Map(
		probes.map((probe) => [`${probe.row}/${probe.column}`, { seenTrue: false, seenFalse: false, mismatch: false }]),
	)
	const deadline = Date.now() + durationMs
	while (Date.now() < deadline) {
		await mapLimit(probes, 16, async (probe) => {
			const key = `${probe.row}/${probe.column}`
			const track = state.get(key)
			const marker = await readFeedbackMarker(baseUrl, r9.pageNumber, probe)
			const oracle = feedbackOracle(probe)
			const item = await readVariableOptional(baseUrl, label, oracle.source, 1500)
			if (!marker || !item.exists || item.value === '') return
			const evaluated = evaluateOracle(oracle, item.value)
			if (!evaluated.evaluable) return
			const actual = marker === 'T'
			if (actual !== evaluated.wanted) track.mismatch = true
			else if (actual) track.seenTrue = true
			else track.seenFalse = true
		})
		await sleep(250)
	}

	let bothStates = 0
	let singleState = 0
	let fail = 0
	for (const track of state.values()) {
		if (track.mismatch) fail++
		if (track.seenTrue && track.seenFalse) bothStates++
		else singleState++
	}
	return { attempted: true, skipped: false, total: probes.length, bothStates, singleState, fail }
}

async function observeMonitorGain({ baseUrl, label, enabled }) {
	const before = await readVariableOptional(baseUrl, label, 'monitor_gain', 2500)
	if (!before.exists || before.value === '') {
		return { status: 'SKIP_NO_CAPABILITY', changed: false, restored: false }
	}
	if (!enabled) return { status: 'MANUAL_PENDING', changed: false, restored: false }

	console.log('')
	console.log('MANUAL READ-ONLY - MONITOR GAIN 1677')
	console.log('Aucun write logiciel ne sera envoye. Cette phase observe seulement la valeur serveur pendant ton geste physique.')
	const answer = (
		await askManual('Tourne legerement le bouton physique Monitor, puis tape MOVED + Entree, ou SKIP : ')
	).toUpperCase()
	if (answer !== 'MOVED') return { status: 'MANUAL_PENDING', changed: false, restored: false }

	let changed = false
	for (let attempt = 0; attempt < 20; attempt++) {
		const current = await readVariableOptional(baseUrl, label, 'monitor_gain', 1200)
		if (current.exists && current.value !== '' && String(current.value) !== String(before.value)) {
			changed = true
			break
		}
		await sleep(100)
	}

	await askManual('Remets maintenant le bouton Monitor a sa position de depart, puis appuie sur Entree : ')
	let restored = false
	for (let attempt = 0; attempt < 30; attempt++) {
		const current = await readVariableOptional(baseUrl, label, 'monitor_gain', 1200)
		if (current.exists && String(current.value) === String(before.value)) {
			restored = true
			break
		}
		await sleep(100)
	}
	if (!changed) return { status: 'FAIL_NO_EFFECT', changed: false, restored }
	return { status: restored ? 'PASS_MANUAL' : 'MANUAL_PENDING', changed: true, restored }
}

module.exports = {
	METER_DEFINITIONS,
	feedbackOracle,
	evaluateOracle,
	sweepFeedbacksV6,
	observeMeterDynamics,
	observeMonitorGain,
}

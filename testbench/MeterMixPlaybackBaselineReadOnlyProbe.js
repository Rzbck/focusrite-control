'use strict'

const fs = require('node:fs')
const path = require('node:path')
const readline = require('node:readline/promises')
const { stdin, stdout } = require('node:process')
const { line, sleep, nowIso, resultsDir, readVariableOptional } = require('./FullTestBenchBase')
const { laneBase } = require('./FullTestBenchAudit')
const { Reporter } = require('./FullTestBenchCorePhases')
const { prepareLab } = require('./FullTestBenchRunnerV4Preflight')
const { detectPlaybackSource } = require('./MeterRoutingClosure')

const OBSERVE_SECONDS = 30
const REPORT_PATH = path.join(resultsDir, 'LATEST_METER_MIX_BASELINE_READONLY.json')
const RELATIVE_REPORT = 'testbench\\results\\LATEST_METER_MIX_BASELINE_READONLY.json'

async function ask(prompt) {
	if (!stdin.isTTY || !stdout.isTTY) return 'DONE'
	const rl = readline.createInterface({ input: stdin, output: stdout })
	try {
		return String(await rl.question(prompt))
			.trim()
			.toUpperCase()
	} finally {
		rl.close()
	}
}

function laneVariables(lane, slot) {
	const base = laneBase(lane)
	return {
		gain: `${base}_slot_${slot}_gain`,
		mute: `${base}_slot_${slot}_mute`,
		solo: `${base}_slot_${slot}_solo`,
	}
}

function known(item) {
	return Boolean(
		item?.exists && item.value !== null && item.value !== undefined && String(item.value).trim() !== '',
	)
}

function classifyObservation(sample) {
	return {
		gainKnown: known(sample.gain),
		muteKnown: known(sample.mute),
		soloKnown: known(sample.solo),
		exactBaseline: known(sample.gain) && known(sample.mute) && known(sample.solo),
	}
}

async function readLane(baseUrl, label, lane, slot) {
	const variables = laneVariables(lane, slot)
	const [gain, mute, solo] = await Promise.all([
		readVariableOptional(baseUrl, label, variables.gain, 1800),
		readVariableOptional(baseUrl, label, variables.mute, 1800),
		readVariableOptional(baseUrl, label, variables.solo, 1800),
	])
	return classifyObservation({ gain, mute, solo })
}

async function readAll(baseUrl, label, lanes, slot) {
	const rows = []
	for (const lane of lanes) {
		rows.push({ lane, ...(await readLane(baseUrl, label, lane, slot)) })
	}
	return rows
}

function mergeObserved(target, sample) {
	for (const row of sample) {
		const key = `${row.lane.mix}/${row.lane.side}`
		const current = target.get(key) || {
			lane: row.lane,
			gainKnown: false,
			muteKnown: false,
			soloKnown: false,
			exactBaseline: false,
		}
		current.gainKnown ||= row.gainKnown
		current.muteKnown ||= row.muteKnown
		current.soloKnown ||= row.soloKnown
		current.exactBaseline ||= row.exactBaseline
		target.set(key, current)
	}
}

function printRows(title, rows) {
	console.log('')
	console.log(title)
	for (const row of rows) {
		line(
			'INFO',
			`Mix ${row.lane.mix} ${row.lane.side}`,
			`gain=${row.gainKnown ? 'KNOWN' : 'UNKNOWN'} mute=${row.muteKnown ? 'KNOWN' : 'UNKNOWN'} solo=${row.soloKnown ? 'KNOWN' : 'UNKNOWN'} exact=${row.exactBaseline ? 'YES' : 'NO'}`,
		)
	}
}

function writeReport({ playback, initial, observed }) {
	fs.mkdirSync(resultsDir, { recursive: true })
	const payload = {
		reportVersion: 1,
		reportClass: 'meter-mix-baseline-readonly-sanitized',
		updatedAt: nowIso(),
		readOnly: true,
		hardwareWrites: false,
		companionButtonPresses: false,
		page2Replacement: false,
		playback: { slot: playback.slot, name: playback.name, stereo: playback.stereo },
		initial: initial.map((row) => ({
			mix: row.lane.mix,
			side: row.lane.side,
			gainKnown: row.gainKnown,
			muteKnown: row.muteKnown,
			soloKnown: row.soloKnown,
			exactBaseline: row.exactBaseline,
		})),
		observed: observed.map((row) => ({
			mix: row.lane.mix,
			side: row.lane.side,
			gainKnown: row.gainKnown,
			muteKnown: row.muteKnown,
			soloKnown: row.soloKnown,
			exactBaseline: row.exactBaseline,
		})),
		privacy: 'No values, item IDs, serial, hostname, endpoint, client identity, raw XML or user path is stored.',
	}
	fs.writeFileSync(REPORT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
}

async function main() {
	console.log('==================================================================')
	console.log(' FOCUSRITE 18i20 MIX BASELINE - READ-ONLY OBSERVATION')
	console.log('==================================================================')
	console.log('Aucun bouton Companion presse. Aucun write Focusrite. Aucun routing modifie.')
	console.log('Ne touche a aucun fader, mute, solo, source, routing ou setting Focusrite.')
	console.log('')

	const reporter = new Reporter()
	const ctx = await prepareLab(reporter)
	if (ctx.prep === 'mixer-variables') {
		throw new Error('Expose all mixer slot variables must remain enabled before baseline observation.')
	}
	if (ctx.prep !== null || !ctx.ext || ctx.ext.pageNumber !== 2) {
		throw new Error('Read-only baseline observation requires the current V8 capability-lab Page 2.')
	}

	const playback = await detectPlaybackSource(ctx.baseUrl, ctx.label, ctx.snapshot)
	line(
		'PASS',
		'Playback source',
		`existing mixer slot ${playback.slot} :: ${playback.name}${playback.stereo ? ' / stereo' : ''}`,
	)

	const initial = await readAll(ctx.baseUrl, ctx.label, ctx.snapshot.shape.lanes, playback.slot)
	printRows('ETAT INITIAL', initial)

	console.log('')
	console.log(
		'Pendant l observation, navigue uniquement entre les onglets Mix A a Mix F dans Focusrite Control.',
	)
	console.log('Ne modifie aucun controle. Cette navigation UI est la seule interaction demandee.')
	const answer = await ask('Tape NAVIGATE_MIXES pour lancer l observation read-only, ou DONE : ')
	if (answer !== 'NAVIGATE_MIXES') {
		console.log('OBSERVATION ANNULEE - aucun write hardware n a ete effectue.')
		return
	}

	const observed = new Map()
	mergeObserved(observed, initial)
	for (let second = 0; second < OBSERVE_SECONDS; second++) {
		const sample = await readAll(ctx.baseUrl, ctx.label, ctx.snapshot.shape.lanes, playback.slot)
		mergeObserved(observed, sample)
		if ((second + 1) % 5 === 0) {
			line('INFO', 'Observation progress', `${second + 1}/${OBSERVE_SECONDS} s`)
		}
		await sleep(1000)
	}

	const finalRows = [...observed.values()]
	printRows('ETAT OBSERVE', finalRows)
	writeReport({ playback, initial, observed: finalRows })
	console.log('')
	console.log(`Rapport local sanitise: ${RELATIVE_REPORT}`)
	console.log('READ-ONLY BASELINE OBSERVATION TERMINEE - aucun write hardware n a ete effectue.')
}

if (require.main === module) {
	main().catch((error) => {
		console.error(`READ-ONLY BASELINE PROBE BLOCKED - ${error.message}`)
		console.error('Aucun write hardware ne doit avoir ete effectue par ce probe.')
		process.exitCode = 2
	})
}

module.exports = {
	OBSERVE_SECONDS,
	laneVariables,
	known,
	classifyObservation,
	mergeObserved,
}

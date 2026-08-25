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

function laneProvenanceVariables(lane, slot) {
	const values = laneVariables(lane, slot)
	return {
		gain: `${values.gain}_provenance`,
		mute: `${values.mute}_provenance`,
		solo: `${values.solo}_provenance`,
	}
}

function known(item) {
	return Boolean(item?.exists && item.value !== null && item.value !== undefined && String(item.value).trim() !== '')
}

function provenanceFlags(item) {
	const raw = item?.exists ? String(item.value ?? '').trim() : ''
	if (!raw) return { arrivalObserved: false, setObserved: false }
	if (raw === 'arrival') return { arrivalObserved: true, setObserved: false }
	if (raw === 'set') return { arrivalObserved: false, setObserved: true }
	if (raw === 'arrival+set') return { arrivalObserved: true, setObserved: true }
	throw new Error(`Unexpected state provenance marker: ${raw}`)
}

function provenanceLabel(arrivalObserved, setObserved) {
	if (arrivalObserved && setObserved) return 'arrival+set'
	if (arrivalObserved) return 'arrival'
	if (setObserved) return 'set'
	return 'never-observed'
}

function classifyObservation(sample) {
	const gainProvenance = provenanceFlags(sample.gainProvenance)
	const muteProvenance = provenanceFlags(sample.muteProvenance)
	const soloProvenance = provenanceFlags(sample.soloProvenance)
	return {
		gainSchemaPresent: Boolean(sample.gain?.exists),
		muteSchemaPresent: Boolean(sample.mute?.exists),
		soloSchemaPresent: Boolean(sample.solo?.exists),
		gainKnown: known(sample.gain),
		muteKnown: known(sample.mute),
		soloKnown: known(sample.solo),
		gainArrivalObserved: gainProvenance.arrivalObserved,
		gainSetObserved: gainProvenance.setObserved,
		muteArrivalObserved: muteProvenance.arrivalObserved,
		muteSetObserved: muteProvenance.setObserved,
		soloArrivalObserved: soloProvenance.arrivalObserved,
		soloSetObserved: soloProvenance.setObserved,
		exactBaseline: known(sample.gain) && known(sample.mute) && known(sample.solo),
	}
}

async function readLane(baseUrl, label, lane, slot) {
	const variables = laneVariables(lane, slot)
	const provenanceVariables = laneProvenanceVariables(lane, slot)
	const [gain, mute, solo, gainProvenance, muteProvenance, soloProvenance] = await Promise.all([
		readVariableOptional(baseUrl, label, variables.gain, 1800),
		readVariableOptional(baseUrl, label, variables.mute, 1800),
		readVariableOptional(baseUrl, label, variables.solo, 1800),
		readVariableOptional(baseUrl, label, provenanceVariables.gain, 1800),
		readVariableOptional(baseUrl, label, provenanceVariables.mute, 1800),
		readVariableOptional(baseUrl, label, provenanceVariables.solo, 1800),
	])
	if (!gainProvenance.exists || !muteProvenance.exists || !soloProvenance.exists) {
		throw new Error(
			'State provenance instrumentation is not exposed by the loaded Companion module. Validate/load the current branch build before this read-only probe.',
		)
	}
	return classifyObservation({ gain, mute, solo, gainProvenance, muteProvenance, soloProvenance })
}

async function readAll(baseUrl, label, lanes, slot) {
	const rows = []
	for (const lane of lanes) {
		rows.push({ lane, ...(await readLane(baseUrl, label, lane, slot)) })
	}
	return rows
}

async function readOutputRouting(baseUrl, label, outputCount) {
	const rows = []
	for (let index = 1; index <= outputCount; index++) {
		const [name, sourceName, stereo] = await Promise.all([
			readVariableOptional(baseUrl, label, `output_${index}_name`, 1800),
			readVariableOptional(baseUrl, label, `output_${index}_source_name`, 1800),
			readVariableOptional(baseUrl, label, `output_${index}_stereo`, 1800),
		])
		if (!name.exists) continue
		rows.push({
			index,
			name: known(name) ? String(name.value) : `Output ${index}`,
			sourceKnown: known(sourceName),
			sourceName: known(sourceName) ? String(sourceName.value) : '',
			stereoKnown: known(stereo),
			stereo: known(stereo) ? String(stereo.value) : '',
		})
	}
	return rows
}

function mergeObserved(target, sample) {
	for (const row of sample) {
		const key = `${row.lane.mix}/${row.lane.side}`
		const current = target.get(key) || {
			lane: row.lane,
			gainSchemaPresent: false,
			muteSchemaPresent: false,
			soloSchemaPresent: false,
			gainKnown: false,
			muteKnown: false,
			soloKnown: false,
			gainArrivalObserved: false,
			gainSetObserved: false,
			muteArrivalObserved: false,
			muteSetObserved: false,
			soloArrivalObserved: false,
			soloSetObserved: false,
			exactBaseline: false,
		}
		for (const property of [
			'gainSchemaPresent',
			'muteSchemaPresent',
			'soloSchemaPresent',
			'gainKnown',
			'muteKnown',
			'soloKnown',
			'gainArrivalObserved',
			'gainSetObserved',
			'muteArrivalObserved',
			'muteSetObserved',
			'soloArrivalObserved',
			'soloSetObserved',
			'exactBaseline',
		]) {
			current[property] ||= Boolean(row[property])
		}
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
			`gain=${row.gainKnown ? 'KNOWN' : 'UNKNOWN'}[${provenanceLabel(row.gainArrivalObserved, row.gainSetObserved)}] mute=${row.muteKnown ? 'KNOWN' : 'UNKNOWN'}[${provenanceLabel(row.muteArrivalObserved, row.muteSetObserved)}] solo=${row.soloKnown ? 'KNOWN' : 'UNKNOWN'}[${provenanceLabel(row.soloArrivalObserved, row.soloSetObserved)}] exact=${row.exactBaseline ? 'YES' : 'NO'}`,
		)
	}
}

function printOutputRouting(rows) {
	console.log('')
	console.log('OUTPUT ROUTING SNAPSHOT - SERVER-CONFIRMED COMPANION VARIABLES')
	for (const row of rows) {
		line(
			'INFO',
			row.name,
			`source=${row.sourceKnown ? row.sourceName : 'UNKNOWN'} stereo=${row.stereoKnown ? row.stereo : 'UNKNOWN'}`,
		)
	}
}

function reportRow(row) {
	return {
		mix: row.lane.mix,
		side: row.lane.side,
		gainSchemaPresent: row.gainSchemaPresent,
		muteSchemaPresent: row.muteSchemaPresent,
		soloSchemaPresent: row.soloSchemaPresent,
		gainKnown: row.gainKnown,
		muteKnown: row.muteKnown,
		soloKnown: row.soloKnown,
		gainProvenance: provenanceLabel(row.gainArrivalObserved, row.gainSetObserved),
		muteProvenance: provenanceLabel(row.muteArrivalObserved, row.muteSetObserved),
		soloProvenance: provenanceLabel(row.soloArrivalObserved, row.soloSetObserved),
		exactBaseline: row.exactBaseline,
	}
}

function reportOutputRouting(row) {
	return {
		index: row.index,
		name: row.name,
		sourceKnown: row.sourceKnown,
		sourceName: row.sourceName,
		stereoKnown: row.stereoKnown,
		stereo: row.stereo,
	}
}

function writeReport({ playback, outputRouting, initial, observed }) {
	fs.mkdirSync(resultsDir, { recursive: true })
	const payload = {
		reportVersion: 2,
		reportClass: 'meter-mix-baseline-readonly-sanitized',
		updatedAt: nowIso(),
		readOnly: true,
		hardwareWrites: false,
		companionButtonPresses: false,
		page2Replacement: false,
		playback: { slot: playback.slot, name: playback.name, stereo: playback.stereo },
		outputRouting: outputRouting.map(reportOutputRouting),
		initial: initial.map(reportRow),
		observed: observed.map(reportRow),
		privacy: 'No raw values, item IDs, serial, hostname, endpoint, client identity, raw XML or user path is stored.',
	}
	fs.writeFileSync(REPORT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
}

async function main() {
	console.log('==================================================================')
	console.log(' FOCUSRITE 18i20 MIX STATE PROVENANCE - READ-ONLY OBSERVATION')
	console.log('==================================================================')
	console.log('Aucun bouton Companion presse. Aucun write Focusrite. Aucun routing modifie.')
	console.log('Le probe observe uniquement la presence schema et la provenance arrival/set deja recue par Companion.')
	console.log('Ne touche a aucun fader, mute, solo, source, routing ou setting Focusrite.')
	console.log('')

	const reporter = new Reporter()
	const ctx = await prepareLab(reporter)
	if (ctx.prep === 'mixer-variables') {
		throw new Error('Expose all mixer slot variables must remain enabled before baseline observation.')
	}
	if (ctx.prep !== null && ctx.prep !== 'harness') {
		throw new Error(`Unexpected read-only preparation state: ${ctx.prep}.`)
	}
	if (ctx.prep === 'harness') {
		line(
			'INFO',
			'Capability Lab Page 2',
			'not required for this read-only probe; continuing from the fresh server-confirmed snapshot',
		)
	}

	const playback = await detectPlaybackSource(ctx.baseUrl, ctx.label, ctx.snapshot)
	line(
		'PASS',
		'Playback source',
		`existing mixer slot ${playback.slot} :: ${playback.name}${playback.stereo ? ' / stereo' : ''}`,
	)

	const outputRouting = await readOutputRouting(ctx.baseUrl, ctx.label, ctx.snapshot.shape.outputs.length)
	printOutputRouting(outputRouting)

	const initial = await readAll(ctx.baseUrl, ctx.label, ctx.snapshot.shape.lanes, playback.slot)
	printRows('ETAT INITIAL + PROVENANCE', initial)

	console.log('')
	console.log('La navigation seule entre sorties a deja ete observee sans nouvelle materialisation mute/solo.')
	console.log(
		'Tape DONE pour conserver ce snapshot read-only, ou NAVIGATE_MIXES seulement si tu veux reproduire ce constat.',
	)
	const answer = await ask('Choix DONE / NAVIGATE_MIXES : ')
	if (answer !== 'NAVIGATE_MIXES') {
		writeReport({ playback, outputRouting, initial, observed: initial })
		console.log('')
		console.log(`Rapport local sanitise: ${RELATIVE_REPORT}`)
		console.log('SNAPSHOT READ-ONLY TERMINE - aucun write hardware n a ete effectue.')
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
	printRows('ETAT OBSERVE + PROVENANCE', finalRows)
	writeReport({ playback, outputRouting, initial, observed: finalRows })
	console.log('')
	console.log(`Rapport local sanitise: ${RELATIVE_REPORT}`)
	console.log('READ-ONLY STATE PROVENANCE TERMINEE - aucun write hardware n a ete effectue.')
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
	laneProvenanceVariables,
	known,
	provenanceFlags,
	provenanceLabel,
	classifyObservation,
	readOutputRouting,
	mergeObserved,
	printOutputRouting,
	reportRow,
	reportOutputRouting,
}

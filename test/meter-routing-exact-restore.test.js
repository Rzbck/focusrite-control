'use strict'

const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const test = require('node:test')
const assert = require('node:assert/strict')

const { METER_DRIVE_GAIN_DB, augmentMeterRoutingHarness } = require('../testbench/MeterRoutingPage')
const {
	ALLOW_ROUTING_FLAG,
	ISOLATION_FLAG,
	choosePlaybackCandidate,
	laneExactRestorable,
	pairExactRestorable,
} = require('../testbench/MeterRoutingClosure')

const repoRoot = path.join(__dirname, '..')

function clone(value) {
	return JSON.parse(JSON.stringify(value))
}

function syntheticBuilt() {
	return {
		signature: 'synthetic-meter-routing',
		batches: [],
		locations: {},
		file: {
			page: {
				name: 'Synthetic meter routing',
				controls: {},
				gridSize: { minColumn: 0, maxColumn: 45, minRow: 0, maxRow: 0 },
			},
		},
	}
}

function syntheticSnapshot() {
	const values = {}
	for (let slot = 1; slot <= 24; slot++) {
		values[`mix_mix_a_l_slot_${slot}_gain`] = { exists: true, value: '-40' }
		values[`mix_mix_a_l_slot_${slot}_mute`] = { exists: true, value: 'false' }
		values[`mix_mix_a_l_slot_${slot}_solo`] = { exists: true, value: 'false' }
	}
	for (let output = 1; output <= 6; output++) {
		values[`output_${output}_source`] = { exists: true, value: String(100 + output) }
	}
	return {
		shape: {
			lanes: [{ mix: 'Mix A', side: 'left' }],
			outputs: [0, 1, 2, 3, 4, 5],
		},
		values,
	}
}

test('meter routing augments lanes with gain-only drive and filters unavailable output pairs', () => {
	const built = syntheticBuilt()
	const snapshot = syntheticSnapshot()
	const profile = {
		outputPairs: [
			[0, 1],
			[2, 3],
			[4, 5],
		],
	}
	const outputEligibility = [
		{ output: 0, availability: 'AVAILABLE' },
		{ output: 1, availability: 'AVAILABLE' },
		{ output: 2, availability: 'UNKNOWN' },
		{ output: 3, availability: 'AVAILABLE' },
		{ output: 4, availability: 'UNAVAILABLE' },
		{ output: 5, availability: 'AVAILABLE' },
	]
	const result = augmentMeterRoutingHarness(built, snapshot, profile, outputEligibility, '555')
	assert.equal(result.laneBatches.length, 1)
	const lane = result.built.batches.find((batch) => batch.id === 'meter-route-mixa-l-gain-drive')
	assert.ok(lane)
	assert.equal(lane.specs.length, 24)
	assert.ok(lane.specs.every((item) => item.definitionId === 'mix_gain_set'))
	assert.ok(lane.specs.every((item) => item.options.level === METER_DRIVE_GAIN_DB))
	assert.deepEqual(
		result.pairBatches.map((entry) => `${entry.left}-${entry.right}`),
		['0-1'],
	)
})

test('meter routing appended actions never add Mixer Slot Source or unsafe write families', () => {
	const built = syntheticBuilt()
	const snapshot = syntheticSnapshot()
	const result = augmentMeterRoutingHarness(
		built,
		snapshot,
		{ outputPairs: [[0, 1]] },
		[
			{ output: 0, availability: 'AVAILABLE' },
			{ output: 1, availability: 'AVAILABLE' },
		],
		'555',
	)
	const definitions = result.built.batches.flatMap((batch) => batch.specs.map((item) => item.definitionId))
	assert.ok(definitions.every((id) => ['mix_gain_set', 'output_pair_source'].includes(id)))
	for (const forbidden of [
		'mixer_slot_source',
		'advanced_raw_set',
		'monitor_gain_set',
		'device_preset',
		'clock_source',
		'sample_rate',
		'spdif_mode',
	]) {
		assert.equal(definitions.includes(forbidden), false)
	}
})

test('lane exact-restore eligibility requires known gain/mute/solo baselines and at least one gain', () => {
	const lane = { mix: 'Mix A', side: 'left' }
	const snapshot = syntheticSnapshot()
	assert.equal(laneExactRestorable(snapshot, lane), true)

	const blankGain = clone(snapshot)
	blankGain.values.mix_mix_a_l_slot_4_gain.value = ''
	assert.equal(laneExactRestorable(blankGain, lane), false)

	const invalidMute = clone(snapshot)
	invalidMute.values.mix_mix_a_l_slot_7_mute.value = 'unknown'
	assert.equal(laneExactRestorable(invalidMute, lane), false)

	const noGain = clone(snapshot)
	for (const key of Object.keys(noGain.values)) {
		if (/_gain$/.test(key)) noGain.values[key].exists = false
	}
	assert.equal(laneExactRestorable(noGain, lane), false)
})

test('output pair exact-restore eligibility requires both original source baselines', () => {
	const snapshot = syntheticSnapshot()
	assert.equal(pairExactRestorable(snapshot, 0, 1), true)
	const missing = clone(snapshot)
	missing.values.output_2_source.value = ''
	assert.equal(pairExactRestorable(missing, 0, 1), false)
	const absent = clone(snapshot)
	absent.values.output_1_source.exists = false
	assert.equal(pairExactRestorable(absent, 0, 1), false)
})

test('Playback selection prefers an existing stereo Playback slot and ignores unrelated sources', () => {
	const chosen = choosePlaybackCandidate([
		{ slot: 1, raw: '10', name: 'Analogue 1', stereo: false },
		{ slot: 5, raw: '20', name: 'Playback 3', stereo: false },
		{ slot: 7, raw: '30', name: 'Playback 1-2', stereo: true },
		{ slot: 3, raw: '0', name: 'Playback invalid', stereo: true },
	])
	assert.deepEqual(chosen, { slot: 7, raw: '30', name: 'Playback 1-2', stereo: true })
	assert.equal(choosePlaybackCandidate([{ slot: 1, raw: '10', name: 'Analogue 1', stereo: false }]), null)
})

test('meter routing campaign has no direct Focusrite protocol write or forbidden action escape hatch', () => {
	const source = fs.readFileSync(path.join(repoRoot, 'testbench', 'MeterRoutingClosure.js'), 'utf8')
	assert.doesNotMatch(source, /<set\b/i)
	assert.doesNotMatch(source, /\bsetValue\s*\(/)
	assert.doesNotMatch(source, /definitionId\s*:\s*['"]mixer_slot_source['"]/)
	assert.doesNotMatch(source, /definitionId\s*:\s*['"]advanced_raw_set['"]/)
	assert.doesNotMatch(source, /definitionId\s*:\s*['"]device_preset['"]/)
	assert.match(source, /activeChanges\.size === 0/)
	assert.match(source, /ctx\.prep !== null \|\| !ctx\.ext \|\| ctx\.ext\.pageNumber !== 2/)
})

test('meter routing requires both explicit write permission and physical isolation flags', () => {
	assert.equal(ALLOW_ROUTING_FLAG, '--allow-routing-writes')
	assert.equal(ISOLATION_FLAG, '--confirm-all-output-routing-isolated')
	const source = fs.readFileSync(path.join(repoRoot, 'testbench', 'MeterRoutingClosure.js'), 'utf8')
	assert.match(source, /process\.argv\.includes\(ALLOW_ROUTING_FLAG\)/)
	assert.match(source, /process\.argv\.includes\(ISOLATION_FLAG\)/)
})

test('temporary Page 2 replacement preserves Page 1, other pages and the existing connection set', () => {
	const source = fs.readFileSync(path.join(repoRoot, 'testbench', 'MeterRoutingPageImport.js'), 'utf8')
	assert.match(source, /resolveAuditedR9Page/)
	assert.match(source, /hashPagesExcept/)
	assert.match(source, /sameConnectionSet/)
	assert.match(source, /targetPage:\s*2/)
	assert.match(source, /ext\.connection\.id !== r9\.connection\.id/)
	assert.doesNotMatch(source, /\/api\/location\//)
	assert.doesNotMatch(source, /<set\b/i)
})

test('Windows meter routing launcher requires operator confirmations and is stored as canonical LF in Git', () => {
	const launcherPath = path.join(repoRoot, 'testbench', 'RUN_METER_ROUTING_EXACT_RESTORE.cmd')
	const source = fs.readFileSync(launcherPath, 'utf8')
	assert.match(source, /ROUTE_METERS/)
	assert.match(source, /ALL_ISOLATED/)
	assert.match(source, /--allow-routing-writes --confirm-all-output-routing-isolated/)
	assert.match(source, /availability UNKNOWN/i)
	assert.match(source, /Monitor gain 1677/i)
	const blob = execFileSync('git', ['show', 'HEAD:testbench/RUN_METER_ROUTING_EXACT_RESTORE.cmd'], {
		cwd: repoRoot,
		windowsHide: true,
	})
	assert.equal(blob.includes(0x0d), false)
})

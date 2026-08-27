'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const {
	known,
	boolProbe,
	numericProbe,
	customMixTargets,
	mixerSlotTargets,
	altTargets,
	outputStereoTargets,
	targetsForMode,
	diffSnapshot,
	executeTarget,
	summary,
} = require('../testbench/FullTestBenchWritePromotion')

function fakeClient(values) {
	return { getValue: (id) => values.get(String(id)) }
}

function fakeDevice() {
	let id = 1000
	const values = new Map()
	const next = (value) => {
		const itemId = String(id++)
		values.set(itemId, String(value))
		return itemId
	}
	const mixes = []
	for (let lane = 0; lane < 12; lane++) {
		const inputs = []
		for (let slot = 0; slot < 24; slot++) {
			inputs.push({
				gain: next(-12),
				pan: next(32768),
				mute: next(false),
				solo: next(false),
			})
		}
		mixes.push({
			label: `Custom ${Math.floor(lane / 2) + 1} ${lane % 2 === 0 ? 'L' : 'R'}`,
			talkback: next(false),
			inputs,
		})
	}
	const mixerSlots = []
	for (let slot = 0; slot < 24; slot++) mixerSlots.push({ index: slot, source: next(1), stereo: next(false) })
	const sources = [
		{ id: '1', name: 'Analogue 1', hidden: false },
		{ id: '2', name: 'Analogue 2', hidden: false },
	]
	const altEnable = next(false)
	const alt = next(false)
	const outputs = [
		{ index: 0, pairSide: 'L', stereo: next(false), available: next(true) },
		{ index: 1, pairSide: 'R', stereo: next(false), available: next(true) },
		{ index: 2, pairSide: 'L', stereo: next(true), available: next(false) },
		{ index: 3, pairSide: 'R', stereo: next(true), available: next(false) },
	]
	return {
		device: { mixes, mixerSlots, sources, monitoring: { altEnable, alt }, outputs },
		values,
	}
}

test('probe value helpers fail closed and choose reversible values', () => {
	assert.equal(known('0'), true)
	assert.equal(known(''), false)
	assert.equal(boolProbe('true'), 'false')
	assert.equal(boolProbe('false'), 'true')
	assert.equal(boolProbe('unknown'), null)
	assert.equal(numericProbe('6', -128, 6, 1), '5')
	assert.equal(numericProbe('-128', -128, 6, 1), '-127')
	assert.equal(numericProbe('bad', -128, 6, 1), null)
})

test('custom mix plan covers every lane and every slot number exactly once per property family', () => {
	const { device, values } = fakeDevice()
	const targets = customMixTargets(device, fakeClient(values))
	assert.equal(targets.length, 108)
	const talkback = targets.filter((target) => target.family === 'mix_talkback')
	assert.equal(talkback.length, 12)
	for (const family of ['mix_mute', 'mix_solo', 'mix_gain', 'mix_pan']) {
		const familyTargets = targets.filter((target) => target.family === family)
		assert.equal(familyTargets.length, 24)
		assert.deepEqual(
			familyTargets.map((target) => target.slotNumber).sort((a, b) => a - b),
			Array.from({ length: 24 }, (_, index) => index + 1),
		)
		assert.equal(new Set(familyTargets.map((target) => target.laneIndex)).size, 12)
		assert.equal(familyTargets.every((target) => target.status === 'READY'), true)
	}
})

test('mixer slot plan exhaustively covers source and stereo on all 24 slots', () => {
	const { device, values } = fakeDevice()
	const targets = mixerSlotTargets(device, fakeClient(values))
	assert.equal(targets.length, 48)
	assert.equal(targets.filter((target) => target.family === 'mixer_slot_source').length, 24)
	assert.equal(targets.filter((target) => target.family === 'mixer_slot_stereo').length, 24)
	assert.equal(targets.every((target) => target.status === 'READY'), true)
})

test('ALT and output stereo plans stay availability-aware', () => {
	const { device, values } = fakeDevice()
	assert.equal(altTargets(device, fakeClient(values)).every((target) => target.status === 'READY'), true)
	const stereo = outputStereoTargets(device, fakeClient(values))
	assert.equal(stereo.length, 2)
	assert.equal(stereo[0].status, 'READY')
	assert.equal(stereo[1].status, 'SKIP_CONFIGURATION_UNAVAILABLE')
})

test('all-nondisruptive mode never introduces forbidden/disruptive families', () => {
	const { device, values } = fakeDevice()
	const targets = targetsForMode('all-nondisruptive', device, fakeClient(values))
	const families = new Set(targets.map((target) => target.family))
	for (const forbidden of [
		'output_pair_source',
		'assign_mix',
		'monitor_gain',
		'device_preset',
		'clock_source',
		'sample_rate',
		'spdif_mode',
		'advanced_raw_set',
	]) {
		assert.equal(families.has(forbidden), false)
	}
})

test('collateral snapshot diff ignores only the explicit target', () => {
	const before = new Map([
		['1', 'a'],
		['2', 'b'],
		['3', 'c'],
	])
	const after = new Map([
		['1', 'x'],
		['2', 'b'],
		['3', 'z'],
	])
	assert.deepEqual(diffSnapshot(before, after, new Set(['1'])), ['3'])
})

test('a transmitted no-transition write is still explicitly restored before failure is returned', async () => {
	const state = new Map([
		['1', 'false'],
		['2', 'stable'],
	])
	const calls = []
	const client = {
		getValue: (id) => state.get(String(id)),
		setValue: (_deviceId, id, value) => {
			calls.push([String(id), String(value)])
			return true
		},
	}
	const device = { id: 'device', writableIds: new Set(['1', '2']), meterIds: new Set() }
	const result = await executeTarget(client, device, {
		id: '1',
		family: 'mix_mute',
		key: 'lane:slot:mute',
		baseline: 'false',
		probe: 'true',
		status: 'READY',
		transitionTimeoutMs: 20,
		restoreTimeoutMs: 20,
	})
	assert.equal(result.status, 'FAIL_NO_TRANSITION')
	assert.deepEqual(calls, [
		['1', 'true'],
		['1', 'false'],
	])
})

test('collateral drift after exact target restore is a hard failure classification', async () => {
	const state = new Map([
		['1', 'false'],
		['2', 'stable'],
	])
	const client = {
		getValue: (id) => state.get(String(id)),
		setValue: (_deviceId, id, value) => {
			state.set(String(id), String(value))
			if (String(value) === 'true') state.set('2', 'drifted')
			return true
		},
	}
	const device = { id: 'device', writableIds: new Set(['1', '2']), meterIds: new Set() }
	const result = await executeTarget(client, device, {
		id: '1',
		family: 'mix_mute',
		key: 'lane:slot:mute',
		baseline: 'false',
		probe: 'true',
		status: 'READY',
		transitionTimeoutMs: 20,
		restoreTimeoutMs: 20,
	})
	assert.equal(state.get('1'), 'false')
	assert.equal(result.status, 'FAIL_COLLATERAL_DRIFT')
})

test('summary separates ready, pass, fail and skipped targets', () => {
	const result = summary([
		{ family: 'mix_mute', status: 'READY' },
		{ family: 'mix_mute', status: 'PASS' },
		{ family: 'mix_mute', status: 'FAIL_NO_TRANSITION' },
		{ family: 'mix_mute', status: 'SKIP_UNKNOWN_BASELINE' },
	])
	assert.deepEqual(result.mix_mute, { total: 4, ready: 1, pass: 1, fail: 1, skipped: 1 })
})

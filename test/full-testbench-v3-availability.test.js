const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const root = path.join(__dirname, '..')
const runnerV3 = fs.readFileSync(path.join(root, 'testbench', 'FullTestBenchRunnerV3.js'), 'utf8')
const guardV3 = fs.readFileSync(path.join(root, 'testbench', 'FullTestBenchGuardV3.js'), 'utf8')

const {
	AVAILABILITY_REVISION,
	classifyOutputAvailability,
	buildOutputExecutionSnapshot,
} = require('../testbench/FullTestBenchOutputAvailability')
const { buildExtendedPageV2 } = require('../testbench/FullTestBenchPageV2')

function smallSnapshot() {
	const shape = { inputs: [], outputs: [0, 1, 2, 3], mixerSlots: [], lanes: [] }
	const values = {}
	for (const output of shape.outputs) {
		for (const key of ['mute', 'source', 'stereo', 'nickname']) {
			values[`output_${output + 1}_${key}`] = { exists: true, value: '' }
		}
	}
	return { shape, values }
}

test('FULL V3 classifies available, unavailable, unknown and no-flag outputs separately', () => {
	const shape = smallSnapshot().shape
	const availability = new Map([
		[0, { exists: true, value: 'true' }],
		[1, { exists: true, value: 'false' }],
		[2, { exists: true, value: '' }],
		[3, { exists: false, value: '' }],
	])
	const result = classifyOutputAvailability(shape, availability)
	assert.deepEqual(result.available, [0])
	assert.deepEqual(result.unavailable, [1])
	assert.deepEqual(result.unknown, [2])
	assert.deepEqual(result.noFlag, [3])
	assert.deepEqual(result.eligible, [0, 3])
})

test('FULL V3 execution snapshot removes unavailable and unknown output write surfaces', () => {
	const original = smallSnapshot()
	const classification = {
		available: [0],
		unavailable: [1],
		unknown: [2],
		noFlag: [3],
		eligible: [0, 3],
	}
	const snapshot = buildOutputExecutionSnapshot(original, classification)
	assert.deepEqual(snapshot.shape.outputs, [0, 3])
	assert.ok(snapshot.values.output_1_mute)
	assert.equal(snapshot.values.output_2_mute, undefined)
	assert.equal(snapshot.values.output_3_mute, undefined)
	assert.ok(snapshot.values.output_4_mute)
	assert.equal(snapshot.values.__tb_output_2_availability.value, 'unavailable')
	assert.equal(snapshot.values.__tb_output_3_availability.value, 'unknown')

	const built = buildExtendedPageV2(snapshot, { primary: '100', secondary: '101' })
	assert.ok(built.locations['v2-output-1-mute-on'])
	assert.equal(built.locations['v2-output-2-mute-on'], undefined)
	assert.equal(built.locations['v2-output-3-mute-on'], undefined)
	assert.ok(built.locations['v2-output-4-mute-on'])
})

test('FULL V3 establishes output protection sequentially after Monitor Mute and before Core', () => {
	const monitor = runnerV3.indexOf('await engageMonitorMuteGuardV2')
	const outputs = runnerV3.indexOf('await engageOutputMuteGuardV3')
	const core = runnerV3.indexOf('await runCoreFullV2')
	assert.ok(monitor >= 0 && outputs > monitor && core > outputs)
	assert.match(runnerV3, /SKIP_UNAVAILABLE|recordOutputAvailabilitySkips/)
	assert.match(runnerV3, /eligible output mutes sequentially/)
	assert.doesNotMatch(guardV3, /v2-output-mute-off-all/)
	assert.match(guardV3, /v2-output-\$\{output \+ 1\}-mute-on/)
	assert.match(guardV3, /HARD ABORT: Output \$\{output \+ 1\}/)
})

test('FULL V3 self-test preserves the output-availability campaign independently of the current launcher', () => {
	assert.match(AVAILABILITY_REVISION, /output-availability/)
	const script = "require('./testbench/FullTestBenchRunnerV3').selfTestV3().catch((error) => { console.error(error); process.exitCode = 1 })"
	const result = spawnSync(process.execPath, ['-e', script], {
		cwd: root,
		encoding: 'utf8',
		timeout: 30000,
	})
	assert.equal(result.status, 0, result.stderr || result.stdout)
	assert.match(result.stdout, /SELFTEST PASS/)
	assert.match(result.stdout, /output-availability/)
})

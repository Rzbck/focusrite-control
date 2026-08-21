const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const root = path.join(__dirname, '..')
const runnerPath = path.join(root, 'testbench', 'Focusrite_18i20_FullTestBench.js')
const runnerV2Path = path.join(root, 'testbench', 'FullTestBenchRunnerV2.js')
const pageV2Path = path.join(root, 'testbench', 'FullTestBenchPageV2.js')
const phasesV2Path = path.join(root, 'testbench', 'FullTestBenchPhasesV2.js')
const guardV2Path = path.join(root, 'testbench', 'FullTestBenchGuardV2.js')

const runnerV2 = fs.readFileSync(runnerV2Path, 'utf8')
const pageV2 = fs.readFileSync(pageV2Path, 'utf8')
const phasesV2 = fs.readFileSync(phasesV2Path, 'utf8')
const guardV2 = fs.readFileSync(guardV2Path, 'utf8')

function makeBlankSnapshot() {
	const shape = {
		inputs: Array.from({ length: 8 }, (_, i) => i),
		outputs: Array.from({ length: 26 }, (_, i) => i),
		mixerSlots: Array.from({ length: 24 }, (_, i) => i + 1),
		lanes: ['A', 'B', 'C', 'D', 'E', 'F'].flatMap((letter) => [
			{ mix: `Mix ${letter}`, side: 'left' },
			{ mix: `Mix ${letter}`, side: 'right' },
		]),
	}
	const values = {}
	for (const i of shape.inputs) values[`input_${i + 1}_nickname`] = { exists: true, value: '' }
	for (const o of shape.outputs) {
		for (const key of ['mute', 'source', 'stereo', 'nickname', 'gain']) values[`output_${o + 1}_${key}`] = { exists: true, value: '' }
	}
	for (const s of shape.mixerSlots) {
		values[`mixer_slot_${s}_source`] = { exists: true, value: '' }
		values[`mixer_slot_${s}_stereo`] = { exists: true, value: '' }
	}
	for (const lane of shape.lanes) {
		const base = `mix_${lane.mix.toLowerCase().replace(/\s+/g, '_')}_${lane.side === 'left' ? 'l' : 'r'}`
		values[`${base}_talkback`] = { exists: true, value: '' }
		for (let slot = 1; slot <= 24; slot++) {
			for (const key of ['gain', 'pan', 'mute', 'solo']) values[`${base}_slot_${slot}_${key}`] = { exists: true, value: '' }
		}
	}
	Object.assign(values, {
		device_nickname: { exists: true, value: '' },
		monitor_altEnable: { exists: true, value: '' },
		monitor_alt: { exists: true, value: '' },
		monitor_preset: { exists: true, value: '' },
		device_phantomPersistence: { exists: true, value: '' },
		device_talkbackInputSource: { exists: true, value: '' },
	})
	return { shape, values }
}

test('FULL v2 generator adds no-op recovery batches without forbidden actions', () => {
	const { buildExtendedPageV2, GENERATOR_REVISION } = require('../testbench/FullTestBenchPageV2')
	const built = buildExtendedPageV2(makeBlankSnapshot(), { primary: '100', secondary: '101' })
	for (const id of [
		'v2-output-mute-off-all',
		'v2-output-1-mute-off',
		'v2-output-source-test',
		'v2-output-gain-prime',
		'v2-mixer-source-alt',
		'v2-mixa-l-gain-prime',
		'v2-monitor-preset-baseline',
		'v2-talkback-source-alt',
	]) assert.ok(built.locations[id], `missing ${id}`)
	assert.match(GENERATOR_REVISION, /noop-recovery/)
	const serialized = JSON.stringify(built.file)
	assert.doesNotMatch(serialized, /advanced_raw_set|monitor_gain_set|monitor_gain_adjust|device_preset|clock_source|sample_rate|spdif_mode/)
})

test('FULL v2 treats silent first writes as recoverable only for snapshot-blank variables', () => {
	const { onlyBlankFailures } = require('../testbench/FullTestBenchPhasesV2')
	const snapshot = { values: { a: { exists: true, value: '' }, b: { exists: true, value: 'true' } } }
	assert.equal(onlyBlankFailures([{ variable: 'a', ok: false }], snapshot), true)
	assert.equal(onlyBlankFailures([{ variable: 'b', ok: false }], snapshot), false)
	assert.equal(onlyBlankFailures([{ variable: 'a', ok: false }, { variable: 'b', ok: false }], snapshot), false)
})

test('FULL v2 confirms Monitor Mute then output mutes before Core testing', () => {
	const monitor = runnerV2.indexOf('await engageMonitorMuteGuardV2')
	const outputs = runnerV2.indexOf('await engageOutputMuteGuardV2Safe')
	const core = runnerV2.indexOf('await runCoreFullV2')
	assert.ok(monitor >= 0 && outputs > monitor && core > outputs)
	assert.match(runnerV2, /HARD ABORT: protective output mutes intentionally retained ON/)
	assert.match(guardV2, /finally[\s\S]*output-mute-on/)
	assert.match(guardV2, /HARD ABORT: one or more output mutes could not return to protective ON after recovery/)
})

test('FULL v2 recovery code stays inside Companion button actions and never writes Focusrite protocol directly', () => {
	const combined = `${runnerV2}\n${pageV2}\n${phasesV2}\n${guardV2}`
	assert.doesNotMatch(combined, /\.setItem\s*\(/)
	assert.doesNotMatch(combined, /<set\b/i)
	assert.match(combined, /pressLocation/)
	assert.match(combined, /NOOP_RECOVERY/)
})

test('FULL launcher target self-test now runs the v2 recovery revision', () => {
	const result = spawnSync(process.execPath, [runnerPath, '--self-test'], {
		cwd: root,
		encoding: 'utf8',
		timeout: 30000,
	})
	assert.equal(result.status, 0, result.stderr || result.stdout)
	assert.match(result.stdout, /SELFTEST PASS/)
	assert.match(result.stdout, /noop-recovery/)
})

'use strict'

const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const {
	mergeControlPaths,
	mergeDiagnosticPaths,
	mergeMeterPaths,
	summarizeCustomMixCoverage,
} = require('../testbench/FullTestBenchFinalCustomMixCoverage')

const root = path.resolve(__dirname, '..')

function report({ controls = [], diagnostics = [], meters = [] } = {}) {
	return {
		controls: { paths: controls },
		diagnostics: { paths: diagnostics },
		meters: { paths: meters },
	}
}

test('final Custom Mix coverage accumulates prior and current safe evidence', () => {
	const prior = report({
		controls: [
			{ id: 'mute', definitionId: 'mix_mute', seenTrue: false, seenFalse: true },
			{ id: 'solo', definitionId: 'mix_solo', seenTrue: true, seenFalse: true },
			{ id: 'talkback', definitionId: 'mix_talkback', seenTrue: true, seenFalse: true },
		],
		diagnostics: [
			{ id: 'mix_lane_slot_1_gain', observed: ['V1'], transitions: 0 },
			{ id: 'mix_lane_slot_1_pan', observed: ['V1'], transitions: 0 },
			{ id: 'mixer_slot_1_stereo', observed: ['false'], transitions: 0 },
			{ id: 'output_1_available', observed: ['true'], transitions: 0 },
			{ id: 'output_2_available', observed: ['true'], transitions: 0 },
			{ id: 'output_1_source_name', observed: ['Playback 1'], transitions: 0 },
			{ id: 'output_2_source_name', observed: ['Playback 2'], transitions: 0 },
		],
		meters: [
			{
				id: 'meter',
				definitionId: 'mix_meter',
				seenFloor: true,
				seenMovement: false,
				mismatch: false,
			},
		],
	})
	const current = report({
		controls: [{ id: 'mute', definitionId: 'mix_mute', seenTrue: true, seenFalse: false }],
		diagnostics: [
			{ id: 'mix_lane_slot_1_gain', observed: ['V2'], transitions: 1 },
			{ id: 'mix_lane_slot_1_pan', observed: ['V2'], transitions: 1 },
			{ id: 'mixer_slot_1_stereo', observed: ['true'], transitions: 1 },
			{ id: 'output_1_source_name', observed: ['Mix A L'], transitions: 1 },
		],
		meters: [
			{
				id: 'meter',
				definitionId: 'mix_meter',
				seenFloor: false,
				seenMovement: true,
				mismatch: false,
			},
		],
	})

	const summary = summarizeCustomMixCoverage(
		mergeControlPaths([prior, current]),
		mergeDiagnosticPaths([prior, current]),
		mergeMeterPaths([prior, current]),
	)
	assert.equal(summary.complete, true)
	assert.deepEqual(summary.controls, { total: 3, closedBothStates: 3, singleState: 0, mismatch: 0 })
	assert.deepEqual(summary.strips, { total: 2, changed: 2, unchanged: 0 })
	assert.deepEqual(summary.stereo, { total: 1, changed: 1, unchanged: 0 })
	assert.deepEqual(summary.routing, { eligiblePairs: 1, customMixObservedPairs: 1, missingPairs: 0 })
	assert.deepEqual(summary.meters, { total: 1, closed: 1, partial: 0, mismatch: 0 })
})

test('final Custom Mix coverage remains partial when a required family was not exercised', () => {
	const summary = summarizeCustomMixCoverage(
		mergeControlPaths([
			report({ controls: [{ id: 'mute', definitionId: 'mix_mute', seenTrue: true, seenFalse: true }] }),
		]),
		new Map(),
		new Map(),
	)
	assert.equal(summary.complete, false)
	assert.equal(summary.strips.total, 0)
	assert.equal(summary.meters.total, 0)
})

test('final Custom Mix coverage harness is read-only', () => {
	const source = fs.readFileSync(path.join(root, 'testbench', 'FullTestBenchFinalCustomMixCoverage.js'), 'utf8')
	assert.doesNotMatch(source, /\bpost\s*\(/)
	assert.doesNotMatch(source, /\/press\b/)
	assert.doesNotMatch(source, /\.setItem\s*\(/)
	assert.doesNotMatch(source, /<set\b/i)
	assert.doesNotMatch(source, /advanced_raw_set/)
})

test('final hardware launcher gates writes then runs the read-only Custom Mix recorder and cumulative audit', () => {
	const launcher = fs.readFileSync(path.join(root, 'testbench', 'RUN_FINAL_HARDWARE_AUDIT.cmd'), 'utf8')
	const preflight = launcher.indexOf('FullTestBenchFinalCustomMixCoverage.js" --preflight')
	const release = launcher.indexOf('call "%SCRIPT_DIR%RUN_V1_RELEASE_SMOKE.cmd"')
	const hardAbortGate = launcher.indexOf('if "!RELEASE_CODE!"=="4"')
	const manual = launcher.indexOf('call "%SCRIPT_DIR%RUN_MANUAL_FEEDBACK_SWEEP.cmd"')
	const coverage = launcher.lastIndexOf('FullTestBenchFinalCustomMixCoverage.js')
	assert.ok(preflight >= 0)
	assert.ok(release > preflight)
	assert.ok(hardAbortGate > release && hardAbortGate < manual)
	assert.ok(manual > release)
	assert.ok(coverage > manual)
	assert.match(launcher, /Custom Mix/)
	assert.match(launcher, /Hardware Inputs/)
	assert.match(launcher, /Software \^\(DAW\^\) Playback/)
	assert.match(launcher, /Mute: ON puis OFF/)
	assert.match(launcher, /Solo: ON puis OFF/)
	assert.match(launcher, /fader: au moins deux positions/)
	assert.match(launcher, /pan: au moins deux positions/)
	assert.match(launcher, /Stereo: change l etat/)
	assert.match(launcher, /100%% READ-ONLY/)
	assert.match(launcher, /Monitor gain item 1677/)
	assert.match(launcher, /Device Preset, Clock Source, Sample Rate, Digital I\/O/)
	assert.doesNotMatch(launcher, /--allow-hardware-writes.*ManualFeedbackSweep/i)
})

test('nested final audit launchers freeze absolute script directories before changing cwd', () => {
	const rootLauncher = fs.readFileSync(path.join(root, 'RUN_FINAL_HARDWARE_AUDIT.bat'), 'utf8')
	const finalLauncher = fs.readFileSync(path.join(root, 'testbench', 'RUN_FINAL_HARDWARE_AUDIT.cmd'), 'utf8')
	const releaseLauncher = fs.readFileSync(path.join(root, 'testbench', 'RUN_V1_RELEASE_SMOKE.cmd'), 'utf8')

	assert.match(rootLauncher, /set "ROOT_DIR=%~dp0"/)
	assert.match(rootLauncher, /set "LAUNCHER=%ROOT_DIR%testbench\\RUN_FINAL_HARDWARE_AUDIT\.cmd"/)
	assert.match(finalLauncher, /set "SCRIPT_DIR=%~dp0"/)
	assert.match(finalLauncher, /call "%SCRIPT_DIR%RUN_V1_RELEASE_SMOKE\.cmd"/)
	assert.match(finalLauncher, /call "%SCRIPT_DIR%RUN_MANUAL_FEEDBACK_SWEEP\.cmd"/)
	assert.match(releaseLauncher, /set "SCRIPT_DIR=%~dp0"/)
	assert.match(releaseLauncher, /-File "%SCRIPT_DIR%Focusrite_18i20_Preflight\.ps1"/)
	assert.match(releaseLauncher, /"%SCRIPT_DIR%FullTestBenchV1ReleaseV4\.js" --prepare-only/)
	assert.doesNotMatch(finalLauncher, /call "testbench\\RUN_V1_RELEASE_SMOKE\.cmd"/)
	assert.doesNotMatch(finalLauncher, /call "testbench\\RUN_MANUAL_FEEDBACK_SWEEP\.cmd"/)
})

test('final audit launchers fail closed before writes when required components are missing', () => {
	const finalLauncher = fs.readFileSync(path.join(root, 'testbench', 'RUN_FINAL_HARDWARE_AUDIT.cmd'), 'utf8')
	const releaseLauncher = fs.readFileSync(path.join(root, 'testbench', 'RUN_V1_RELEASE_SMOKE.cmd'), 'utf8')

	const finalSelfCheck = finalLauncher.indexOf('FINAL AUDIT SELF-CHECK FAILED')
	const finalPreflight = finalLauncher.indexOf('PREFLIGHT FINAL CUSTOM MIX')
	assert.ok(finalSelfCheck >= 0 && finalSelfCheck < finalPreflight)
	assert.match(finalLauncher, /FullTestBenchFinalCustomMixCoverage\.js/)
	assert.match(finalLauncher, /RUN_V1_RELEASE_SMOKE\.cmd/)
	assert.match(finalLauncher, /RUN_MANUAL_FEEDBACK_SWEEP\.cmd/)
	assert.match(finalLauncher, /AUCUN write hardware lance par ce workflow/)

	const releaseSelfCheck = releaseLauncher.indexOf('RELEASE SELF-CHECK FAILED')
	const releasePreflight = releaseLauncher.indexOf('PREFLIGHT READ-ONLY')
	const writePermission = releaseLauncher.indexOf('--allow-hardware-writes')
	assert.ok(releaseSelfCheck >= 0 && releaseSelfCheck < releasePreflight)
	assert.ok(releaseSelfCheck < writePermission)
	assert.match(releaseLauncher, /Focusrite_18i20_Preflight\.ps1/)
	assert.match(releaseLauncher, /FullTestBenchV1ReleaseV4\.js/)
	assert.match(releaseLauncher, /Focusrite_18i20_SafeHardwareTest\.js/)
	assert.match(releaseLauncher, /AUCUN write hardware lance/)
})

test('root final hardware shortcut only delegates to the canonical final launcher', () => {
	const launcher = fs.readFileSync(path.join(root, 'RUN_FINAL_HARDWARE_AUDIT.bat'), 'utf8')
	assert.match(launcher, /testbench\\RUN_FINAL_HARDWARE_AUDIT\.cmd/i)
	assert.doesNotMatch(launcher, /allow-hardware-writes|advanced_raw_set|<set\b/i)
})

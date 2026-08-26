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
	missingTasks,
} = require('../testbench/FullTestBenchFinalCustomMixCoverage')
const { validateReleaseReport } = require('../testbench/FinalCustomMixResumeGate')

const root = path.resolve(__dirname, '..')

function report({ controls = [], diagnostics = [], meters = [] } = {}) {
	return {
		controls: { paths: controls },
		diagnostics: { paths: diagnostics },
		meters: { paths: meters },
	}
}

function closedMixMeters() {
	return Array.from({ length: 12 }, (_, index) => ({
		id: `meter-${index + 1}`,
		definitionId: 'mix_meter',
		seenFloor: true,
		seenMovement: true,
		mismatch: false,
	}))
}

function representativeDiagnostics() {
	return [
		{ id: 'mix_lane_slot_1_gain', observed: ['V1', 'V2'], transitions: 1 },
		{ id: 'mix_lane_slot_1_pan', observed: ['V1', 'V2'], transitions: 1 },
		{ id: 'mixer_slot_1_stereo', observed: ['false', 'true'], transitions: 1 },
		{ id: 'output_1_available', observed: ['true'], transitions: 0 },
		{ id: 'output_2_available', observed: ['true'], transitions: 0 },
		{ id: 'output_1_source_name', observed: ['Playback 1', 'Mix A L'], transitions: 1 },
		{ id: 'output_2_source_name', observed: ['Playback 2'], transitions: 0 },
	]
}

test('final Custom Mix coverage accumulates representative prior and current safe evidence', () => {
	const prior = report({
		controls: [
			{ id: 'mute', definitionId: 'mix_mute', seenTrue: false, seenFalse: true },
			{ id: 'solo', definitionId: 'mix_solo', seenTrue: true, seenFalse: true },
			{ id: 'talkback', definitionId: 'mix_talkback', seenTrue: true, seenFalse: true },
		],
		diagnostics: representativeDiagnostics(),
		meters: closedMixMeters(),
	})
	const current = report({
		controls: [{ id: 'mute', definitionId: 'mix_mute', seenTrue: true, seenFalse: false }],
	})

	const summary = summarizeCustomMixCoverage(
		mergeControlPaths([prior, current]),
		mergeDiagnosticPaths([prior, current]),
		mergeMeterPaths([prior, current]),
	)
	assert.equal(summary.complete, true)
	assert.equal(summary.controls.representatives.mix_mute.closedPaths, 1)
	assert.equal(summary.controls.representatives.mix_solo.closedPaths, 1)
	assert.equal(summary.controls.representatives.mix_talkback.closedPaths, 1)
	assert.equal(summary.strips.gain.changed, 1)
	assert.equal(summary.strips.pan.changed, 1)
	assert.equal(summary.stereo.changed, 1)
	assert.equal(summary.routing.customMixObservedPairs, 1)
	assert.equal(summary.meters.closed, 12)
	assert.deepEqual(missingTasks(summary), [])
})

test('representative Custom Mix closure does not require every internal strip or output pair', () => {
	const evidence = report({
		controls: [
			{ id: 'mute-closed', definitionId: 'mix_mute', seenTrue: true, seenFalse: true },
			{ id: 'mute-unmoved', definitionId: 'mix_mute', seenTrue: false, seenFalse: true },
			{ id: 'solo-closed', definitionId: 'mix_solo', seenTrue: true, seenFalse: true },
			{ id: 'solo-unmoved', definitionId: 'mix_solo', seenTrue: false, seenFalse: true },
			{ id: 'talkback-closed', definitionId: 'mix_talkback', seenTrue: true, seenFalse: true },
		],
		diagnostics: [
			...representativeDiagnostics(),
			{ id: 'mix_lane_slot_24_gain', observed: ['V1'], transitions: 0 },
			{ id: 'mix_lane_slot_24_pan', observed: ['V1'], transitions: 0 },
			{ id: 'mixer_slot_24_stereo', observed: ['true'], transitions: 0 },
			{ id: 'output_3_available', observed: ['true'], transitions: 0 },
			{ id: 'output_4_available', observed: ['true'], transitions: 0 },
			{ id: 'output_3_source_name', observed: ['Playback 3'], transitions: 0 },
			{ id: 'output_4_source_name', observed: ['Playback 4'], transitions: 0 },
		],
		meters: closedMixMeters(),
	})
	const summary = summarizeCustomMixCoverage(
		mergeControlPaths([evidence]),
		mergeDiagnosticPaths([evidence]),
		mergeMeterPaths([evidence]),
	)
	assert.equal(summary.complete, true)
	assert.equal(summary.controls.representatives.mix_mute.total, 2)
	assert.equal(summary.controls.representatives.mix_mute.closedPaths, 1)
	assert.equal(summary.strips.gain.total, 2)
	assert.equal(summary.strips.gain.changed, 1)
	assert.equal(summary.routing.eligiblePairs, 2)
	assert.equal(summary.routing.customMixObservedPairs, 1)
})

test('final Custom Mix coverage remains partial when a representative family is missing', () => {
	const summary = summarizeCustomMixCoverage(
		mergeControlPaths([
			report({ controls: [{ id: 'mute', definitionId: 'mix_mute', seenTrue: true, seenFalse: true }] }),
		]),
		new Map(),
		new Map(),
	)
	assert.equal(summary.complete, false)
	assert.ok(missingTasks(summary).some((task) => /Solo/.test(task)))
	assert.ok(missingTasks(summary).some((task) => /fader/.test(task)))
})

test('final Custom Mix coverage harness is read-only', () => {
	const source = fs.readFileSync(path.join(root, 'testbench', 'FullTestBenchFinalCustomMixCoverage.js'), 'utf8')
	assert.doesNotMatch(source, /\bpost\s*\(/)
	assert.doesNotMatch(source, /\/press\b/)
	assert.doesNotMatch(source, /\.setItem\s*\(/)
	assert.doesNotMatch(source, /<set\b/i)
	assert.doesNotMatch(source, /advanced_raw_set/)
})

test('recorder readiness and Phase B resume gates are read-only and require clean Phase A evidence', () => {
	const ready = fs.readFileSync(path.join(root, 'testbench', 'FinalCustomMixRecorderReady.js'), 'utf8')
	const resume = fs.readFileSync(path.join(root, 'testbench', 'FinalCustomMixResumeGate.js'), 'utf8')
	for (const source of [ready, resume]) {
		assert.doesNotMatch(source, /\bpost\s*\(|\/press\b|\.setItem\s*\(|<set\b|--allow-hardware-writes/i)
	}
	const now = Date.now()
	const clean = {
		revision: 'v1-release-smoke-v5-pair-withheld-20260826',
		moduleVersion: '0.1.21',
		generatedUtc: new Date(now - 1000).toISOString(),
		testCount: 42,
		pass: 42,
		fail: 0,
		hardAbort: false,
		reconnect: 'PASS',
		safeCore: { fail: 0 },
		withheldActionIds: ['output_pair_source'],
	}
	assert.deepEqual(validateReleaseReport(clean, now), [])
	assert.ok(validateReleaseReport({ ...clean, fail: 1 }, now).length > 0)
	assert.ok(validateReleaseReport({ ...clean, hardAbort: true }, now).length > 0)
})

test('final hardware launcher gates retained writes then runs a representative read-only Custom Mix phase', () => {
	const launcher = fs.readFileSync(path.join(root, 'testbench', 'RUN_FINAL_HARDWARE_AUDIT.cmd'), 'utf8')
	const preflight = launcher.indexOf('FullTestBenchFinalCustomMixCoverage.js" --preflight')
	const release = launcher.indexOf('call "%SCRIPT_DIR%RUN_V1_RELEASE_SMOKE.cmd"')
	const hardAbortGate = launcher.indexOf('if "!RELEASE_CODE!"=="4"')
	const ready = launcher.indexOf('"%NODE_EXE%" "%SCRIPT_DIR%FinalCustomMixRecorderReady.js"')
	const manual = launcher.indexOf('call "%SCRIPT_DIR%RUN_MANUAL_FEEDBACK_SWEEP.cmd"')
	const coverage = launcher.lastIndexOf('FullTestBenchFinalCustomMixCoverage.js')
	assert.ok(preflight >= 0)
	assert.ok(release > preflight)
	assert.ok(hardAbortGate > release && hardAbortGate < manual)
	assert.ok(ready > release && ready < manual)
	assert.ok(coverage > manual)
	assert.match(launcher, /output_pair_source est WITHHELD/i)
	assert.match(launcher, /0\.1\.21\.tgz/)
	assert.match(launcher, /UNE paire d Outputs disponible/)
	assert.match(launcher, /sur UNE tranche visible/)
	assert.match(launcher, /UNE bascule Stereo\/Mono visible/)
	assert.match(launcher, /AUCUN BESOIN de parcourir tous les Custom Mix ni les 24 tranches/)
	assert.match(launcher, /100%% READ-ONLY/)
	assert.doesNotMatch(launcher, /Pour chaque paire d'Outputs|Repete le parcours pour TOUS les Custom Mix/i)
})

test('Phase B resume launcher never reruns Phase A and has no write-capable path', () => {
	const rootLauncher = fs.readFileSync(path.join(root, 'RUN_FINAL_CUSTOM_MIX_RESUME.bat'), 'utf8')
	const launcher = fs.readFileSync(path.join(root, 'testbench', 'RUN_FINAL_CUSTOM_MIX_RESUME.cmd'), 'utf8')
	assert.match(rootLauncher, /testbench\\RUN_FINAL_CUSTOM_MIX_RESUME\.cmd/i)
	assert.match(launcher, /FinalCustomMixResumeGate\.js/)
	assert.match(launcher, /FullTestBenchFinalCustomMixCoverage\.js" --status/)
	assert.match(launcher, /call "%SCRIPT_DIR%RUN_MANUAL_FEEDBACK_SWEEP\.cmd"/)
	assert.match(launcher, /AUCUN BESOIN de parcourir tous les Custom Mix ni les 24 tranches/)
	assert.doesNotMatch(launcher, /RUN_V1_RELEASE_SMOKE|--allow-hardware-writes|ALL_ISOLATED|V1_RELEASE/)
	assert.doesNotMatch(rootLauncher, /allow-hardware-writes|advanced_raw_set|<set\b/i)
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
	assert.match(releaseLauncher, /"%SCRIPT_DIR%FullTestBenchV1ReleaseV5\.js" --prepare-only/)
})

test('final audit launchers fail closed before writes when required components are missing', () => {
	const finalLauncher = fs.readFileSync(path.join(root, 'testbench', 'RUN_FINAL_HARDWARE_AUDIT.cmd'), 'utf8')
	const releaseLauncher = fs.readFileSync(path.join(root, 'testbench', 'RUN_V1_RELEASE_SMOKE.cmd'), 'utf8')
	const finalSelfCheck = finalLauncher.indexOf('FINAL AUDIT SELF-CHECK FAILED')
	const finalPreflight = finalLauncher.indexOf('PREFLIGHT FINAL CUSTOM MIX')
	assert.ok(finalSelfCheck >= 0 && finalSelfCheck < finalPreflight)
	assert.match(finalLauncher, /FinalCustomMixRecorderReady\.js/)
	assert.match(finalLauncher, /RUN_V1_RELEASE_SMOKE\.cmd/)
	assert.match(finalLauncher, /RUN_MANUAL_FEEDBACK_SWEEP\.cmd/)
	const releaseSelfCheck = releaseLauncher.indexOf('RELEASE SELF-CHECK FAILED')
	const releasePreflight = releaseLauncher.indexOf('PREFLIGHT READ-ONLY')
	const writePermission = releaseLauncher.indexOf('--allow-hardware-writes')
	assert.ok(releaseSelfCheck >= 0 && releaseSelfCheck < releasePreflight)
	assert.ok(releaseSelfCheck < writePermission)
})

test('root final hardware shortcut only delegates to the canonical final launcher', () => {
	const launcher = fs.readFileSync(path.join(root, 'RUN_FINAL_HARDWARE_AUDIT.bat'), 'utf8')
	assert.match(launcher, /testbench\\RUN_FINAL_HARDWARE_AUDIT\.cmd/i)
	assert.doesNotMatch(launcher, /allow-hardware-writes|advanced_raw_set|<set\b/i)
})

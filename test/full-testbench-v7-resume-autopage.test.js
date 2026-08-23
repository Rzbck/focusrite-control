const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const root = path.join(__dirname, '..')
const { stereoPairWriteSafety, stereoRestoreChecks } = require('../testbench/FullTestBenchOutputsV4')
const { failedCheckDetail } = require('../testbench/FullTestBenchV4Common')
const {
	inferResumePhaseFromRows,
	resolveDiagnosticResumePhase,
	shouldRunResumePhase,
} = require('../testbench/FullTestBenchResumeV7')
const {
	PAGE2_CONFIRM_FLAG,
	TrpcWsRpc,
	rpcWebSocketUrl,
	normalizeConnections,
	buildConnectionRemap,
	resolveAuditedR9Page,
	hashPagesExcept,
	sameConnectionSet,
} = require('../testbench/FullTestBenchCompanionImportV7')
const { fatalCampaignEvidence } = require('../testbench/FullTestBenchRunnerV4')

function readTestbench(name) {
	return fs.readFileSync(path.join(root, 'testbench', name), 'utf8')
}

test('V8 stereo safety is derived from stereo pair state, not source ownership', () => {
	const profile = { outputPairs: [[4, 5]] }
	const restorable = {
		values: {
			output_5_stereo: { exists: true, value: 'true' },
			output_6_stereo: { exists: true, value: 'false' },
		},
	}
	const reverseRestorable = {
		values: {
			output_5_stereo: { exists: true, value: 'false' },
			output_6_stereo: { exists: true, value: 'true' },
		},
	}
	const unproven = {
		values: {
			output_5_stereo: { exists: true, value: 'true' },
			output_6_stereo: { exists: true, value: 'true' },
		},
	}

	assert.equal(stereoPairWriteSafety(restorable, profile, 4).safe, true)
	assert.equal(stereoPairWriteSafety(reverseRestorable, profile, 5).safe, true)
	const restore = stereoRestoreChecks(reverseRestorable, profile, 5)
	assert.deepEqual(
		restore.map((check) => [check.variable, check.expected]),
		[
			['output_6_stereo', 'true'],
			['output_5_stereo', 'false'],
		],
	)
	const blocked = stereoPairWriteSafety(unproven, profile, 4)
	assert.equal(blocked.safe, false)
	assert.match(blocked.reason, /true\/true pair vector/)
})

test('V8 stereo safety refuses incomplete pair baselines before any write', () => {
	const profile = { outputPairs: [[4, 5]] }
	const snapshot = {
		values: {
			output_5_stereo: { exists: true, value: 'true' },
			output_6_stereo: { exists: true, value: '' },
		},
	}
	const result = stereoPairWriteSafety(snapshot, profile, 4)
	assert.equal(result.safe, false)
	assert.match(result.reason, /not fully server-confirmed/)
})

test('restore diagnostics preserve exact variable expected and observed values', () => {
	const detail = failedCheckDetail('restore-batch', [
		{ variable: 'output_5_stereo', expected: 'true', actual: 'true', ok: true },
		{ variable: 'output_6_stereo', expected: 'true', actual: 'false', ok: false },
	])
	assert.equal(detail, 'restore-batch: output_6_stereo expected true, observed false')

	const common = readTestbench('FullTestBenchV4Common.js')
	assert.match(common, /restore failed \(\$\{restoreFailure/)
	assert.match(common, /safe fallback .*server-confirmed/)
})

test('diagnostic resume infers the nearest major phase from a restore quarantine', () => {
	assert.equal(inferResumePhaseFromRows([{ id: 'output:5:stereo', status: 'QUARANTINED_RESTORE' }]), 'output-families')
	assert.equal(inferResumePhaseFromRows([{ id: 'mixer-slot:7:source', status: 'QUARANTINED_RESTORE' }]), 'mixer-slots')
	assert.equal(shouldRunResumePhase('mixer-slots', 'output-families'), false)
	assert.equal(shouldRunResumePhase('mixer-slots', 'mixer-slots'), true)
	assert.equal(shouldRunResumePhase('mixer-slots', 'monitoring'), true)
})

test('diagnostic resume auto ignores newer PREP reports and keeps the last restore failure anchor', () => {
	const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'focusrite-resume-test-'))
	try {
		fs.writeFileSync(
			path.join(tmp, 'capability-lab_20260823T100000Z.json'),
			JSON.stringify({
				reportClass: 'private-local-diagnostic',
				meta: { completed: false, reason: 'hard-abort' },
				capabilities: [{ id: 'mixer-slot:2:stereo', status: 'QUARANTINED_RESTORE' }],
			}),
		)
		fs.writeFileSync(
			path.join(tmp, 'capability-lab_20260823T110000Z.shareable.json'),
			JSON.stringify({
				reportClass: 'shareable-sanitized',
				capabilities: [{ id: 'manual:feedback-meter-dynamics', status: 'QUARANTINED_RESTORE' }],
			}),
		)
		fs.writeFileSync(
			path.join(tmp, 'capability-lab_20260823T120000Z.json'),
			JSON.stringify({
				reportClass: 'private-local-diagnostic',
				meta: { completed: false, reason: 'device-wide-harness-import-required' },
				capabilities: [],
			}),
		)
		assert.equal(resolveDiagnosticResumePhase(['node', 'x', '--diagnostic-resume=auto'], tmp), 'mixer-slots')
	} finally {
		fs.rmSync(tmp, { recursive: true, force: true })
	}
})

test('Companion Page 2 importer uses loopback tRPC and exact existing-connection remap', () => {
	assert.equal(PAGE2_CONFIRM_FLAG, '--replace-page-2')
	assert.equal(rpcWebSocketUrl('http://127.0.0.1:8000'), 'ws://127.0.0.1:8000/trpc')
	assert.deepEqual(
		buildConnectionRemap(
			{
				connections: {
					'generated-focusrite': {
						moduleId: 'focusrite-scarlett-18i20',
						label: 'FOCUSRITE TESTBENCH TARGET',
					},
				},
			},
			{ id: 'existing-focusrite', moduleId: 'focusrite-scarlett-18i20' },
		),
		{ 'generated-focusrite': 'existing-focusrite' },
	)
	assert.throws(
		() =>
			buildConnectionRemap(
				{
					connections: {
						a: { moduleId: 'focusrite-scarlett-18i20' },
						b: { moduleId: 'focusrite-scarlett-18i20' },
					},
				},
				{ id: 'existing-focusrite', moduleId: 'focusrite-scarlett-18i20' },
			),
		/exactly one/,
	)
})

test('Companion connection payload normalization matches array and object API forms', () => {
	const a = { id: 'a' }
	const b = { id: 'b' }
	assert.deepEqual(normalizeConnections([a, b]), [a, b])
	assert.deepEqual(normalizeConnections({ connections: [a, b] }), [a, b])
	assert.deepEqual(normalizeConnections({ connections: { a, b } }), [a, b])
	assert.deepEqual(normalizeConnections({ a, b }), [a, b])
})

test('Page 2 importer reuses the audited r9 Page 1 marker instead of requiring its exact display name', () => {
	const markerPage = { name: 'Local r9 label', controls: { 0: { 0: { text: 'TB-R9-ALL' } } } }
	const exported = { pages: { 1: markerPage, 2: { name: 'old Page 2' } } }
	assert.equal(resolveAuditedR9Page(exported, { pageNumber: 1 }), markerPage)
	assert.throws(() => resolveAuditedR9Page(exported, { pageNumber: 3 }), /remain on Companion Page 1/)
	assert.throws(
		() => resolveAuditedR9Page({ pages: { 1: { name: 'not-r9' }, 2: {} } }, { pageNumber: 1 }),
		/no longer matches/,
	)
})

test('minimal tRPC WebSocket client sends Companion mutation frames and resolves data replies', async () => {
	class FakeWebSocket {
		constructor(url) {
			this.url = url
			this.listeners = new Map()
			this.sent = []
			queueMicrotask(() => this.emit('open', {}))
		}
		addEventListener(type, handler) {
			const handlers = this.listeners.get(type) || []
			handlers.push(handler)
			this.listeners.set(type, handlers)
		}
		emit(type, event) {
			for (const handler of this.listeners.get(type) || []) handler(event)
		}
		send(payload) {
			this.sent.push(payload)
			const request = JSON.parse(payload)
			queueMicrotask(() =>
				this.emit('message', {
					data: JSON.stringify({ id: request.id, result: { type: 'data', data: 'ok' } }),
				}),
			)
		}
		close() {
			this.emit('close', {})
		}
	}

	const rpc = new TrpcWsRpc('ws://127.0.0.1:8000/trpc', FakeWebSocket)
	await rpc.connect()
	const result = await rpc.mutate('importExport.importSinglePage', { targetPage: 2 })
	assert.equal(result, 'ok')
	assert.deepEqual(JSON.parse(rpc.ws.sent[0]), {
		id: '1',
		method: 'mutation',
		params: { path: 'importExport.importSinglePage', input: { targetPage: 2 } },
	})
	rpc.close()
})

test('Page 2 audit helpers detect changes outside Page 2 and connection creation', () => {
	const before = { pages: { 1: { name: 'r9' }, 2: { name: 'old' }, 3: { name: 'keep' } } }
	const page2Only = { pages: { 1: { name: 'r9' }, 2: { name: 'new' }, 3: { name: 'keep' } } }
	const page1Changed = { pages: { 1: { name: 'changed' }, 2: { name: 'new' }, 3: { name: 'keep' } } }
	assert.equal(hashPagesExcept(before, 2), hashPagesExcept(page2Only, 2))
	assert.notEqual(hashPagesExcept(before, 2), hashPagesExcept(page1Changed, 2))
	assert.equal(sameConnectionSet([{ id: 'a' }, { id: 'b' }], [{ id: 'b' }, { id: 'a' }]), true)
	assert.equal(sameConnectionSet([{ id: 'a' }], [{ id: 'a' }, { id: 'new' }]), false)
})

test('Page 2 importer follows Companion 5 single-page import workflow and contains no Focusrite write path', () => {
	const source = readTestbench('FullTestBenchCompanionImportV7.js')
	for (const route of [
		'importExport.prepareImport.start',
		'importExport.prepareImport.uploadChunk',
		'importExport.prepareImport.complete',
		'importExport.importSinglePage',
	]) {
		assert.match(source, new RegExp(route.replaceAll('.', '\\.')))
	}
	assert.match(source, /targetPage: 2/)
	assert.match(source, /auditExtendedPageV4/)
	assert.match(source, /sameConnectionSet/)
	assert.doesNotMatch(source, /require\(['"]node:net['"]\)|require\(['"]node:dgram['"]\)/)
	assert.doesNotMatch(source, /\.setItem\s*\(|monitor_gain_set|monitor_gain_adjust|advanced_raw_set/)
})

test('launcher offers RESUME and explicit confirmed Page 2 auto-replace with fail-closed rerun', () => {
	const launcher = readTestbench('RUN_SAFE_HARDWARE_TESTS.cmd')
	assert.match(launcher, /SAFE, FULL ou RESUME/)
	assert.match(launcher, /--diagnostic-resume=auto/)
	assert.match(launcher, /PAGE2_AUTO/)
	assert.match(launcher, /FullTestBenchCompanionImportV7\.js.*--replace-page-2/)
	assert.match(launcher, /Page 2 remplacee\/auditee[\s\S]*call :RUN_PREFLIGHT[\s\S]*relance unique/)
	assert.match(launcher, /if \/I "%MODE%"=="FULL" \([\s\S]*PublishLatestShareable\.js/)
	assert.match(launcher, /Aucun publisher n'est lance pour RESUME/)
})

test('fatal report evidence survives an exception thrown before campaign return', () => {
	const feedbackBefore = { total: 829, fail: 0 }
	const feedbackDynamic = { total: 20, fail: 0 }
	const evidence = fatalCampaignEvidence(
		{
			hardwareWritesStarted: true,
			partialCampaign: {
				feedbackBefore,
				feedbackAfter: null,
				feedbackDynamic,
				diagnosticResumePhase: 'output-families',
			},
		},
		null,
	)
	assert.equal(evidence.hardwareWrites, true)
	assert.equal(evidence.feedbackBefore, feedbackBefore)
	assert.equal(evidence.feedbackDynamic, feedbackDynamic)
	assert.equal(evidence.diagnosticResumePhase, 'output-families')
})

test('diagnostic resume can never be marked as completed FULL evidence', () => {
	const runner = readTestbench('FullTestBenchRunnerV4.js')
	assert.match(runner, /completed: !diagnosticResume/)
	assert.match(runner, /diagnostic-resume-completed/)
	assert.match(runner, /must never replace final FULL-from-zero evidence/)
})

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')
const capability = require('../testbench/FullTestBenchCapabilityV4')
const pairs = require('../testbench/FullTestBenchPairsV4')
const pairSafety = require('../testbench/FullTestBenchPairSafetyV5')
const report = require('../testbench/FullTestBenchReportV4')

test('current campaign revision remains newer than the old V4/V5 harness signature', () => {
	assert.match(capability.CAMPAIGN_REVISION, /^full-v8-generic-evidence-profile-/)
})

test('pair harness ids include two candidates, None and explicit pair restore', () => {
	assert.deepEqual(pairs.pairBatchIds(10, 11), {
		test: 'v4-pair-11-12-source-test',
		alt: 'v4-pair-11-12-source-test-alt',
		none: 'v4-pair-11-12-source-none',
		restore: 'v4-pair-11-12-source-restore',
	})
})

test('pair inventory keeps safety diagnostics separate from functional pair-source results', () => {
	const inventory = { rows: [] }
	pairs.addPairInventoryRows(
		inventory,
		{
			shape: { outputs: [0, 1] },
			values: {
				output_1_source: { exists: true, value: '1255' },
				output_2_source: { exists: true, value: '1256' },
			},
		},
		{ outputPairs: [[0, 1]] },
	)
	assert.deepEqual(
		inventory.rows.map((row) => row.id),
		['output-pair:1-2:source', 'output-pair:1-2:safety'],
	)
	assert.equal(inventory.rows[1].family, 'output_pair_safety')
})

test('pair safety diagnostics preserve expected and observed member values', () => {
	assert.equal(pairSafety.pairSafetyRowId(2, 3), 'output-pair:3-4:safety')
	assert.equal(
		pairSafety.describePairNoneResult([
			{ variable: 'output_3_source', expected: '0', actual: '0' },
			{ variable: 'output_4_source', expected: '0', actual: '1256' },
		]),
		'output_3_source expected=0 observed=0; output_4_source expected=0 observed=1256',
	)
})

test('pair safety refuses a write when exact original source restoration is not possible', () => {
	const source = fs.readFileSync(path.join(root, 'testbench', 'FullTestBenchPairSafetyV5.js'), 'utf8')
	assert.match(source, /leftSource\.value === '' \|\| rightSource\.value === ''/)
	assert.match(source, /exact restoration cannot be guaranteed/)
})

test('failed pair Source=None safety attempts restore the original pair before continuing', () => {
	const source = fs.readFileSync(path.join(root, 'testbench', 'FullTestBenchPairSafetyV5.js'), 'utf8')
	assert.match(source, /recoverFailedPairSafetyAttempt/)
	assert.match(source, /original pair restore confirmed after failed safety attempt/)
	assert.match(source, /QUARANTINED_RESTORE/)
	assert.match(source, /Restore saved Focusrite configuration manually/)
})

test('signal-path safety reports server-confirmed guard reasons per output', () => {
	const rows = pairSafety.buildSignalPathSafety(
		[
			{ output: 0, availability: 'AVAILABLE' },
			{ output: 1, availability: 'AVAILABLE' },
			{ output: 2, availability: 'UNAVAILABLE' },
		],
		new Map([
			[0, { safe: true, reason: 'mute-confirmed' }],
			[1, { safe: true, reason: 'pair-source-none' }],
		]),
	)
	assert.deepEqual(rows, [
		{ output: 1, availability: 'AVAILABLE', safe: true, reason: 'mute-confirmed' },
		{ output: 2, availability: 'AVAILABLE', safe: true, reason: 'pair-source-none' },
		{ output: 3, availability: 'UNAVAILABLE', safe: true, reason: 'unavailable' },
	])
})

test('a successful individual Source=None follower guard is upgraded to a pair-aware guard', () => {
	assert.equal(
		pairSafety.pairNeedsSourceGuard(
			0,
			1,
			new Map([
				[0, { safe: true, reason: 'mute-confirmed' }],
				[1, { safe: true, reason: 'source-none' }],
			]),
		),
		true,
	)
	assert.equal(
		pairSafety.pairNeedsSourceGuard(
			0,
			1,
			new Map([
				[0, { safe: true, reason: 'mute-confirmed' }],
				[1, { safe: true, reason: 'pair-mute-confirmed' }],
			]),
		),
		false,
	)
})

test('pair-source validation no longer assumes identical left and right source ids', () => {
	const source = fs.readFileSync(path.join(root, 'testbench', 'FullTestBenchPairsV4.js'), 'utf8')
	assert.match(source, /right member did not expose a non-zero paired source id/)
	assert.doesNotMatch(source, /exactCheck\(`output_\$\{right \+ 1\}_source`, built\.testSources\.primary\)/)
	assert.match(source, /neither was proven pairable/)
})

test('pair-aware safety never writes availability UNKNOWN pairs', () => {
	const source = fs.readFileSync(path.join(root, 'testbench', 'FullTestBenchPairSafetyV5.js'), 'utf8')
	assert.match(source, /leftAvail === 'UNKNOWN' \|\| rightAvail === 'UNKNOWN'/)
	assert.doesNotMatch(source, /\.setItem\s*\(|<set\b/i)
})

test('Monitor Mute restoration occurs before reconnect so reconnect is read/session validation only', () => {
	const source = fs.readFileSync(path.join(root, 'testbench', 'FullTestBenchRunnerV4Campaign.js'), 'utf8')
	const restoreIndex = source.indexOf("'Restore original Monitor Mute'")
	const reconnectIndex = source.indexOf("'Reconnect validation (no writes after reconnect)'")
	assert.ok(restoreIndex > 0)
	assert.ok(reconnectIndex > restoreIndex)
})

test('shareable report redacts paths and network endpoints from signal-path safety reasons', () => {
	const payload = report.buildShareablePayload({
		rows: [],
		meta: {
			completed: true,
			signalPathSafety: [
				{
					output: 2,
					availability: 'AVAILABLE',
					safe: false,
					reason: 'source-none-error:C:\\Private\\diag.txt http://192.168.1.40:12345/session',
				},
			],
		},
	})
	const text = JSON.stringify(payload)
	assert.match(text, /signalPathSafety/)
	assert.doesNotMatch(text, /Private|diag\.txt|192\.168\.1\.40|12345/)
	assert.match(text, /<path-redacted>/)
	assert.match(text, /<url-redacted>/)
})

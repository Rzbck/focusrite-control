const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')
const probe = require('../testbench/FullTestBenchPair34ProbeV6')

function cleanPayload() {
	return {
		schemaVersion: 1,
		reportClass: 'shareable-sanitized-pair-source-probe',
		generatedAt: '2026-08-22T10:00:00.000Z',
		revision: probe.PROBE_REVISION,
		model: 'Scarlett 18i20 (3rd Gen)',
		hardwareWrites: true,
		pair: { left: 3, right: 4 },
		samples: [{ atMs: 100, left: 'zero', right: 'original' }],
		final: { left: 'zero', right: 'original' },
		noneConfirmed: false,
		outcome: 'ZERO_ORIGINAL',
		restoreConfirmed: true,
		fallbackNoneConfirmed: false,
		probeCompletedWithoutException: true,
	}
}

test('targeted probe is hard-limited to outputs 3-4 and its own public result path', () => {
	assert.equal(probe.LEFT, 2)
	assert.equal(probe.RIGHT, 3)
	assert.match(probe.PUBLIC_RELATIVE_PATH.replaceAll('\\', '/'), /docs\/hardware-results\/LATEST_PAIR34_PROBE\.json$/)
})

test('targeted probe requires both write permission and physical isolation acknowledgement', () => {
	assert.throws(() => probe.requireExplicitPermission([]), /--allow-hardware-writes/)
	assert.throws(
		() => probe.requireExplicitPermission(['--allow-hardware-writes']),
		/--confirm-output-3-4-physically-isolated/,
	)
	assert.doesNotThrow(() => probe.requireExplicitPermission([...probe.REQUIRED_FLAGS]))
})

test('public observations classify source state without exposing raw source ids', () => {
	assert.deepEqual(
		probe.classifyPairObservation(
			{ exists: true, value: '0' },
			{ exists: true, value: '9876' },
			'1234',
			'9876',
		),
		{ left: 'zero', right: 'original' },
	)
	assert.equal(probe.outcomeFromObservation({ left: 'zero', right: 'original' }, false), 'ZERO_ORIGINAL')
})

test('targeted public payload accepts only sanitized state classes', () => {
	assert.equal(probe.validateShareablePayload(cleanPayload()), true)
	const payload = cleanPayload()
	payload.samples[0].left = '1255'
	assert.throws(() => probe.validateShareablePayload(payload), /invalid public value/)
})

test('targeted probe has no direct Focusrite protocol write path or Monitor Mute write', () => {
	const source = fs.readFileSync(path.join(root, 'testbench', 'FullTestBenchPair34ProbeV6.js'), 'utf8')
	assert.doesNotMatch(source, /\.setItem\s*\(|<set\b/i)
	assert.doesNotMatch(source, /engageMonitorMuteGuard|restoreMonitorMute|monitor_mute/)
	assert.match(source, /pairBatchIds\(LEFT, RIGHT\)/)
})

test('targeted probe restores or safely falls back from every attempted pair write', () => {
	const source = fs.readFileSync(path.join(root, 'testbench', 'FullTestBenchPair34ProbeV6.js'), 'utf8')
	assert.match(source, /finally\s*\{/)
	assert.match(source, /restoration = await restoreOrFallback/)
	assert.match(source, /process\.exitCode = 4/)
	assert.match(source, /exact original sources for outputs 3-4 are not both server-confirmed/)
})

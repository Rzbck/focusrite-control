const test = require('node:test')
const assert = require('node:assert/strict')

const { AUTO_PUBLISH_BRANCH, validateShareable } = require('../testbench/PublishLatestShareable')

function cleanPayload() {
	return {
		schemaVersion: 4,
		reportClass: 'shareable-sanitized',
		generatedAt: '2026-08-22T06:28:31.968Z',
		meta: {
			completed: true,
			hardwareWrites: true,
			revision: 'full-v5-pair-aware-safety-20260822',
			signature: '0123456789abcdef',
			model: 'Scarlett 18i20 (3rd Gen)',
			r9Probes: 829,
			r9Definitions: 31,
			globalSignalPathSafety: true,
			signalPathSafety: [{ output: 1, availability: 'AVAILABLE', safe: true, reason: 'mute-confirmed' }],
		},
		summary: { PASS: 1 },
		feedbackBefore: { pass: 1, evalOnly: 0, fail: 0, total: 1 },
		feedbackAfter: { pass: 1, evalOnly: 0, fail: 0, total: 1 },
		capabilities: [
			{
				id: 'output:1:mute',
				family: 'output_mute',
				availability: 'AVAILABLE',
				r9ProbeCount: 1,
				stateKnown: true,
				capability: true,
				risk: 'safe',
				dependency: '',
				status: 'PASS_INDEPENDENT',
				detail: 'server-confirmed',
			},
		],
		privacy: 'Sanitized for sharing.',
	}
}

test('automatic publication is restricted to the validation branch', () => {
	assert.equal(AUTO_PUBLISH_BRANCH, 'testbench/v0.2-hardware-validation')
})

test('publisher accepts only the sanitized completed whitelist schema', () => {
	const payload = cleanPayload()
	assert.deepEqual(validateShareable(payload, JSON.stringify(payload)), [])
})

test('publisher refuses private state/variable keys and local paths', () => {
	const payload = cleanPayload()
	payload.capabilities[0].state = 'secret'
	payload.capabilities[0].detail = 'C:\\Users\\Private\\capture.xml'
	const errors = validateShareable(payload, JSON.stringify(payload))
	assert.ok(errors.some((error) => /unexpected capability key: state|forbidden key: state/.test(error)))
	assert.ok(errors.some((error) => /privacy pattern/.test(error)))
})

test('publisher refuses URLs and local network endpoints that escaped redaction', () => {
	const payload = cleanPayload()
	payload.capabilities[0].detail = 'connect failed at http://192.168.1.40:12345/session'
	assert.ok(validateShareable(payload, JSON.stringify(payload)).some((error) => /privacy pattern/.test(error)))

	payload.capabilities[0].detail = 'connect failed at device-name.local:12345'
	assert.ok(validateShareable(payload, JSON.stringify(payload)).some((error) => /privacy pattern/.test(error)))
})

test('publisher refuses incomplete PREP or fatal campaign reports', () => {
	const payload = cleanPayload()
	payload.meta.completed = false
	assert.ok(validateShareable(payload, JSON.stringify(payload)).some((error) => /completed campaigns/.test(error)))
})

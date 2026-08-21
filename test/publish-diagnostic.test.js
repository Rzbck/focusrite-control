const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const test = require('node:test')
const {
	findLatestReadbackResult,
	validateSanitizedReadback,
	buildPublishedReadback,
} = require('../tools/publish-diagnostic-lib')

const VALID = `FOCUSRITE CONTROL READ-ONLY STATE PROBE v2
Target model: Scarlett 18i20 (3rd Gen)
TCP transmit allowlist: client-details, device-subscribe, keep-alive
Hardware <set> writes: FORBIDDEN
Raw/private protocol logging: DISABLED
PASS  Focusrite Control Server discovered dynamically.
PHASE A - cold connect + one subscribe=true: Core seen=3/21; missing=18; setPackets=0; setItems=0; otherSetIds=0
PHASE B - subscribe=false then subscribe=true: Core seen=3/21; missing=18; setPackets=0; setItems=0; otherSetIds=0
PHASE C - clean TCP reconnect + one subscribe=true: Core seen=3/21; missing=18; setPackets=0; setItems=0; otherSetIds=0
DECISION
RESULT: standard subscription lifecycle does not cold-read all Core controls.
`

test('publisher accepts the expected sanitized report shape', () => {
	assert.equal(validateSanitizedReadback(VALID), true)
})

test('publisher rejects private paths, endpoints and raw protocol payloads', () => {
	for (const bad of [
		`${VALID}\nPath: E:\\Private\\capture.xml`,
		`${VALID}\nEndpoint: 127.0.0.1`,
		`${VALID}\n<server-announcement hostname="PRIVATE" port="12345"/>`,
		`${VALID}\n<set devid="1"><item id="1679" value="false"/></set>`,
	]) {
		assert.throws(() => validateSanitizedReadback(bad))
	}
})

test('publisher document carries only public source metadata plus sanitized report', () => {
	const doc = buildPublishedReadback({
		reportText: VALID,
		sourceBranch: 'debug/cold-start-readback',
		sourceCommit: 'a'.repeat(40),
		sourceFile: 'readonly_state_probe_20260821_092205.txt',
		nodeVersion: '22.23.2',
	})
	assert.match(doc, /Source branch: debug\/cold-start-readback/)
	assert.match(doc, /Source commit: a{40}/)
	assert.match(doc, /Hardware write path: forbidden/)
	assert.doesNotMatch(doc, /[A-Za-z]:\\/)
})

test('publisher refuses publication metadata from a non-debug branch', () => {
	assert.throws(() =>
		buildPublishedReadback({
			reportText: VALID,
			sourceBranch: 'main',
			sourceCommit: 'a'.repeat(40),
			sourceFile: 'readonly_state_probe_20260821_092205.txt',
			nodeVersion: '22.23.2',
		}),
	)
})

test('publisher selects the newest valid sanitized result filename', () => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'focusrite-publish-test-'))
	try {
		const older = path.join(dir, 'readonly_state_probe_20260821_090000.txt')
		const newer = path.join(dir, 'readonly_state_probe_20260821_091000.txt')
		fs.writeFileSync(older, VALID)
		fs.writeFileSync(newer, VALID)
		const now = Date.now() / 1000
		fs.utimesSync(older, now - 60, now - 60)
		fs.utimesSync(newer, now, now)
		fs.writeFileSync(path.join(dir, 'not-a-probe.log'), VALID)
		assert.equal(findLatestReadbackResult(dir).name, path.basename(newer))
	} finally {
		fs.rmSync(dir, { recursive: true, force: true })
	}
})

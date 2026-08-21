const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const {
	parseStatusText,
	readStatusFile,
	buildPublishedStatus,
	validatePublishedStatus,
} = require('../tools/rc-validation-status-lib')

test('RC validation status accepts fixed safe tuples', () => {
	assert.deepEqual(parseStatusText('outcome=SUCCESS\nstage=complete\ncode=ok\n'), {
		outcome: 'SUCCESS',
		stage: 'complete',
		code: 'ok',
	})
	assert.deepEqual(parseStatusText('outcome=FAILED\nstage=tests\ncode=tests-failed\n'), {
		outcome: 'FAILED',
		stage: 'tests',
		code: 'tests-failed',
	})
	assert.throws(() => parseStatusText('outcome=SUCCESS\nstage=tests\ncode=ok\n'))
})

test('invalid local status falls back without leaking content', () => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'focusrite-rc-status-'))
	try {
		const file = path.join(dir, 'status.txt')
		fs.writeFileSync(file, 'C:\\Users\\Private\\raw.log')
		assert.deepEqual(readStatusFile(file), { outcome: 'FAILED', stage: 'preflight', code: 'unexpected' })
	} finally {
		fs.rmSync(dir, { recursive: true, force: true })
	}
})

test('published RC validation status excludes raw machine data', () => {
	const text = buildPublishedStatus({
		status: { outcome: 'FAILED', stage: 'lint', code: 'lint-failed' },
		sourceBranch: 'rc/v0.1.13-state-contract',
		sourceCommit: 'a'.repeat(40),
		nodeVersion: '22.23.2',
	})
	assert.equal(validatePublishedStatus(text), true)
	assert.match(text, /Outcome: FAILED/)
	assert.match(text, /Stage: lint/)
	assert.match(text, /Hardware writes during validation: none/)
	assert.doesNotMatch(text, /[A-Za-z]:\\|127\.0\.0\.1|client-key=/i)
})

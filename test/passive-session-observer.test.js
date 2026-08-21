const assert = require('node:assert/strict')
const childProcess = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const test = require('node:test')
const {
	analyzeCapture,
	buildSanitizedSessionReport,
	validateSanitizedSessionReport,
	buildPublishedSession,
} = require('../tools/passive-session-observer-lib')

function frame(xml) {
	return Buffer.from(`Length=${xml.length.toString(16).toUpperCase().padStart(6, '0')} ${xml}`, 'utf8')
}

function tcpPacket({ srcPort, dstPort, seq, payload }) {
	const eth = Buffer.alloc(14)
	eth.writeUInt16BE(0x0800, 12)
	const ip = Buffer.alloc(20)
	ip[0] = 0x45
	ip.writeUInt16BE(20 + 20 + payload.length, 2)
	ip[8] = 64
	ip[9] = 6
	ip.set([127,0,0,1], 12)
	ip.set([127,0,0,1], 16)
	const tcp = Buffer.alloc(20)
	tcp.writeUInt16BE(srcPort, 0)
	tcp.writeUInt16BE(dstPort, 2)
	tcp.writeUInt32BE(seq >>> 0, 4)
	tcp[12] = 0x50
	tcp[13] = 0x18
	return Buffer.concat([eth, ip, tcp, payload])
}

function block(type, body) {
	const pad = (4 - (body.length % 4)) % 4
	const total = 12 + body.length + pad
	const out = Buffer.alloc(total)
	out.writeUInt32LE(type, 0)
	out.writeUInt32LE(total, 4)
	body.copy(out, 8)
	out.writeUInt32LE(total, total - 4)
	return out
}

function pcapng(packets) {
	const shb = Buffer.alloc(28)
	shb.writeUInt32LE(0x0a0d0d0a, 0)
	shb.writeUInt32LE(28, 4)
	shb.writeUInt32LE(0x1a2b3c4d, 8)
	shb.writeUInt16LE(1, 12)
	shb.writeUInt16LE(0, 14)
	shb.writeBigInt64LE(-1n, 16)
	shb.writeUInt32LE(28, 24)
	const idbBody = Buffer.alloc(8)
	idbBody.writeUInt16LE(1, 0)
	idbBody.writeUInt32LE(65535, 4)
	const blocks = [shb, block(1, idbBody)]
	for (const packet of packets) {
		const padded = Buffer.alloc(20 + packet.length)
		padded.writeUInt32LE(0, 0)
		padded.writeUInt32LE(0, 4)
		padded.writeUInt32LE(0, 8)
		padded.writeUInt32LE(packet.length, 12)
		padded.writeUInt32LE(packet.length, 16)
		packet.copy(padded, 20)
		blocks.push(block(6, padded))
	}
	return Buffer.concat(blocks)
}

function sampleAnalysis() {
	const serverPort = 55000
	const client = frame('<client-details hostname="private" client-key="secret"/>')
	const subscribe = frame('<device-subscribe devid="3" subscribe="true"/>')
	const set = frame('<set devid="3"><item id="1259" value="Line"/><item id="1260" value="false"/><item id="1679" value="true"/></set>')
	const unknown = frame('<state-request devid="3"/>')
	const packets = [
		tcpPacket({ srcPort: 61000, dstPort: serverPort, seq: 1000, payload: Buffer.concat([client, subscribe]) }),
		tcpPacket({ srcPort: serverPort, dstPort: 61000, seq: 5000, payload: Buffer.concat([set, unknown]) }),
	]
	return analyzeCapture(pcapng(packets), serverPort)
}

test('passive parser reconstructs roots, direction and Core IDs', () => {
	const analysis = sampleAnalysis()
	assert.equal(analysis.frameCount, 4)
	assert.ok(analysis.unknownRoots.includes('state-request'))
	assert.deepEqual(analysis.coreServerToClient, ['1259','1260','1679'])
	assert.ok(analysis.frames.some((f) => f.direction === 'client->server' && f.root === 'device-subscribe'))
})

test('sanitized report contains no raw endpoint, XML or private values', () => {
	const report = buildSanitizedSessionReport({ analysis: sampleAnalysis(), captureSeconds: 25, serverPortChanged: false })
	assert.equal(validateSanitizedSessionReport(report), true)
	assert.doesNotMatch(report, /private|secret|127\.0\.0\.1|55000/)
	assert.doesNotMatch(report, /<state-request|Length=/)
	assert.match(report, /Unknown XML roots: state-request/)
})

test('sanitizer rejects private/raw additions', () => {
	const report = buildSanitizedSessionReport({ analysis: sampleAnalysis(), captureSeconds: 25, serverPortChanged: false })
	for (const bad of [
		`${report}\nC:\\Users\\Private\\capture.etl`,
		`${report}\n10.0.0.5`,
		`${report}\n<get devid="3"/>`,
		`${report}\nhostname=private`,
	]) assert.throws(() => validateSanitizedSessionReport(bad))
})

test('PowerShell harness is passive and deletes raw captures', () => {
	const ps = fs.readFileSync(path.resolve(__dirname, '..', 'tools', 'CAPTURE_OFFICIAL_SESSION.ps1'), 'utf8')
	assert.doesNotMatch(ps, /<set\b/i)
	assert.doesNotMatch(ps, /client-details|device-subscribe|keep-alive/i)
	assert.match(ps, /pktmon\.exe start --capture/)
	assert.match(ps, /etl2pcap/)
	assert.match(ps, /Remove-Item -LiteralPath \$etl/)
	assert.match(ps, /Remove-Item -LiteralPath \$pcap/)
	assert.doesNotMatch(ps, /Stop-Process|taskkill|Update-Firmware|restore-factory/i)
})

test('publisher metadata is restricted to passive-session branch', () => {
	const report = buildSanitizedSessionReport({ analysis: sampleAnalysis(), captureSeconds: 25, serverPortChanged: false })
	const doc = buildPublishedSession({
		reportText: report,
		sourceBranch: 'debug/official-client-passive-session',
		sourceCommit: 'a'.repeat(40),
		sourceFile: 'official_session_observer_20260821_120000.txt',
		nodeVersion: '22.23.2',
	})
	assert.match(doc, /Raw capture upload: none/)
	assert.throws(() => buildPublishedSession({ reportText: report, sourceBranch: 'main', sourceCommit: 'a'.repeat(40), sourceFile: 'official_session_observer_20260821_120000.txt', nodeVersion: '22.23.2' }))
})

test('publisher performs commit, push, remote verification and idempotent rerun', () => {
	if (!childProcess.spawnSync('git', ['--version'], { encoding: 'utf8' }).stdout) return
	const root = fs.mkdtempSync(path.join(os.tmpdir(), 'focusrite-session-publisher-test-'))
	const bare = path.join(root, 'remote.git')
	const repo = path.join(root, 'repo')
	try {
		childProcess.execFileSync('git', ['init', '--bare', bare], { stdio: 'ignore' })
		childProcess.execFileSync('git', ['init', repo], { stdio: 'ignore' })
		const git = (args, cwd = repo) => childProcess.execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore','pipe','pipe'] })
		git(['config','user.name','Test'])
		git(['config','user.email','test@example.invalid'])
		fs.writeFileSync(path.join(repo, 'seed.txt'), 'seed\n')
		git(['add','seed.txt']); git(['commit','-m','seed']); git(['branch','-M','debug/official-client-passive-session'])
		git(['remote','add','origin',bare]); git(['push','-u','origin','debug/official-client-passive-session'])
		git(['switch','--orphan','diagnostics/readback-results'])
		fs.rmSync(path.join(repo, 'seed.txt'), { force: true })
		fs.mkdirSync(path.join(repo,'diagnostics','runtime'), { recursive: true })
		fs.writeFileSync(path.join(repo,'diagnostics','runtime','README.md'), 'sanitized only\n')
		git(['add','.']); git(['commit','-m','diagnostics seed']); git(['push','-u','origin','diagnostics/readback-results'])
		git(['switch','debug/official-client-passive-session'])
		const results = path.join(repo, 'probe-results'); fs.mkdirSync(results)
		const report = buildSanitizedSessionReport({ analysis: sampleAnalysis(), captureSeconds: 25, serverPortChanged: false })
		fs.writeFileSync(path.join(results, 'official_session_observer_20260821_120000.txt'), report)
		const script = path.resolve(__dirname, '..', 'tools', 'publish-sanitized-passive-session.js')
		const env = { ...process.env, NODE_ENV:'test', FOCUSRITE_SESSION_PUBLISH_TEST_ROOT:repo, FOCUSRITE_SESSION_PUBLISH_TEST_BRANCH:'diagnostics/readback-results', FOCUSRITE_SESSION_PUBLISH_TEST_SOURCE_BRANCH:'debug/official-client-passive-session' }
		childProcess.execFileSync(process.execPath, [script], { cwd: repo, env, stdio: 'pipe' })
		git(['fetch','origin','diagnostics/readback-results'])
		const first = git(['show','origin/diagnostics/readback-results:diagnostics/runtime/latest-official-session-observer.md'])
		assert.match(first, /PASSIVE SESSION OBSERVER v1/)
		const before = git(['rev-parse','origin/diagnostics/readback-results']).trim()
		childProcess.execFileSync(process.execPath, [script], { cwd: repo, env, stdio: 'pipe' })
		git(['fetch','origin','diagnostics/readback-results'])
		assert.equal(git(['rev-parse','origin/diagnostics/readback-results']).trim(), before)
	} finally { fs.rmSync(root, { recursive:true, force:true }) }
})

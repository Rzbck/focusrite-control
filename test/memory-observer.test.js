const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const test = require('node:test')
const {
	buildSanitizedMemoryReport,
	validateSanitizedMemoryReport,
	buildPublishedMemory,
} = require('../tools/memory-observer-lib')
const {
	decodeStatusBuffer,
	parseStatusText,
	readStatusFile,
	buildPublishedStatus,
} = require('../tools/memory-observer-status-lib')

function evidence() {
	return {
		ProcessesAttempted: 2,
		ProcessesScanned: 2,
		ScanLimitReached: false,
		RestartDetected: true,
		Frames: [
			{ Root:'client-details', Attributes:['hostname','client-key'], CoreIds:[], Count:1 },
			{ Root:'device-subscribe', Attributes:['devid','subscribe'], CoreIds:[], Count:1 },
			{ Root:'set', Attributes:['devid'], CoreIds:['1259','1260','1679'], Count:2 },
			{ Root:'state-request', Attributes:['devid'], CoreIds:[], Count:1 },
		],
	}
}

test('memory report exposes only normalized roots/attribute names/Core IDs', () => {
	const report = buildSanitizedMemoryReport(evidence())
	assert.equal(validateSanitizedMemoryReport(report), true)
	assert.match(report, /Unknown concrete XML roots: state-request/)
	assert.match(report, /1259:Input 1 Mode/)
	assert.doesNotMatch(report, /<state-request|Length=|127\.0\.0\.1|C:\\/)
})

test('memory sanitizer rejects raw paths, endpoints and XML', () => {
	const report = buildSanitizedMemoryReport(evidence())
	for (const bad of [
		`${report}\nC:\\Users\\Private\\dump.bin`,
		`${report}\n127.0.0.1`,
		`${report}\n<set devid="1"/>`,
		`${report}\nLength=000010 <set/>`,
	]) assert.throws(() => validateSanitizedMemoryReport(bad))
})

test('memory publisher metadata is branch restricted', () => {
	const report = buildSanitizedMemoryReport(evidence())
	const doc = buildPublishedMemory({
		reportText:report,
		sourceBranch:'debug/official-client-memory-observer',
		sourceCommit:'a'.repeat(40),
		sourceFile:'official_client_memory_observer_20260821_120000.txt',
		nodeVersion:'22.23.2',
	})
	assert.match(doc, /Raw memory upload: none/)
	assert.throws(() => buildPublishedMemory({reportText:report,sourceBranch:'main',sourceCommit:'a'.repeat(40),sourceFile:'official_client_memory_observer_20260821_120000.txt',nodeVersion:'22.23.2'}))
})

test('C# scanner is read-only and contains no process injection/write primitives', () => {
	const cs = fs.readFileSync(path.resolve(__dirname,'..','tools','FocusriteMemoryObserver.cs'),'utf8')
	assert.match(cs, /OpenProcess/)
	assert.match(cs, /VirtualQueryEx/)
	assert.match(cs, /ReadProcessMemory/)
	assert.doesNotMatch(cs, /WriteProcessMemory|VirtualAllocEx|CreateRemoteThread|NtCreateThreadEx|QueueUserAPC|SetThreadContext|TerminateProcess/i)
})

test('PowerShell harness does not dump memory or alter Focusrite processes', () => {
	const ps = fs.readFileSync(path.resolve(__dirname,'..','tools','OBSERVE_OFFICIAL_CLIENT_MEMORY.ps1'),'utf8')
	assert.doesNotMatch(ps, /procdump|MiniDumpWriteDump|Stop-Process|taskkill|Start-Process[^\r\n]+Focusrite|WriteProcessMemory/i)
	assert.match(ps, /MemoryObserver\]::Scan/)
	assert.match(ps, /MEMORY_OBSERVER_EVIDENCE\.json/)
})

test('status parser tolerates UTF-8 BOM and UTF-16LE Windows files', () => {
	const text = 'outcome=FAILED\r\nstage=scan-memory\r\ncode=process-memory-unreadable\r\n'
	assert.equal(parseStatusText(`\uFEFF${text}`).stage, 'scan-memory')
	assert.equal(parseStatusText(decodeStatusBuffer(Buffer.concat([Buffer.from([0xff,0xfe]),Buffer.from(text,'utf16le')]))).code, 'process-memory-unreadable')
})

test('missing/invalid status falls back to a fixed safe tuple', () => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(),'focusrite-memory-status-'))
	try {
		const file = path.join(dir,'status.txt')
		fs.writeFileSync(file,'private garbage C:\\Users\\x')
		assert.deepEqual(readStatusFile(file), { outcome:'FAILED', stage:'bootstrap', code:'status-file-invalid' })
		const published = buildPublishedStatus({ status:readStatusFile(file), sourceBranch:'debug/official-client-memory-observer', sourceCommit:'a'.repeat(40), nodeVersion:'22.23.2' })
		assert.doesNotMatch(published, /Users|private garbage/)
	} finally { fs.rmSync(dir,{recursive:true,force:true}) }
})

const assert = require('node:assert/strict')
const test = require('node:test')
const { analyzeOfficialCapture, itemIdsWithNonEmptyValue } = require('../tools/passive-session-official-filter')
const { assignMixBaselineStatus, safeAssignMixList } = require('../tools/parse-passive-session')

function frame(xml) {
	return Buffer.from(`Length=${Buffer.byteLength(xml, 'utf8').toString(16).toUpperCase().padStart(6, '0')} ${xml}`, 'utf8')
}
function tcpPacket({ srcPort, dstPort, seq, payload }) {
	const eth = Buffer.alloc(14); eth.writeUInt16BE(0x0800, 12)
	const ip = Buffer.alloc(20); ip[0]=0x45; ip.writeUInt16BE(40+payload.length,2); ip[8]=64; ip[9]=6; ip.set([127,0,0,1],12); ip.set([127,0,0,1],16)
	const tcp = Buffer.alloc(20); tcp.writeUInt16BE(srcPort,0); tcp.writeUInt16BE(dstPort,2); tcp.writeUInt32BE(seq>>>0,4); tcp[12]=0x50; tcp[13]=0x18
	return Buffer.concat([eth,ip,tcp,payload])
}
function block(type, body) {
	const pad=(4-(body.length%4))%4; const total=12+body.length+pad; const out=Buffer.alloc(total)
	out.writeUInt32LE(type,0); out.writeUInt32LE(total,4); body.copy(out,8); out.writeUInt32LE(total,total-4); return out
}
function pcapng(packets) {
	const shb=Buffer.alloc(28); shb.writeUInt32LE(0x0a0d0d0a,0); shb.writeUInt32LE(28,4); shb.writeUInt32LE(0x1a2b3c4d,8); shb.writeUInt16LE(1,12); shb.writeBigInt64LE(-1n,16); shb.writeUInt32LE(28,24)
	const idb=Buffer.alloc(8); idb.writeUInt16LE(1,0); idb.writeUInt32LE(65535,4)
	const blocks=[shb,block(1,idb)]
	for (const packet of packets) { const body=Buffer.alloc(20+packet.length); body.writeUInt32LE(packet.length,12); body.writeUInt32LE(packet.length,16); packet.copy(body,20); blocks.push(block(6,body)) }
	return Buffer.concat(blocks)
}

test('item target parser requires a non-empty value attribute', () => {
	const xml = '<device-arrival><item id="1471"/><item value="A" id="1481"/><item id="1471" value=""/></device-arrival>'
	assert.deepEqual(itemIdsWithNonEmptyValue(xml, new Set(['1471','1481'])), ['1481'])
})

test('official filter excludes Companion and reports Line 3-4 assign-mix value coverage by root', () => {
	const port=55000
	const companionClient=frame('<client-details hostname="Companion Scarlett 18i20" client-key="private-companion-key"/>')
	const companionSet=frame('<set devid="3"><item id="1471" value="companion-only"/></set>')
	const officialClient=frame('<client-details hostname="PRIVATE-PC" client-key="private-official-key"/>')
	const officialSubscribe=frame('<device-subscribe devid="3" subscribe="true"/>')
	const officialArrival=frame('<device-arrival devid="3"><schema><item id="1471"/></schema><initial-state><item id="1471" value="baseline-a"/><item value="baseline-b" id="1481"/></initial-state></device-arrival>')
	const officialSet=frame('<set devid="3"><item id="1259" value="Line"/><item id="1679" value="true"/><item id="1471" value="later"/></set>')
	const packets=[
		tcpPacket({srcPort:61001,dstPort:port,seq:100,payload:companionClient}),
		tcpPacket({srcPort:port,dstPort:61001,seq:200,payload:companionSet}),
		tcpPacket({srcPort:61002,dstPort:port,seq:300,payload:Buffer.concat([officialClient,officialSubscribe])}),
		tcpPacket({srcPort:port,dstPort:61002,seq:400,payload:Buffer.concat([officialArrival,officialSet])}),
	]
	const result=analyzeOfficialCapture(pcapng(packets),port)
	assert.equal(result.companionSessionsExcluded,1)
	assert.equal(result.nonCompanionSessions,1)
	assert.deepEqual(result.coreServerToClient,['1259','1679'])
	assert.deepEqual(result.assignMixInitialServerToClient,['1471','1481'])
	assert.deepEqual(result.assignMixSetServerToClient,['1471'])
})

test('assign-mix preflight status requires exactly one official session and both initial values', () => {
	assert.equal(assignMixBaselineStatus({ nonCompanionSessions: 1, assignMixInitialServerToClient: ['1471','1481'] }), 'COMPLETE_INITIAL_VALUE_BASELINE')
	assert.equal(assignMixBaselineStatus({ nonCompanionSessions: 1, assignMixInitialServerToClient: ['1471'] }), 'PARTIAL_INITIAL_VALUE_BASELINE')
	assert.equal(assignMixBaselineStatus({ nonCompanionSessions: 1, assignMixInitialServerToClient: [] }), 'NO_INITIAL_VALUE_BASELINE')
	assert.equal(assignMixBaselineStatus({ nonCompanionSessions: 2, assignMixInitialServerToClient: ['1471','1481'] }), 'AMBIGUOUS_OFFICIAL_SESSION')
	assert.equal(safeAssignMixList(['1471','1481']), 'Line Output 3, Line Output 4')
})

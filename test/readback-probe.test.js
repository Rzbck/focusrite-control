const test = require('node:test')
const assert = require('node:assert/strict')
const buildSynthetic18i20Schema = require('../test-support/synthetic-18i20')
const {
	DISCOVERY_REQUEST_XML,
	frameXml,
	decodeFrames,
	assertAllowedTcpXml,
	buildClientDetails,
	buildDeviceSubscribe,
	buildKeepAlive,
	collectCoreTargets,
	createCollector,
	seedCollectorFromArrival,
	applySetToCollector,
	summarizeCollector,
	parseDeviceArrival,
	parseSetMessage,
} = require('../tools/readback-probe-lib')

test('readback probe framing round-trips UTF-8', () => {
	const xml = '<client-details hostname="ReadOnly é"/>'
	const decoded = decodeFrames(frameXml(xml))
	assert.deepEqual(decoded.frames, [xml])
	assert.equal(decoded.remaining.length, 0)
})

test('readback probe discovery packet is exact and fixed', () => {
	assert.equal(DISCOVERY_REQUEST_XML, '<client-discovery app="SAFFIRE-CONTROL" version="4"/>')
})

test('readback probe TCP allowlist accepts only session messages', () => {
	assert.equal(assertAllowedTcpXml(buildClientDetails('probe', 'key')), 'client-details')
	assert.equal(assertAllowedTcpXml(buildDeviceSubscribe('2', true)), 'device-subscribe')
	assert.equal(assertAllowedTcpXml(buildDeviceSubscribe('2', false)), 'device-subscribe')
	assert.equal(assertAllowedTcpXml(buildKeepAlive()), 'keep-alive')
	assert.throws(() => assertAllowedTcpXml('<set devid="2"><item id="1" value="true"/></set>'), /SAFETY BLOCK/)
	assert.throws(() => assertAllowedTcpXml('<client-discovery app="SAFFIRE-CONTROL" version="4"/>'), /SAFETY BLOCK/)
	assert.throws(() => assertAllowedTcpXml('<reset-device/>'), /SAFETY BLOCK/)
})

test('readback probe derives exactly 21 Core controls from the parsed 18i20 schema', () => {
	const device = parseDeviceArrival(buildSynthetic18i20Schema())
	const targets = collectCoreTargets(device)
	assert.equal(targets.length, 21)
	assert.equal(new Set(targets.map((target) => target.id)).size, 21)
	assert.deepEqual(
		targets.map((target) => target.name),
		[
			'Air 1', 'Pad 1', 'Input 1 Mode',
			'Air 2', 'Pad 2', 'Input 2 Mode',
			'Air 3', 'Pad 3', 'Air 4', 'Pad 4', 'Air 5', 'Pad 5',
			'Air 6', 'Pad 6', 'Air 7', 'Pad 7', 'Air 8', 'Pad 8',
			'Monitor Mute', 'Monitor Dim', 'Talkback',
		],
	)
})

test('readback probe records only server-confirmed values and keeps missing state missing', () => {
	const device = parseDeviceArrival(buildSynthetic18i20Schema())
	const targets = collectCoreTargets(device)
	const collector = createCollector('test')
	seedCollectorFromArrival(collector, targets, device)
	assert.equal(collector.seen.size, 0)

	const air1 = targets.find((target) => target.name === 'Air 1')
	const mute = targets.find((target) => target.name === 'Monitor Mute')
	applySetToCollector(
		collector,
		targets,
		parseSetMessage(`<set devid="${device.id}"><item id="${air1.id}" value="false"/><item id="${mute.id}" value="true"/></set>`),
		device.id,
	)

	const summary = summarizeCollector(collector, targets)
	assert.equal(summary.seen, 2)
	assert.equal(summary.missing, 19)
	assert.equal(summary.rows.find((row) => row.name === 'Air 1').value, 'false')
	assert.equal(summary.rows.find((row) => row.name === 'Monitor Mute').value, 'true')
	assert.equal(summary.rows.find((row) => row.name === 'Pad 1').value, '<MISSING>')
})

test('readback probe ignores set packets for another device id', () => {
	const device = parseDeviceArrival(buildSynthetic18i20Schema())
	const targets = collectCoreTargets(device)
	const collector = createCollector('test')
	const air1 = targets.find((target) => target.name === 'Air 1')
	applySetToCollector(
		collector,
		targets,
		parseSetMessage(`<set devid="999"><item id="${air1.id}" value="true"/></set>`),
		device.id,
	)
	assert.equal(collector.seen.size, 0)
	assert.equal(collector.setPackets, 0)
})

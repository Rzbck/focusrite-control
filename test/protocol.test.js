const test = require('node:test')
const assert = require('node:assert/strict')
const { FocusriteClient, frameXml, decodeFrames, DISCOVERY_REQUEST_XML } = require('../src/focusrite-client')
const { parseDeviceArrival, parseSetMessage, parseServerAnnouncement } = require('../src/device-parser')

test('Focusrite framing is byte-safe and round-trips UTF-8', () => {
	const xml = '<client-details hostname="Companion é"/>'
	const framed = frameXml(xml)
	const result = decodeFrames(framed)
	assert.deepEqual(result.frames, [xml])
	assert.equal(result.remaining.length, 0)
})


test('Focusrite discovery request matches proven Control Server packet', () => {
	assert.equal(DISCOVERY_REQUEST_XML, '<client-discovery app="SAFFIRE-CONTROL" version="4"/>')
	const result = decodeFrames(frameXml(DISCOVERY_REQUEST_XML))
	assert.deepEqual(result.frames, [DISCOVERY_REQUEST_XML])
})


test('server announcement parses Focusrite single-quoted attributes', () => {
	const result = parseServerAnnouncement(
		"<server-announcement app='SAFFIRE-CONTROL' port='49678' hostname='TEST-PC'/>",
	)
	assert.equal(result.port, 49678)
	assert.equal(result.attrs.app, 'SAFFIRE-CONTROL')
	assert.equal(result.attrs.hostname, 'TEST-PC')
})

test('server announcement parses dynamic port', () => {
	const result = parseServerAnnouncement('<server-announcement hostname="PC" port="49678"/>')
	assert.equal(result.port, 49678)
})

test('set parser returns item updates', () => {
	const set = parseSetMessage('<set devid="2"><item id="1679" value="true"/><item id="1677" value="-8"/></set>')
	assert.equal(set.deviceId, '2')
	assert.deepEqual(set.items, [
		{ id: '1679', value: 'true' },
		{ id: '1677', value: '-8' },
	])
})


test('device subscription explicitly requests subscribe=true', () => {
	const client = new FocusriteClient()
	let sent = ''
	client.send = (xml) => {
		sent = xml
		return true
	}
	assert.equal(client.subscribeDevice('1'), true)
	assert.equal(sent, '<device-subscribe devid="1" subscribe="true"/>')
})

test('client-details response captures the Control Server client id', () => {
	const client = new FocusriteClient()
	let assigned = ''
	client.on('client-id', (id) => {
		assigned = id
	})
	client.parseMessage("<client-details id='42' hostname='Companion'/>")
	assert.equal(client.serverClientId, '42')
	assert.equal(assigned, '42')
})

test('approval is applied only to the assigned Companion client id', () => {
	const client = new FocusriteClient()
	const events = []
	client.on('approval', (event) => events.push(event))

	client.parseMessage("<client-details id='42'/>")
	client.parseMessage("<approval id='99' authorised='true'/>")
	assert.equal(client.authorised, null)
	assert.deepEqual(events, [])

	client.parseMessage("<approval id='42' authorised='false'/>")
	assert.equal(client.authorised, false)
	assert.deepEqual(events, [{ id: '42', authorised: false }])

	client.parseMessage("<approval id='42' authorised='true'/>")
	assert.equal(client.authorised, true)
	assert.deepEqual(events, [
		{ id: '42', authorised: false },
		{ id: '42', authorised: true },
	])
})

test('approval received before client-details is applied once our id is known', () => {
	const client = new FocusriteClient()
	client.parseMessage("<approval id='77' authorised='true'/>")
	assert.equal(client.authorised, null)
	client.parseMessage("<client-details id='77'/>")
	assert.equal(client.authorised, true)
})

test('writes are blocked until Focusrite authorises our client', () => {
	const client = new FocusriteClient()
	client.connected = true
	let writes = 0
	client.socket = {
		write() {
			writes += 1
		},
	}
	const blocked = []
	client.on('write-blocked', (event) => blocked.push(event))

	assert.equal(client.setValue('1', '1274', 'true'), false)
	assert.equal(writes, 0)
	assert.equal(blocked.length, 1)

	client.authorised = true
	assert.equal(client.setValue('1', '1274', 'true'), true)
	assert.equal(writes, 1)
})


test('18i20 schema parser extracts verified controls', () => {
	const xml = `<device-arrival><device id="2" protocol="USB" model="Scarlett 18i20 (3rd Gen)" class="Scarlett" serial-number="TEST">
		<nickname id="2"/><preset id="6"><enum value="Direct Routing"/><enum value="Empty"/></preset><firmware><version id="8"/></firmware>
		<mixer><inputs><input><source id="18"/><stereo id="19"/></input></inputs><mixes>
			<mix id="66" name="Mix A" stereo-name="Mix A"><meter id="164"/><talkback id="67"/><input><gain id="68"/><pan id="69"/><mute id="70"/><solo id="71"/></input></mix>
			<mix id="165" name="Mix A" stereo-name=""><meter id="263"/><talkback id="166"/><input><gain id="167"/><pan id="168"/><mute id="169"/><solo id="170"/></input></mix>
		</mixes></mixer>
		<inputs><analogue id="1255" name="Analogue 1" stereo-name="Analogue 1-2" hidden="false" supports-talkback="true"><available id="1257"/><meter id="1258"/><nickname id="1256"/><mode id="1259"><enum value="Line"/><enum value="Inst"/></mode><air id="1260"/><pad id="1261"/></analogue>
		<analogue id="1262" name="Analogue 2" stereo-name="" hidden="false" supports-talkback="true"><available id="1264"/><meter id="1265"/><nickname id="1263"/><mode id="1266"><enum value="Line"/><enum value="Inst"/></mode><air id="1267"/><pad id="1268"/></analogue></inputs>
		<outputs><analogue name="Monitor Output 1" stereo-name="Monitor Outputs 1-2"><available id="1449"/><meter id="1450"/><mute id="1453"/><source id="1454"/><stereo id="1455"/><nickname id="1456"/><gain id="1458"/></analogue><analogue name="Monitor Output 2" stereo-name=""><available id="1459"/><meter id="1460"/><mute id="1463"/><source id="1464"/><stereo id="1465"/><nickname id="1466"/><gain id="1468"/></analogue></outputs><record-outputs/>
		<monitoring><hardware-controls><hardware-controls exclusive="true"><gain id="1677"/><dim id="1678"/><mute id="1679"/><alt-enable id="1680"/><alt id="1681"/></hardware-controls><talkback id="1682"/></hardware-controls><preset id="1683"><enum value="1-2"/><enum value="None"/></preset></monitoring>
		<clocking><locked id="1684"/><clock-source id="1685"><enum value="Internal"/><enum value="ADAT"/></clock-source><sample-rate id="1686"><enum value="44.1 kHz"/><enum value="48 kHz"/></sample-rate></clocking>
		<settings><buffer-size id="1688"></buffer-size><spdif-mode><mode id="1689"><enum value="S/PDIF RCA"/><enum value="Dual ADAT"/></mode></spdif-mode><phantom-persistence id="1690"/><talkback><talkback-input-source id="1691"/><source-attenuation id="1692"/><talkback-available id="1693"/></talkback></settings>
	</device></device-arrival>`
	const device = parseDeviceArrival(xml)
	assert.equal(device.model, 'Scarlett 18i20 (3rd Gen)')
	assert.equal(device.hardwareInputs.length, 2)
	assert.equal(device.hardwareInputs[0].air, '1260')
	assert.deepEqual(device.hardwareInputs[0].modeValues, ['Line', 'Inst'])
	assert.equal(device.monitoring.mute, '1679')
	assert.equal(device.monitoring.talkback, '1682')
	assert.equal(device.outputs[0].source, '1454')
	assert.equal(device.outputs[0].pairIndex, 1)
	assert.equal(device.mixes[0].inputs[0].mute, '70')
	assert.equal(device.mixerSlots[0].source, '18')
	assert.equal(device.settings.clockSource, '1685')
	assert.ok(device.writableIds.has('1679'))
	assert.ok(device.writableIds.has('1260'))
	assert.ok(!device.writableIds.has('1258'))
	assert.ok(!device.writableIds.has('1688'))
	assert.ok(!device.writableIds.has('1692'))
	assert.ok(!device.writableIds.has('1677'))
})


test('device-arrival parser preserves server-confirmed value attributes as initial state', () => {
	const xml = `<device-arrival><device id="2" protocol="USB" model="Scarlett 18i20 (3rd Gen)">
		<mixer><inputs></inputs><mixes></mixes></mixer>
		<inputs><analogue id="1255" name="Analogue 1" hidden="false"><mode id="1259" value="Line"><enum value="Line"/><enum value="Inst"/></mode><air id="1260" value="false"/><pad id="1261" value="true"/></analogue></inputs>
		<outputs></outputs><record-outputs/>
		<monitoring><hardware-controls><hardware-controls exclusive="true"><dim id="1678" value="false"/><mute id="1679" value="true"/></hardware-controls><talkback id="1682" value="false"/></hardware-controls></monitoring>
		<clocking></clocking><settings></settings>
	</device></device-arrival>`

	const device = parseDeviceArrival(xml)
	assert.equal(device.initialState.get('1260'), 'false')
	assert.equal(device.initialState.get('1261'), 'true')
	assert.equal(device.initialState.get('1259'), 'Line')
	assert.equal(device.initialState.get('1678'), 'false')
	assert.equal(device.initialState.get('1679'), 'true')
	assert.equal(device.initialState.get('1682'), 'false')
})

test('client subscribes once and becomes ready from any server-confirmed device-arrival state', () => {
	const client = new FocusriteClient({ targetModel: 'Scarlett 18i20 (3rd Gen)' })
	const subscriptions = []
	client.subscribeDevice = (deviceId) => {
		subscriptions.push(String(deviceId))
		return true
	}
	let readyCount = 0
	client.on('ready', () => {
		readyCount += 1
	})

	const xml = `<device-arrival><device id="2" protocol="USB" model="Scarlett 18i20 (3rd Gen)">
		<mixer><inputs></inputs><mixes></mixes></mixer>
		<inputs><analogue id="1255" name="Analogue 1" hidden="false"><mode id="1259" value="Line"><enum value="Line"/><enum value="Inst"/></mode><air id="1260"/><pad id="1261"/></analogue></inputs>
		<outputs></outputs><record-outputs/>
		<monitoring><hardware-controls><hardware-controls exclusive="true"><dim id="1678"/><mute id="1679"/></hardware-controls><talkback id="1682" value="false"/></hardware-controls></monitoring>
		<clocking></clocking><settings></settings>
	</device></device-arrival>`

	client.parseMessage(xml)

	assert.deepEqual(subscriptions, ['2'])
	assert.equal(client.ready, true)
	assert.equal(readyCount, 1)
	assert.equal(client.getValue('1259'), 'Line')
	assert.equal(client.getValue('1682'), 'false')
	assert.equal(client.getValue('1260'), undefined)
	assert.equal(client.getValue('1679'), undefined)
	client.stop()
})

test('first set marks the subscription ready and missing values remain unknown', () => {
	const client = new FocusriteClient({ targetModel: 'Scarlett 18i20 (3rd Gen)' })
	const subscriptions = []
	client.subscribeDevice = (deviceId) => {
		subscriptions.push(String(deviceId))
		return true
	}

	const xml = `<device-arrival><device id="2" protocol="USB" model="Scarlett 18i20 (3rd Gen)">
		<mixer><inputs></inputs><mixes></mixes></mixer>
		<inputs><analogue id="1255" name="Analogue 1" hidden="false"><mode id="1259"><enum value="Line"/><enum value="Inst"/></mode><air id="1260"/><pad id="1261"/></analogue></inputs>
		<outputs></outputs><record-outputs/>
		<monitoring><hardware-controls><hardware-controls exclusive="true"><dim id="1678"/><mute id="1679"/></hardware-controls><talkback id="1682"/></hardware-controls></monitoring>
		<clocking></clocking><settings></settings>
	</device></device-arrival>`

	client.parseMessage(xml)
	assert.equal(client.ready, false)
	assert.deepEqual(subscriptions, ['2'])

	client.parseMessage('<set devid="2"><item id="1260" value="false"/></set>')
	assert.equal(client.ready, true)
	assert.equal(client.getValue('1260'), 'false')
	assert.equal(client.getValue('1261'), undefined)
	assert.deepEqual(subscriptions, ['2'])
	client.stop()
})

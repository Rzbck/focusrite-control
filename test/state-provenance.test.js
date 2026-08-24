'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const { FocusriteClient } = require('../src/focusrite-client')
const { buildVariableDefinitions, buildVariableValues } = require('../src/variables')

function deviceArrival() {
	return `<device-arrival><device id="2" protocol="USB" model="Scarlett 18i20 (3rd Gen)">
		<mixer><inputs><input><source id="18"/><stereo id="19"/></input></inputs><mixes>
			<mix id="66" name="Mix A" stereo-name="Mix A"><meter id="164"/><input><gain id="68" value="-12"/><pan id="69"/><mute id="70"/><solo id="71" value="false"/></input></mix>
		</mixes></mixer>
		<inputs></inputs><outputs></outputs><record-outputs/>
		<monitoring></monitoring><clocking></clocking><settings></settings>
	</device></device-arrival>`
}

test('state provenance distinguishes arrival, set, arrival+set and never observed without changing values', () => {
	const client = new FocusriteClient({ targetModel: 'Scarlett 18i20 (3rd Gen)' })
	client.subscribeDevice = () => true

	client.parseMessage(deviceArrival())
	assert.equal(client.getValue('68'), '-12')
	assert.equal(client.getValueProvenance('68'), 'arrival')
	assert.equal(client.getValue('70'), undefined)
	assert.equal(client.getValueProvenance('70'), '')
	assert.equal(client.getValue('71'), 'false')
	assert.equal(client.getValueProvenance('71'), 'arrival')

	client.parseMessage('<set devid="2"><item id="68" value="-10"/><item id="70" value="true"/></set>')
	assert.equal(client.getValue('68'), '-10')
	assert.equal(client.getValueProvenance('68'), 'arrival+set')
	assert.equal(client.getValue('70'), 'true')
	assert.equal(client.getValueProvenance('70'), 'set')
	assert.equal(client.getValue('71'), 'false')
	assert.equal(client.getValueProvenance('71'), 'arrival')

	client.parseMessage('<set devid="999"><item id="71" value="true"/></set>')
	assert.equal(client.getValue('71'), 'false')
	assert.equal(client.getValueProvenance('71'), 'arrival')
	client.stop()
})

test('mixer provenance variables exist only with detailed mixer variables enabled', () => {
	const device = {
		monitoring: {},
		sources: [],
		hardwareInputs: [],
		outputs: [],
		mixerSlots: [],
		mixes: [
			{
				label: 'Mix A L',
				name: 'Mix A',
				inputs: [{ index: 0, gain: '68', pan: '69', mute: '70', solo: '71' }],
			},
		],
		settings: {},
		descriptors: new Map(),
	}
	const client = {
		connected: true,
		authorised: true,
		ready: true,
		server: {},
		getValue(id) {
			return { 68: '-10', 70: 'true', 71: 'false' }[String(id)]
		},
		getValueProvenance(id) {
			return { 68: 'arrival+set', 70: 'set', 71: 'arrival' }[String(id)] || ''
		},
	}

	const hidden = buildVariableDefinitions({ device, client, config: { exposeMixerVariables: false } })
	assert.equal(hidden.mix_mix_a_l_slot_1_gain_provenance, undefined)
	assert.equal(hidden.mix_mix_a_l_slot_1_mute_provenance, undefined)
	assert.equal(hidden.mix_mix_a_l_slot_1_solo_provenance, undefined)

	const instance = { device, client, config: { exposeMixerVariables: true } }
	const defs = buildVariableDefinitions(instance)
	assert.ok(defs.mix_mix_a_l_slot_1_gain_provenance)
	assert.ok(defs.mix_mix_a_l_slot_1_mute_provenance)
	assert.ok(defs.mix_mix_a_l_slot_1_solo_provenance)
	assert.equal(defs.mix_mix_a_l_slot_1_pan_provenance, undefined)

	const values = buildVariableValues(instance)
	assert.equal(values.mix_mix_a_l_slot_1_gain, '-10')
	assert.equal(values.mix_mix_a_l_slot_1_gain_provenance, 'arrival+set')
	assert.equal(values.mix_mix_a_l_slot_1_mute_provenance, 'set')
	assert.equal(values.mix_mix_a_l_slot_1_solo_provenance, 'arrival')
})

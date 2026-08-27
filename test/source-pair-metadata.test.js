'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const Module = require('node:module')

const originalLoad = Module._load
Module._load = function patchedLoad(request, parent, isMain) {
	if (request === '@companion-module/base') {
		return {
			combineRgb: () => 0,
			InstanceBase: class InstanceBase {},
			Regex: { IP: '/.*/' },
			InstanceStatus: {},
		}
	}
	return originalLoad.call(this, request, parent, isMain)
}

const { parseDeviceArrival } = require('../src/device-parser')
const { buildVariableDefinitions, buildVariableValues } = require('../src/variables')
const buildSynthetic18i20Schema = require('../test-support/synthetic-18i20')
const { schemaSourcePairs } = require('../testbench/FullTestBenchV1ReleaseV4')

test.after(() => {
	Module._load = originalLoad
})

test('source variables expose parser pair metadata without guessing names', () => {
	const device = parseDeviceArrival(buildSynthetic18i20Schema())
	const instance = {
		device,
		config: { exposeMixerVariables: false },
		client: {
			connected: true,
			ready: true,
			authorised: true,
			getValue() {
				return ''
			},
		},
	}
	const defs = buildVariableDefinitions(instance)
	const values = buildVariableValues(instance)
	assert.ok(defs.source_1_pair_side)
	assert.ok(defs.source_1_pair_root_id)
	assert.equal(values.source_1_pair_side, 'L')
	assert.equal(values.source_2_pair_side, 'R')
	assert.equal(String(values.source_1_pair_root_id), String(device.sources[1].id))
	assert.equal(String(values.source_2_pair_root_id), String(device.sources[0].id))
})

test('release pair oracle accepts only reciprocal schema pairs', () => {
	const good = [
		{ id: '10', name: 'Playback 1', type: 'playback', pairSide: 'L', pairId: '11' },
		{ id: '11', name: 'Playback 2', type: 'playback', pairSide: 'R', pairId: '10' },
	]
	assert.equal(schemaSourcePairs(good).length, 1)

	const nameOnly = [
		{ id: '20', name: 'Playback 3', type: 'playback', pairSide: '', pairId: '' },
		{ id: '21', name: 'Playback 4', type: 'playback', pairSide: '', pairId: '' },
	]
	assert.equal(schemaSourcePairs(nameOnly).length, 0, 'adjacent names are not pair proof')

	const oneWay = [
		{ id: '30', name: 'Playback 5', type: 'playback', pairSide: 'L', pairId: '31' },
		{ id: '31', name: 'Playback 6', type: 'playback', pairSide: 'R', pairId: '' },
	]
	assert.equal(schemaSourcePairs(oneWay).length, 0, 'pair metadata must be reciprocal')
})

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

test('parser pair metadata is reciprocal on the synthetic 18i20 schema', () => {
	const device = parseDeviceArrival(buildSynthetic18i20Schema())
	const paired = device.sources.filter((source) => source.pairId)
	assert.ok(paired.length > 0)

	for (const source of paired) {
		const mate = device.sources.find((candidate) => String(candidate.id) === String(source.pairId))
		assert.ok(mate, `missing pair mate for source ${source.id}`)
		assert.equal(String(mate.pairId), String(source.id))
		assert.notEqual(source.pairSide, mate.pairSide)
	}
})

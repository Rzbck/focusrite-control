'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const EventEmitter = require('node:events')
const FocusriteInstance = require('../src/main')

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

function makeLifecycleHarness() {
	const instance = Object.create(FocusriteInstance.prototype)
	const client = new EventEmitter()
	client.authorised = true
	client.ready = true

	instance.client = client
	instance.device = {
		model: 'Scarlett 18i20 (3rd Gen)',
		id: 'device-test',
		outputs: [{ available: 'available-1' }, { available: 'available-2' }],
		meterIds: new Set(['meter-1']),
	}
	instance.config = { debug: false, meterHz: 5 }
	instance.definitionRefreshTimer = null
	instance.pendingDefinitionRefresh = false

	let actionRefreshes = 0
	let presetRefreshes = 0
	instance.updateActions = () => {
		actionRefreshes += 1
	}
	instance.updatePresets = () => {
		presetRefreshes += 1
	}
	instance.updateStatus = () => {}
	instance.setVariableValues = () => {}
	instance.log = () => {}
	instance.scheduleNonMeterFlush = () => {}
	instance.scheduleMeterFlush = () => {}
	instance.checkFeedbacks = () => {}

	instance.attachClientEvents()
	return {
		instance,
		client,
		counts: () => ({ actionRefreshes, presetRefreshes }),
	}
}

test('ready plus initial Output availability materialisation refreshes the filtered write surface once', async () => {
	const { instance, client, counts } = makeLifecycleHarness()

	client.emit('ready')
	client.emit('state', {
		deviceId: 'device-test',
		items: [{ id: 'available-1', value: 'true' }],
	})
	await sleep(140)

	assert.deepEqual(counts(), { actionRefreshes: 1, presetRefreshes: 1 })
	assert.equal(instance.definitionRefreshTimer, null)
	assert.equal(instance.pendingDefinitionRefresh, false)
})

test('ordinary state does not rebuild definitions but later Output availability changes do', async () => {
	const { instance, client, counts } = makeLifecycleHarness()

	client.emit('state', {
		deviceId: 'device-test',
		items: [{ id: 'other-state', value: 'x' }],
	})
	await sleep(140)
	assert.deepEqual(counts(), { actionRefreshes: 0, presetRefreshes: 0 })

	client.emit('state', {
		deviceId: 'device-test',
		items: [{ id: 'available-2', value: 'false' }],
	})
	await sleep(140)
	assert.deepEqual(counts(), { actionRefreshes: 1, presetRefreshes: 1 })
	assert.equal(instance.definitionRefreshTimer, null)
})

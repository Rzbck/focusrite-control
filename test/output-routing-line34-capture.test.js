'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const {
	fieldChanged,
	routingChanged,
	baselineRestored,
	assignMixBaselineKnown,
	assertSafeBaseline,
} = require('../testbench/OutputRoutingLine34Capture')

function row(index, overrides = {}) {
	return {
		index,
		name: `Line Output ${index}`,
		availableKnown: true,
		available: 'true',
		sourceKnown: true,
		sourceName: `Playback ${index}`,
		stereoKnown: true,
		stereo: index === 3 ? 'true' : 'false',
		assignMixSchemaPresent: true,
		assignMixKnown: true,
		assignMixClass: 'V1',
		assignMixProvenance: 'arrival',
		...overrides,
	}
}

function snap(...rows) {
	return { outputs: rows }
}

test('detects targeted field and routing changes', () => {
	const before = snap(row(3), row(4))
	const after = snap(row(3, { stereo: 'false' }), row(4))
	assert.equal(fieldChanged(before, after, 'stereo'), true)
	assert.equal(routingChanged(before, after), true)
})

test('exact restoration checks source stereo and assign-mix', () => {
	const before = snap(row(3), row(4))
	assert.equal(baselineRestored(before, snap(row(3), row(4)), true).ok, true)
	const mismatch = baselineRestored(before, snap(row(3, { assignMixClass: 'V2' }), row(4)), true)
	assert.equal(mismatch.ok, false)
	assert.match(mismatch.mismatches.join(' '), /assign-mix/)
})

test('assign-mix baseline requires both target outputs to be known', () => {
	assert.equal(assignMixBaselineKnown(snap(row(3), row(4))), true)
	assert.equal(assignMixBaselineKnown(snap(row(3), row(4, { assignMixKnown: false, assignMixClass: '' }))), false)
})

test('safe baseline blocks unavailable or incomplete targets', () => {
	assert.doesNotThrow(() => assertSafeBaseline(snap(row(3), row(4))))
	assert.throws(() => assertSafeBaseline(snap(row(3), row(4, { available: 'false' }))), /availability/)
	assert.throws(() => assertSafeBaseline(snap(row(3), row(4, { sourceKnown: false }))), /baseline/)
	assert.throws(
		() => assertSafeBaseline(snap(row(3), row(4, { assignMixSchemaPresent: false }))),
		/assign-mix research variables/,
	)
})

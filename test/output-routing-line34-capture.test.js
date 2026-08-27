'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const {
	diffSnapshots,
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
		assignMixKnown: false,
		assignMixClass: '',
		assignMixProvenance: 'never-observed',
		...overrides,
	}
}

function snap(...rows) {
	return { outputs: rows }
}

test('free recorder captures source-only changes instead of failing early', () => {
	const before = snap(row(3), row(4))
	const after = snap(row(3, { sourceName: 'Analogue 3' }), row(4))
	const changes = diffSnapshots(before, after)
	assert.equal(changes.length, 1)
	assert.equal(changes[0].field, 'sourceName')
	assert.equal(routingChanged(before, after), true)
})

test('free recorder captures stereo and assign-mix changes independently', () => {
	const before = snap(row(3), row(4))
	const after = snap(
		row(3, { stereo: 'false', assignMixKnown: true, assignMixClass: 'V1', assignMixProvenance: 'set' }),
		row(4),
	)
	const fields = diffSnapshots(before, after).map((change) => change.field)
	assert.ok(fields.includes('stereo'))
	assert.ok(fields.includes('assignMixClass'))
	assert.ok(fields.includes('assignMixProvenance'))
})

test('restore requires source/stereo and only checks assign-mix when baseline knew it', () => {
	const unknown = snap(row(3), row(4))
	const restoredUnknown = snap(row(3, { assignMixKnown: true, assignMixClass: 'V2' }), row(4))
	assert.equal(baselineRestored(unknown, restoredUnknown).ok, true)

	const known = snap(
		row(3, { assignMixKnown: true, assignMixClass: 'V1' }),
		row(4, { assignMixKnown: true, assignMixClass: 'V1' }),
	)
	const changed = snap(
		row(3, { assignMixKnown: true, assignMixClass: 'V2' }),
		row(4, { assignMixKnown: true, assignMixClass: 'V1' }),
	)
	assert.equal(baselineRestored(known, changed).ok, false)
})

test('safe baseline allows never-observed assign-mix but still requires schema and available source/stereo', () => {
	const baseline = snap(row(3), row(4))
	assert.doesNotThrow(() => assertSafeBaseline(baseline))
	assert.equal(assignMixBaselineKnown(baseline), false)
	assert.throws(() => assertSafeBaseline(snap(row(3), row(4, { available: 'false' }))), /availability/)
	assert.throws(
		() => assertSafeBaseline(snap(row(3), row(4, { assignMixSchemaPresent: false }))),
		/assign-mix research variables/,
	)
})

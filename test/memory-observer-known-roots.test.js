const test = require('node:test')
const assert = require('node:assert/strict')
const { KNOWN_ROOTS } = require('../tools/memory-observer-lib')

test('discovery roots observed in official memory are known protocol roots', () => {
	assert.equal(KNOWN_ROOTS.has('client-discovery'), true)
	assert.equal(KNOWN_ROOTS.has('server-announcement'), true)
})

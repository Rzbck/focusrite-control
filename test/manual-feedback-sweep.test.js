'use strict'

const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const { keyOf, labelOf, changedProbes } = require('../testbench/ManualFeedbackSweep')

const repoRoot = path.join(__dirname, '..')

test('manual feedback sweep detects only changed rendered markers', () => {
	const probes = [
		{ row: 1, column: 1, definitionId: 'input_air', options: { input: 0 } },
		{ row: 1, column: 2, definitionId: 'input_pad', options: { input: 0 } },
	]
	const before = new Map([
		['1/1', 'F'],
		['1/2', 'F'],
	])
	const after = new Map([
		['1/1', 'T'],
		['1/2', 'F'],
	])
	assert.deepEqual(changedProbes(probes, before, after), [probes[0]])
	assert.equal(keyOf(probes[0]), '1/1')
	assert.match(labelOf(probes[0]), /input_air/)
})

test('manual feedback sweep source contains no Companion press or Focusrite write path', () => {
	const source = fs.readFileSync(path.join(repoRoot, 'testbench', 'ManualFeedbackSweep.js'), 'utf8')
	assert.doesNotMatch(source, /\bpost\s*\(/)
	assert.doesNotMatch(source, /\/press\b/)
	assert.doesNotMatch(source, /<set\b/i)
	assert.doesNotMatch(source, /advanced_raw_set/)
	assert.match(source, /hardwareWritesByHarness:\s*false/)
	assert.match(source, /companionButtonPressesByHarness:\s*false/)
	assert.match(source, /r9\.probes\.length !== 829/)
})

test('manual feedback sweep launcher states the read-only contract', () => {
	const source = fs.readFileSync(path.join(repoRoot, 'testbench', 'RUN_MANUAL_FEEDBACK_SWEEP.cmd'), 'utf8')
	assert.match(source, /Aucun write Focusrite/i)
	assert.match(source, /Aucun bouton Companion/i)
	assert.match(source, /ManualFeedbackSweep\.js/)
})

'use strict'

const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const repoRoot = path.join(__dirname, '..')

test('meter routing Page 2 preparation is read-only and fail-closed', () => {
	const source = fs.readFileSync(path.join(repoRoot, 'testbench', 'MeterRoutingPrepare.js'), 'utf8')
	assert.match(source, /prepareLab/)
	assert.match(source, /ctx\.prep === 'harness'/)
	assert.match(source, /process\.exitCode = 6/)
	assert.doesNotMatch(source, /pressBatch\s*\(/)
	assert.doesNotMatch(source, /pressLocation\s*\(/)
	assert.doesNotMatch(source, /\bpost\s*\(/)
	assert.doesNotMatch(source, /<set\b/i)
	assert.doesNotMatch(source, /\bsetValue\s*\(/)
	assert.doesNotMatch(source, /allow-routing-writes|allow-hardware-writes/)
})

test('meter routing launcher prepares and audits Page 2 before hardware permission', () => {
	const source = fs.readFileSync(path.join(repoRoot, 'testbench', 'RUN_METER_ROUTING_EXACT_RESTORE.cmd'), 'utf8')
	const prepIndex = source.indexOf('MeterRoutingPrepare.js')
	const permissionIndex = source.indexOf('ROUTE_METERS')
	assert.ok(prepIndex >= 0)
	assert.ok(permissionIndex > prepIndex)
	assert.match(source, /PAGE2_AUTO/)
	assert.match(source, /FullTestBenchCompanionImportV7\.js" --replace-page-2/)
	assert.match(source, /Reaudit read-only obligatoire de Page 2/)
	assert.match(source, /Aucun write hardware n a encore ete effectue/)
	assert.match(source, /pause\s+exit \/b 7/)
	assert.match(source, /--allow-routing-writes --confirm-all-output-routing-isolated/)
})

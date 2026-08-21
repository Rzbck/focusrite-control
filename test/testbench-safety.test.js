const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')
const preflightPath = path.join(root, 'testbench', 'Focusrite_18i20_Preflight.ps1')
const runnerPath = path.join(root, 'testbench', 'Focusrite_18i20_SafeHardwareTest.js')
const planPath = path.join(root, 'testbench', 'Focusrite_18i20_SafeHardwarePlan.json')

const preflight = fs.readFileSync(preflightPath, 'utf8')
const runner = fs.readFileSync(runnerPath, 'utf8')
const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'))

test('TestBench preflight stays read-only and privacy-safe', () => {
	assert.doesNotMatch(preflight, /-Method\s+['"]POST['"]/i)
	assert.doesNotMatch(preflight, /\/press\//i)
	assert.doesNotMatch(preflight, /device_serial|client_control_id|server_port|client[_-]?key/i)
	assert.doesNotMatch(preflight, /1677/)
	assert.match(preflight, /Scarlett 18i20 \(3rd Gen\)/)
	assert.match(preflight, /focusrite-scarlett-18i20/)
})

test('TestBench preflight discovers Companion locally instead of hardcoding one web port', () => {
	assert.doesNotMatch(preflight, /CompanionBaseUrl\s*=\s*['"]http:\/\/127\.0\.0\.1:8000['"]/i)
	assert.match(preflight, /GetActiveTcpListeners/)
	assert.match(preflight, /X-App/)
	assert.match(preflight, /Bitfocus Companion/)
	assert.match(preflight, /UseProxy\s*=\s*\$false/)
})

test('SAFE hardware plan reuses the existing r9 FULL MATRIX page', () => {
	assert.equal(plan.schemaVersion, 2)
	assert.equal(plan.target.moduleId, 'focusrite-scarlett-18i20')
	assert.equal(plan.target.model, 'Scarlett 18i20 (3rd Gen)')
	assert.equal(plan.page.name, 'Focusrite 18i20 TB r9 - FULL MATRIX 46x26 [TB-R9-ALL]')
	assert.equal(plan.page.marker, 'TB-R9-ALL')
	assert.deepEqual(plan.page.grid, { minColumn: 0, maxColumn: 45, minRow: 0, maxRow: 25 })
	assert.equal(plan.tests.length, 21)
})

test('SAFE plan contains exactly the approved 42 explicit setter locations from r9 Core', () => {
	const expectedIds = [
		...Array.from({ length: 8 }, (_, i) => `air-${i + 1}`),
		...Array.from({ length: 8 }, (_, i) => `pad-${i + 1}`),
		'monitor-mute',
		'monitor-dim',
		'talkback',
		'input-1-mode',
		'input-2-mode',
	]
	assert.deepEqual(
		[...plan.tests.map((item) => item.id)].sort(),
		[...expectedIds].sort()
	)

	const seen = new Set()
	for (const item of plan.tests) {
		assert.ok(['boolean', 'enum'].includes(item.kind))
		assert.equal(item.setters.length, 2)
		assert.equal(item.confidence, 'hardware-tested')
		for (const setter of item.setters) {
			const location = `${setter.row}/${setter.column}`
			assert.equal(seen.has(location), false, `duplicate setter location ${location}`)
			seen.add(location)
			assert.ok(
				['input_air', 'input_pad', 'input_mode', 'monitor_mute', 'monitor_dim', 'monitor_talkback'].includes(
					setter.definitionId
				)
			)
			assert.doesNotMatch(JSON.stringify(setter), /toggle|cycle|1677|advanced_raw|monitor_gain/i)
		}
	}
	assert.equal(seen.size, 42)
})

test('SAFE runner audits the existing r9 page and never relies on raw Companion connection-id equality', () => {
	assert.match(runner, /auditR9Page/)
	assert.match(runner, /TB-R9-ALL/)
	assert.match(runner, /42 explicit SAFE setters verified/)
	assert.match(runner, /resolveLiveConnection/)
	assert.match(runner, /candidates\.length === 1/)
	assert.match(runner, /labelMatches\.length === 1/)
	assert.doesNotMatch(runner, /action\.connectionId\s*!==\s*connection\.id/)
	assert.doesNotMatch(runner, /SAFE_PAGE_A|SAFE_PAGE_B|generated\//)
})

test('SAFE runner accepts Companion empty up action sets but rejects any non-empty extra set', () => {
	assert.match(runner, /function singleSafeDownAction/)
	assert.match(runner, /setId === 'down'/)
	assert.match(runner, /actions\.length !== 0/)
	assert.doesNotMatch(runner, /Object\.keys\(sets\)\.length !== 1/)
})

test('SAFE runner requires the actually loaded Companion module version to match package.json', () => {
	assert.match(runner, /const EXPECTED_MODULE_VERSION = packageJson\.version/)
	assert.match(runner, /connection\.moduleVersionId/)
	assert.match(runner, /Loaded Focusrite Companion module version mismatch/)
	assert.match(runner, /moduleVersion: EXPECTED_MODULE_VERSION/)
})

test('SAFE runner requires explicit permission, server-confirmed state, and explicit restoration', () => {
	assert.match(runner, /--allow-hardware-writes/)
	assert.match(runner, /process\.argv\.includes\('--allow-hardware-writes'\)/)
	assert.match(runner, /Initial server state is unknown; no write attempted/i)
	assert.match(runner, /pressSetter\(baseUrl, audited\.pageNumber, item\.restoreSetter\)/)
	assert.match(runner, /Restoration was not server-confirmed/)
	assert.match(runner, /HARD ABORT/)
	assert.doesNotMatch(runner, /device_serial|client_control_id|server_port|client[_-]?key/i)
})

test('SAFE executable plan contains no forbidden hardware-write surfaces', () => {
	const executableText = [runner, JSON.stringify(plan)].join('\n')
	for (const forbidden of [
		'input_mode_cycle',
		'advanced_raw',
		'monitor_gain',
		'output_gain',
		'phantom',
		'mic kill',
		'firmware',
		'snapshot',
	]) {
		assert.doesNotMatch(executableText, new RegExp(forbidden, 'i'))
	}
	assert.doesNotMatch(executableText, /\b1677\b/)
})

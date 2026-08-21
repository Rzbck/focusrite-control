const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')
const preflightPath = path.join(root, 'testbench', 'Focusrite_18i20_Preflight.ps1')
const runnerPath = path.join(root, 'testbench', 'Focusrite_18i20_SafeHardwareTest.js')
const planPath = path.join(root, 'testbench', 'Focusrite_18i20_SafeHardwarePlan.json')
const generatorPath = path.join(root, 'testbench', 'generate-safe-pages.js')

const preflight = fs.readFileSync(preflightPath, 'utf8')
const runner = fs.readFileSync(runnerPath, 'utf8')
const generatorSource = fs.readFileSync(generatorPath, 'utf8')
const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'))
const { buildPages } = require(generatorPath)
const pages = buildPages(plan)

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

test('SAFE hardware plan contains only the 21 approved reversible controls', () => {
	assert.equal(plan.schemaVersion, 1)
	assert.equal(plan.target.moduleId, 'focusrite-scarlett-18i20')
	assert.equal(plan.target.model, 'Scarlett 18i20 (3rd Gen)')
	assert.equal(plan.tests.length, 21)

	const expectedIds = [
		'monitor-mute',
		'monitor-dim',
		'talkback',
		'input-1-mode',
		'input-2-mode',
		...Array.from({ length: 8 }, (_, i) => [`input-${i + 1}-air`, `input-${i + 1}-pad`]).flat(),
	]
	assert.deepEqual(
		[...plan.tests.map((item) => item.id)].sort(),
		[...expectedIds].sort()
	)

	for (const item of plan.tests) {
		assert.ok(['boolean', 'enum'].includes(item.kind))
		assert.equal(item.setters.length, 2)
		assert.ok(['hardware-tested', 'implemented-schema'].includes(item.confidence))
	}
})

function allPageActions(page) {
	const actions = []
	for (const row of Object.values(page.page.controls)) {
		for (const control of Object.values(row)) {
			const sets = control.steps['0'].action_sets
			assert.deepEqual(Object.keys(sets), ['down'])
			assert.equal(sets.down.length, 1)
			actions.push(sets.down[0])
		}
	}
	return actions
}

test('SAFE page generator builds only explicit whitelisted module actions', () => {
	const allowedDefinitions = new Set([
		'monitor_mute',
		'monitor_dim',
		'monitor_talkback',
		'input_air',
		'input_pad',
		'input_mode',
	])
	assert.deepEqual(Object.keys(pages), ['A', 'B'])

	for (const [key, page] of Object.entries(pages)) {
		assert.equal(page.version, 12)
		assert.equal(page.type, 'page')
		assert.equal(page.page.name, `FOCUSRITE SAFE TESTBENCH v0.2 - PAGE ${key}`)
		assert.equal(page.instances['focusrite-testbench-target'].moduleId, 'focusrite-scarlett-18i20')

		for (const action of allPageActions(page)) {
			assert.equal(action.type, 'action')
			assert.equal(action.connectionId, 'focusrite-testbench-target')
			assert.ok(allowedDefinitions.has(action.definitionId))
			const rawOptions = Object.fromEntries(
				Object.entries(action.options).map(([optionKey, wrapped]) => {
					assert.equal(wrapped.isExpression, false)
					return [optionKey, wrapped.value]
				})
			)
			assert.doesNotMatch(JSON.stringify(rawOptions), /toggle|cycle|1677|advanced_raw|monitor_gain/i)
			if (action.definitionId === 'input_mode') {
				assert.ok(['0', '1'].includes(String(rawOptions.input)))
				assert.ok(['Line', 'Inst'].includes(rawOptions.mode))
			} else if (action.definitionId === 'input_air' || action.definitionId === 'input_pad') {
				assert.ok(/^[0-7]$/.test(String(rawOptions.input)))
				assert.ok(['on', 'off'].includes(rawOptions.state))
			} else {
				assert.ok(['on', 'off'].includes(rawOptions.state))
			}
		}
	}
})

test('SAFE plan setters exactly match generated Companion page actions', () => {
	const seenLocations = new Set()

	for (const item of plan.tests) {
		for (const setter of item.setters) {
			const page = pages[setter.pageKey]
			assert.ok(page)
			const location = `${setter.pageKey}/${setter.row}/${setter.column}`
			assert.equal(seenLocations.has(location), false, `duplicate setter location ${location}`)
			seenLocations.add(location)

			const control = page.page.controls[String(setter.row)][String(setter.column)]
			const action = control.steps['0'].action_sets.down[0]
			assert.equal(action.definitionId, setter.definitionId)
			const actualOptions = Object.fromEntries(
				Object.entries(action.options).map(([optionKey, wrapped]) => [optionKey, wrapped.value])
			)
			assert.deepEqual(actualOptions, setter.options)
		}
	}

	assert.equal(seenLocations.size, 42)
})

test('SAFE runner requires permission, validates imported pages before writes, and restores explicitly', () => {
	assert.match(runner, /--allow-hardware-writes/)
	assert.match(runner, /process\.argv\.includes\('--allow-hardware-writes'\)/)
	assert.match(runner, /auditPages/)
	assert.match(runner, /\/int\/export\/custom/)
	assert.match(runner, /connections=false/)
	assert.match(runner, /includeSecrets=false/)
	assert.match(runner, /pressSetter\(baseUrl, resolvedPages, item\.restoreSetter\)/)
	assert.match(runner, /restoration failure aborts/i)
	assert.match(runner, /Initial server state is unknown; no write attempted/i)
	assert.doesNotMatch(runner, /device_serial|client_control_id|server_port|client[_-]?key/i)
	assert.doesNotMatch(runner, /1677|advanced_raw|monitor_gain/i)
})

test('SAFE generator and runner contain no forbidden hardware-write surfaces', () => {
	const executableText = [generatorSource, runner, JSON.stringify(pages)].join('\n')
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

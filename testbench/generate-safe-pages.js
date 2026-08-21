const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')

const MODULE_ID = 'focusrite-scarlett-18i20'
const INSTANCE_ID = 'focusrite-testbench-target'
const COMPANION_BUILD = '5.0.3'
const FILE_VERSION = 12

function expressionValue(value) {
	return { value, isExpression: false }
}

function deterministicId(text) {
	const hash = crypto.createHash('sha256').update(text).digest('hex')
	return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`
}

function buttonLayers(label) {
	return [
		{
			id: 'canvas',
			name: 'Canvas',
			usage: 'auto',
			type: 'canvas',
			decoration: expressionValue('default'),
			showStatusIcons: expressionValue('default'),
		},
		{
			id: 'box0',
			name: 'Background',
			usage: 'auto',
			type: 'box',
			enabled: expressionValue(true),
			opacity: expressionValue(100),
			x: expressionValue(0),
			y: expressionValue(0),
			width: expressionValue(100),
			height: expressionValue(100),
			rotation: expressionValue(0),
			color: expressionValue(0),
			borderWidth: expressionValue(0),
			borderColor: expressionValue(0),
			borderPosition: expressionValue('inside'),
		},
		{
			id: 'text0',
			name: 'Text',
			usage: 'auto',
			type: 'text',
			enabled: expressionValue(true),
			opacity: expressionValue(100),
			x: expressionValue(0),
			y: expressionValue(0),
			width: expressionValue(100),
			height: expressionValue(100),
			rotation: expressionValue(0),
			text: expressionValue(label),
			color: expressionValue(0xffffff),
			halign: expressionValue('center'),
			valign: expressionValue('center'),
			fontsize: expressionValue(14),
			fontsizeAllowShrink: expressionValue(true),
			font: expressionValue('companion-sans'),
			outlineColor: expressionValue(0xff000000),
		},
	]
}

function buildButton(test, setter) {
	const targetLabel =
		test.kind === 'boolean' ? (setter.targetValue === 'true' ? 'ON' : 'OFF') : String(setter.targetValue).toUpperCase()
	const label = `${test.name}\n${targetLabel}`
	const rawOptions = Object.fromEntries(
		Object.entries(setter.options).map(([key, value]) => [key, expressionValue(value)])
	)
	const entityId = deterministicId(
		`${setter.pageKey}/${setter.row}/${setter.column}/${setter.definitionId}/${JSON.stringify(setter.options)}`
	)

	return {
		type: 'button-layered',
		feedbacks: [],
		steps: {
			0: {
				action_sets: {
					down: [
						{
							type: 'action',
							id: entityId,
							definitionId: setter.definitionId,
							connectionId: INSTANCE_ID,
							options: rawOptions,
							upgradeIndex: 0,
						},
					],
				},
				options: { runWhileHeld: [] },
			},
		},
		localVariables: [],
		options: {
			stepProgression: 'auto',
			stepExpression: '',
			rotaryActions: false,
			canModifyStyleInApis: false,
			notes: `Focusrite SAFE TestBench v0.2 - ${label}`,
		},
		style: { layers: buttonLayers(label) },
	}
}

function buildPages(plan) {
	if (plan.schemaVersion !== 1) throw new Error('Unsupported SAFE plan schema')
	if (plan.target?.moduleId !== MODULE_ID) throw new Error('Unexpected module target')
	if (plan.target?.model !== 'Scarlett 18i20 (3rd Gen)') throw new Error('Unexpected hardware target')

	const pageSpecs = Object.fromEntries(plan.pages.map((page) => [page.key, page]))
	const controls = Object.fromEntries(plan.pages.map((page) => [page.key, {}]))
	const used = new Set()

	for (const test of plan.tests) {
		for (const setter of test.setters) {
			if (!pageSpecs[setter.pageKey]) throw new Error(`Unknown page key ${setter.pageKey}`)
			const location = `${setter.pageKey}/${setter.row}/${setter.column}`
			if (used.has(location)) throw new Error(`Duplicate SAFE setter location ${location}`)
			used.add(location)

			const row = String(setter.row)
			const column = String(setter.column)
			controls[setter.pageKey][row] ??= {}
			controls[setter.pageKey][row][column] = buildButton(test, setter)
		}
	}

	const output = {}
	let oldPageNumber = 1
	for (const pageSpec of plan.pages) {
		const pageControls = controls[pageSpec.key]
		const count = Object.values(pageControls).reduce((total, row) => total + Object.keys(row).length, 0)
		if (count !== pageSpec.expectedControls) throw new Error(`Control-count mismatch on SAFE page ${pageSpec.key}`)

		output[pageSpec.key] = {
			version: FILE_VERSION,
			type: 'page',
			companionBuild: COMPANION_BUILD,
			page: {
				name: pageSpec.name,
				controls: pageControls,
				gridSize: { minColumn: 0, maxColumn: 7, minRow: 0, maxRow: 3 },
			},
			instances: {
				[INSTANCE_ID]: {
					label: 'FOCUSRITE TESTBENCH TARGET',
					moduleId: MODULE_ID,
					lastUpgradeIndex: 0,
				},
			},
			connectionCollections: [],
			oldPageNumber: oldPageNumber++,
			imageLibrary: [],
			imageLibraryCollections: [],
		}
	}

	return output
}

function generateFiles(planPath, outputDirectory) {
	const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'))
	const pages = buildPages(plan)
	fs.mkdirSync(outputDirectory, { recursive: true })

	for (const [key, data] of Object.entries(pages)) {
		const outputPath = path.join(outputDirectory, `SAFE_PAGE_${key}.companionconfig`)
		fs.writeFileSync(outputPath, `${JSON.stringify(data, null, '\t')}\n`, 'utf8')
	}

	return pages
}

if (require.main === module) {
	const testbenchDir = __dirname
	const planPath = path.join(testbenchDir, 'Focusrite_18i20_SafeHardwarePlan.json')
	const outputDirectory = path.join(testbenchDir, 'generated')
	generateFiles(planPath, outputDirectory)
	console.log('SAFE TestBench pages generated locally:')
	console.log('  testbench\\generated\\SAFE_PAGE_A.companionconfig')
	console.log('  testbench\\generated\\SAFE_PAGE_B.companionconfig')
	console.log('No hardware write was performed.')
}

module.exports = { buildPages, generateFiles }

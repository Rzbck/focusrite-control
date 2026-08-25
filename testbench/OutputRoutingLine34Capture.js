'use strict'

const fs = require('node:fs')
const path = require('node:path')
const readline = require('node:readline/promises')
const { stdin, stdout } = require('node:process')
const {
	EXPECTED_MODEL,
	EXPECTED_MODULE,
	safePlanPath,
	resultsDir,
	nowIso,
	line,
	canonicalBool,
	findCompanion,
	get,
	readVariable,
	readVariableOptional,
	exportButtons,
} = require('./FullTestBenchBase')
const { auditR9 } = require('./FullTestBenchAudit')

const TARGET_OUTPUTS = [3, 4]
const REPORT_PATH = path.join(resultsDir, 'LATEST_OUTPUT_ROUTING_LINE34_CAPTURE.json')
const RELATIVE_REPORT = 'testbench\\results\\LATEST_OUTPUT_ROUTING_LINE34_CAPTURE.json'

async function askEnter(message) {
	if (!stdin.isTTY || !stdout.isTTY) throw new Error('This targeted capture requires an interactive terminal.')
	const rl = readline.createInterface({ input: stdin, output: stdout })
	try {
		await rl.question(`${message}\nAppuie sur ENTREE quand c est fait : `)
	} finally {
		rl.close()
	}
}

function known(item) {
	return Boolean(item?.exists && String(item.value ?? '').trim() !== '')
}

function sanitizeRow(index, values) {
	return {
		index,
		name: known(values.name) ? String(values.name.value) : `Output ${index}`,
		availableKnown: known(values.available),
		available: known(values.available) ? canonicalBool(values.available.value) : null,
		sourceKnown: known(values.sourceName),
		sourceName: known(values.sourceName) ? String(values.sourceName.value) : '',
		stereoKnown: known(values.stereo),
		stereo: known(values.stereo) ? canonicalBool(values.stereo.value) : null,
		assignMixSchemaPresent: Boolean(values.assignMixClass?.exists && values.assignMixProvenance?.exists),
		assignMixKnown: known(values.assignMixClass),
		assignMixClass: known(values.assignMixClass) ? String(values.assignMixClass.value) : '',
		assignMixProvenance: known(values.assignMixProvenance)
			? String(values.assignMixProvenance.value)
			: 'never-observed',
	}
}

async function readOutput(baseUrl, label, index) {
	const [name, available, sourceName, stereo, assignMixClass, assignMixProvenance] = await Promise.all([
		readVariableOptional(baseUrl, label, `output_${index}_name`, 1800),
		readVariableOptional(baseUrl, label, `output_${index}_available`, 1800),
		readVariableOptional(baseUrl, label, `output_${index}_source_name`, 1800),
		readVariableOptional(baseUrl, label, `output_${index}_stereo`, 1800),
		readVariableOptional(baseUrl, label, `output_${index}_assign_mix_class`, 1800),
		readVariableOptional(baseUrl, label, `output_${index}_assign_mix_provenance`, 1800),
	])
	return sanitizeRow(index, { name, available, sourceName, stereo, assignMixClass, assignMixProvenance })
}

async function snapshot(baseUrl, label, stage) {
	const outputs = []
	for (const index of TARGET_OUTPUTS) outputs.push(await readOutput(baseUrl, label, index))
	return { stage, at: nowIso(), outputs }
}

function fieldChanged(before, after, field) {
	return before.outputs.some((row, i) => row[field] !== after.outputs[i]?.[field])
}

function routingChanged(before, after) {
	return (
		fieldChanged(before, after, 'sourceName') ||
		fieldChanged(before, after, 'stereo') ||
		fieldChanged(before, after, 'assignMixClass')
	)
}

function baselineRestored(baseline, current, requireAssignMix = false) {
	const mismatches = []
	for (const [i, before] of baseline.outputs.entries()) {
		const after = current.outputs[i]
		if (!after || before.index !== after.index) {
			mismatches.push(`Output ${before.index}: missing snapshot row`)
			continue
		}
		if (!before.sourceKnown || !after.sourceKnown || before.sourceName !== after.sourceName) {
			mismatches.push(`Output ${before.index}: source not restored`)
		}
		if (!before.stereoKnown || !after.stereoKnown || before.stereo !== after.stereo) {
			mismatches.push(`Output ${before.index}: stereo not restored`)
		}
		if (requireAssignMix) {
			if (!before.assignMixKnown || !after.assignMixKnown || before.assignMixClass !== after.assignMixClass) {
				mismatches.push(`Output ${before.index}: assign-mix not restored`)
			}
		}
	}
	return { ok: mismatches.length === 0, mismatches }
}

function assignMixBaselineKnown(snap) {
	return snap.outputs.every((row) => row.assignMixSchemaPresent && row.assignMixKnown)
}

function assertSafeBaseline(snap) {
	for (const row of snap.outputs) {
		if (!row.availableKnown || row.available !== 'true') {
			throw new Error(`${row.name}: availability must be server-confirmed true before this manual routing test.`)
		}
		if (!row.sourceKnown || !row.stereoKnown) {
			throw new Error(`${row.name}: source/stereo baseline is incomplete; manual routing test blocked.`)
		}
		if (!row.assignMixSchemaPresent) {
			throw new Error(
				`${row.name}: assign-mix research variables are not exposed. Enable Expose all mixer slot variables.`,
			)
		}
	}
}

function printSnapshot(snap) {
	console.log('')
	console.log(`SNAPSHOT ${snap.stage}`)
	for (const row of snap.outputs) {
		line(
			'INFO',
			row.name,
			`source=${row.sourceName || 'UNKNOWN'} stereo=${row.stereo ?? 'UNKNOWN'} assignMix=${row.assignMixKnown ? row.assignMixClass : 'UNKNOWN'}[${row.assignMixProvenance}]`,
		)
	}
}

function writeReport(payload) {
	fs.mkdirSync(resultsDir, { recursive: true })
	fs.writeFileSync(REPORT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
}

async function resolveContext() {
	const safePlan = JSON.parse(fs.readFileSync(safePlanPath, 'utf8'))
	const baseUrl = await findCompanion()
	const connectionsPayload = JSON.parse(await get(baseUrl, '/api/connections'))
	const connections = Array.isArray(connectionsPayload) ? connectionsPayload : connectionsPayload.connections || []
	const exported = await exportButtons(baseUrl)
	const r9 = auditR9(exported, safePlan, connections)
	if (r9.connection.moduleId !== EXPECTED_MODULE)
		throw new Error('Resolved Companion connection is not the Focusrite module.')
	const label = String(r9.connection.label)
	const model = await readVariable(baseUrl, label, 'device_model')
	if (model !== EXPECTED_MODEL) throw new Error(`Unsupported hardware for this test: ${model}`)
	const authorised = canonicalBool(await readVariable(baseUrl, label, 'client_authorised'))
	if (authorised !== 'true') throw new Error('Companion Focusrite client is not authorised in Remote Devices.')
	return { baseUrl, label, model }
}

async function main() {
	console.log('==================================================================')
	console.log(' FOCUSRITE 18i20 LINE 3-4 ROUTING CAPTURE - MANUAL / READ ONLY')
	console.log('==================================================================')
	console.log('Le harness ne fait AUCUN write Focusrite et ne presse AUCUN bouton Companion.')
	console.log('Tu fais uniquement les changements demandes dans Focusrite Control.')
	console.log('Chaque restauration est verifiee par les variables serveur confirmees.')
	console.log('')

	const ctx = await resolveContext()
	line('PASS', 'Preflight', `${ctx.model} / Companion client authorised`)

	const snapshots = []
	const baseline = await snapshot(ctx.baseUrl, ctx.label, 'BASELINE')
	assertSafeBaseline(baseline)
	snapshots.push(baseline)
	printSnapshot(baseline)

	await askEnter('1/6 - Change UNE FOIS le lien Stereo de Line Outputs 3-4. Attends environ 2 secondes.')
	const stereoChanged = await snapshot(ctx.baseUrl, ctx.label, 'STEREO_CHANGED')
	snapshots.push(stereoChanged)
	printSnapshot(stereoChanged)
	if (!fieldChanged(baseline, stereoChanged, 'stereo'))
		throw new Error('Aucun changement stereo Line 3-4 n a ete observe.')

	await askEnter('2/6 - Remets le lien Stereo EXACTEMENT comme au depart. Attends environ 2 secondes.')
	const stereoRestored = await snapshot(ctx.baseUrl, ctx.label, 'STEREO_RESTORED')
	snapshots.push(stereoRestored)
	printSnapshot(stereoRestored)
	const stereoRestore = baselineRestored(baseline, stereoRestored, assignMixBaselineKnown(baseline))
	if (!stereoRestore.ok) throw new Error(`Restauration Stereo incomplete: ${stereoRestore.mismatches.join('; ')}`)

	await askEnter(
		'3/6 - Change la source de Line Outputs 3-4 vers UNE AUTRE source directe connue. Attends environ 2 secondes.',
	)
	const sourceChanged = await snapshot(ctx.baseUrl, ctx.label, 'SOURCE_CHANGED')
	snapshots.push(sourceChanged)
	printSnapshot(sourceChanged)
	if (!fieldChanged(stereoRestored, sourceChanged, 'sourceName'))
		throw new Error('Aucun changement de source Line 3-4 n a ete observe.')

	await askEnter('4/6 - Remets la source/routing EXACTEMENT comme au depart. Attends environ 2 secondes.')
	const sourceRestored = await snapshot(ctx.baseUrl, ctx.label, 'SOURCE_RESTORED')
	snapshots.push(sourceRestored)
	printSnapshot(sourceRestored)
	const promotedBaseline = sourceRestored
	const sourceRestore = baselineRestored(baseline, sourceRestored, assignMixBaselineKnown(baseline))
	if (!sourceRestore.ok) throw new Error(`Restauration Source incomplete: ${sourceRestore.mismatches.join('; ')}`)

	if (!assignMixBaselineKnown(promotedBaseline)) {
		writeReport({
			reportVersion: 1,
			reportClass: 'output-routing-line34-targeted-sanitized',
			updatedAt: nowIso(),
			model: ctx.model,
			readOnlyHarness: true,
			hardwareWritesByHarness: false,
			companionButtonPressesByHarness: false,
			status: 'CUSTOM_MIX_BLOCKED_ASSIGN_MIX_BASELINE_UNKNOWN',
			snapshots,
			privacy: 'No raw item values/IDs, serial, hostname, endpoint, client identity, raw XML or user path is stored.',
		})
		console.log('')
		console.log('STOP SAFE: assign-mix reste UNKNOWN apres restauration Source; Custom Mix n est PAS teste.')
		console.log(`Rapport local: ${RELATIVE_REPORT}`)
		process.exitCode = 3
		return
	}

	await askEnter('5/6 - Passe Line Outputs 3-4 sur Custom Mix. Attends environ 2 secondes.')
	const customMixChanged = await snapshot(ctx.baseUrl, ctx.label, 'CUSTOM_MIX_CHANGED')
	snapshots.push(customMixChanged)
	printSnapshot(customMixChanged)
	if (!routingChanged(promotedBaseline, customMixChanged))
		throw new Error('Aucun changement de routing Custom Mix n a ete observe.')

	await askEnter(
		'6/6 - Remets Line Outputs 3-4 EXACTEMENT sur le routing du snapshot SOURCE_RESTORED. Attends environ 2 secondes.',
	)
	const finalRestored = await snapshot(ctx.baseUrl, ctx.label, 'FINAL_RESTORED')
	snapshots.push(finalRestored)
	printSnapshot(finalRestored)
	const finalRestore = baselineRestored(promotedBaseline, finalRestored, true)
	if (!finalRestore.ok) throw new Error(`Restauration finale incomplete: ${finalRestore.mismatches.join('; ')}`)

	writeReport({
		reportVersion: 1,
		reportClass: 'output-routing-line34-targeted-sanitized',
		updatedAt: nowIso(),
		model: ctx.model,
		readOnlyHarness: true,
		hardwareWritesByHarness: false,
		companionButtonPressesByHarness: false,
		status: 'COMPLETE_EXACT_RESTORE_CONFIRMED',
		snapshots,
		privacy: 'No raw item values/IDs, serial, hostname, endpoint, client identity, raw XML or user path is stored.',
	})
	console.log('')
	console.log('PASS - capture Line 3-4 terminee avec restauration exacte confirmee.')
	console.log(`Rapport local: ${RELATIVE_REPORT}`)
}

if (require.main === module) {
	main().catch((error) => {
		console.error(`FAIL: ${error.message}`)
		process.exitCode = 2
	})
}

module.exports = {
	sanitizeRow,
	fieldChanged,
	routingChanged,
	baselineRestored,
	assignMixBaselineKnown,
	assertSafeBaseline,
}

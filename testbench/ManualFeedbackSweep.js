'use strict'

const fs = require('node:fs')
const path = require('node:path')
const readline = require('node:readline/promises')
const { stdin, stdout } = require('node:process')
const {
	EXPECTED_MODEL,
	EXPECTED_MODULE_VERSION,
	safePlanPath,
	resultsDir,
	nowIso,
	line,
	canonicalBool,
	findCompanion,
	get,
	readVariable,
	readVariableOptional,
	mapLimit,
	exportButtons,
} = require('./FullTestBenchBase')
const { auditR9 } = require('./FullTestBenchAudit')
const { feedbackOracle, evaluateOracle } = require('./FullTestBenchFeedbackV6')

const LATEST_REPORT = path.join(resultsDir, 'LATEST_MANUAL_FEEDBACK_SWEEP.json')
const RELATIVE_REPORT = 'testbench\\results\\LATEST_MANUAL_FEEDBACK_SWEEP.json'

async function ask(prompt) {
	if (!stdin.isTTY || !stdout.isTTY) return 'DONE'
	const rl = readline.createInterface({ input: stdin, output: stdout })
	try {
		return String(await rl.question(prompt)).trim()
	} finally {
		rl.close()
	}
}

function keyOf(probe) {
	return `${probe.row}/${probe.column}`
}

function labelOf(probe) {
	const options = Object.entries(probe.options || {})
		.map(([key, value]) => `${key}=${value}`)
		.join(',')
	return options ? `${probe.definitionId} [${options}]` : probe.definitionId
}

async function readMarker(baseUrl, pageNumber, probe) {
	const variable = `b_text_${pageNumber}_${probe.row}_${probe.column}`
	const item = await readVariableOptional(baseUrl, 'internal', variable, 1800)
	if (!item.exists) return null
	const marker = String(item.value).split(/\r?\n/).at(-1)?.trim()
	return ['T', 'F'].includes(marker) ? marker : null
}

async function captureMarkers(baseUrl, r9) {
	const rows = await mapLimit(r9.probes, 24, async (probe) => [keyOf(probe), await readMarker(baseUrl, r9.pageNumber, probe)])
	return new Map(rows)
}

function changedProbes(probes, before, after) {
	return probes.filter((probe) => before.get(keyOf(probe)) !== after.get(keyOf(probe)))
}

async function validateProbe(baseUrl, label, pageNumber, probe) {
	const marker = await readMarker(baseUrl, pageNumber, probe)
	const oracle = feedbackOracle(probe)
	if (!marker || oracle.kind === 'unmapped' || !oracle.source) {
		return { status: 'EVAL_ONLY', marker, source: oracle.source || '', state: '' }
	}
	const item = await readVariableOptional(baseUrl, label, oracle.source, 2000)
	if (!item.exists || item.value === '') return { status: 'EVAL_ONLY', marker, source: oracle.source, state: '' }
	const evaluated = evaluateOracle(oracle, item.value)
	if (!evaluated.evaluable) return { status: 'EVAL_ONLY', marker, source: oracle.source, state: String(item.value) }
	return {
		status: (marker === 'T') === evaluated.wanted ? 'PASS' : 'FAIL_MISMATCH',
		marker,
		source: oracle.source,
		state: String(item.value),
	}
}

async function prepare() {
	const safePlan = JSON.parse(fs.readFileSync(safePlanPath, 'utf8'))
	const baseUrl = await findCompanion()
	const payload = JSON.parse(await get(baseUrl, '/api/connections'))
	const connections = Array.isArray(payload) ? payload : payload.connections || []
	const exported = await exportButtons(baseUrl)
	const r9 = auditR9(exported, safePlan, connections)
	const label = String(r9.connection.label)
	const model = await readVariable(baseUrl, label, 'device_model')
	if (model !== EXPECTED_MODEL) throw new Error(`Expected ${EXPECTED_MODEL}, got ${model || 'unknown'}.`)
	const authorised = canonicalBool(await readVariable(baseUrl, label, 'client_authorised'))
	const connectionStatus = await readVariable(baseUrl, label, 'connection_status')
	if (authorised !== 'true' || !/authorised/i.test(connectionStatus)) {
		throw new Error('Existing Companion Focusrite connection is not currently authorised.')
	}
	if (r9.probes.length !== 829) throw new Error(`Expected 829 feedback probes, got ${r9.probes.length}.`)
	return { baseUrl, label, r9, model }
}

function saveReport(context, steps) {
	fs.mkdirSync(resultsDir, { recursive: true })
	const report = {
		reportVersion: 1,
		reportClass: 'manual-feedback-sweep-local-sanitized',
		updatedAt: nowIso(),
		model: context.model,
		moduleVersion: EXPECTED_MODULE_VERSION,
		readOnlyHarness: true,
		hardwareWritesByHarness: false,
		companionButtonPressesByHarness: false,
		feedbackProbeCount: 829,
		feedbackDefinitionCount: 31,
		steps,
		privacy:
			'No serial, hostname, client key, server endpoint, device ID, raw XML, Companion connection ID or user path is stored.',
	}
	fs.writeFileSync(LATEST_REPORT, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
	return report
}

async function main() {
	console.log('==================================================================')
	console.log(' FOCUSRITE 18i20 MANUAL FEEDBACK SWEEP - READ ONLY')
	console.log('==================================================================')
	console.log('AUCUN write Focusrite et AUCUN bouton Companion ne sont declenches par ce harness.')
	console.log('Tu modifies toi-meme UN controle a la fois sur la Scarlett ou dans Focusrite Control.')
	console.log('Le TestBench observe les feedbacks qui changent et les compare a leur etat serveur.')
	console.log('')
	console.log('NE TESTE PAS: Device Preset, Clock Source, Sample Rate, S/PDIF, firmware/reset/restore/snapshot.')
	console.log('Ne tourne pas le bouton Monitor: item 1677 reste read-only.')
	console.log('Routing/Source/Stereo: seulement si tu connais l etat de depart et peux le restaurer exactement.')
	console.log('')

	const context = await prepare()
	line('PASS', 'Preflight', `${context.model}; module ${EXPECTED_MODULE_VERSION}; 829 feedbacks / 31 definitions`)
	console.log('Capture de la baseline...')
	const baseline = await captureMarkers(context.baseUrl, context.r9)
	const resolved = [...baseline.values()].filter(Boolean).length
	line('PASS', 'Baseline feedback', `${resolved}/829 markers lisibles; aucun bouton Companion presse`)

	const steps = []
	while (true) {
		console.log('')
		const userLabel = await ask('Controle a tester (ex: AIR 1, MONITOR MUTE), ou DONE : ')
		if (!userLabel || userLabel.toUpperCase() === 'DONE') break
		const ready = (await ask(`Change UNIQUEMENT ${userLabel}, garde le nouvel etat, puis tape CAPTURE : `)).toUpperCase()
		if (ready !== 'CAPTURE') continue

		const changedState = await captureMarkers(context.baseUrl, context.r9)
		const changed = changedProbes(context.r9.probes, baseline, changedState)
		const results = await mapLimit(changed, 12, async (probe) => ({
			probe,
			result: await validateProbe(context.baseUrl, context.label, context.r9.pageNumber, probe),
		}))

		console.log(`RESULTAT ${userLabel}`)
		if (!results.length) console.log('  INFO          Aucun feedback public n a change.')
		for (const entry of results) {
			const from = baseline.get(keyOf(entry.probe)) || '?'
			const to = changedState.get(keyOf(entry.probe)) || '?'
			const oracle = entry.result.source ? ` / ${entry.result.source}=${entry.result.state || '?'}` : ''
			console.log(`  ${entry.result.status.padEnd(13)} ${labelOf(entry.probe)} :: ${from} -> ${to}${oracle}`)
		}

		let restored = false
		while (!restored) {
			const answer = (await ask(`Remets ${userLabel} comme avant, attends le feedback, puis tape RESTORED : `)).toUpperCase()
			if (answer !== 'RESTORED') break
			const restoredState = await captureMarkers(context.baseUrl, context.r9)
			const pending = changed.filter((probe) => restoredState.get(keyOf(probe)) !== baseline.get(keyOf(probe)))
			if (!pending.length) restored = true
			else {
				console.log(`RESTORE NON CONFIRME pour ${pending.length} feedback(s). Ne change rien d autre.`)
				for (const probe of pending.slice(0, 10)) console.log(`  - ${labelOf(probe)}`)
			}
		}

		steps.push({
			label: userLabel,
			changedFeedbacks: results.map((entry) => ({
				definitionId: entry.probe.definitionId,
				options: entry.probe.options,
				before: baseline.get(keyOf(entry.probe)) || null,
				after: changedState.get(keyOf(entry.probe)) || null,
				status: entry.result.status,
				source: entry.result.source,
				state: entry.result.state,
			})),
			feedbackRestoreConfirmed: restored,
		})
		saveReport(context, steps)
		if (!restored) {
			console.log('STOP - retour a la baseline non confirme. Ne teste pas un autre controle.')
			process.exitCode = 3
			break
		}
		console.log(`PASS RESTORE ${userLabel}`)
	}

	const report = saveReport(context, steps)
	const transitions = report.steps.reduce((sum, step) => sum + step.changedFeedbacks.length, 0)
	const mismatches = report.steps.reduce(
		(sum, step) => sum + step.changedFeedbacks.filter((feedback) => feedback.status === 'FAIL_MISMATCH').length,
		0,
	)
	console.log('')
	console.log('==================================================================')
	console.log(`Etapes manuelles: ${report.steps.length}`)
	console.log(`Transitions de feedback observees: ${transitions}`)
	console.log(`Mismatch feedback/oracle: ${mismatches}`)
	console.log(`Rapport local sanitise: ${RELATIVE_REPORT}`)
	console.log('Aucun write Focusrite ni bouton Companion n a ete declenche par ce harness.')
	console.log('==================================================================')
	if (mismatches && !process.exitCode) process.exitCode = 4
}

if (require.main === module) {
	main().catch((error) => {
		console.error(`MANUAL FEEDBACK SWEEP FATAL - ${error.message}`)
		console.error('Aucun write Focusrite n a ete effectue par ce harness.')
		process.exitCode = 2
	})
}

module.exports = { keyOf, labelOf, changedProbes }

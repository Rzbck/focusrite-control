const { canonicalBool, line } = require('./FullTestBenchBase')
const { pressLocation } = require('./FullTestBenchAudit')
const { verifyMany, boolCheck } = require('./FullTestBenchCorePhases')
const { snapshotBlank } = require('./FullTestBenchPhasesV2')

async function pressBatch(baseUrl, extPage, built, batchId) {
	const loc = built.locations[batchId]
	if (!loc) throw new Error(`Generated batch ${batchId} is unavailable.`)
	await pressLocation(baseUrl, extPage, loc)
}

async function verifyOutputMute(baseUrl, label, variable, expected, timeoutMs = 6000) {
	const result = await verifyMany(baseUrl, label, [boolCheck(variable, expected)], timeoutMs)
	return result[0]?.ok === true
}

async function engageOutputMuteGuardV3(baseUrl, label, extPage, built, snapshot, reporter) {
	let tested = 0
	let noopRecoveries = 0
	let diagnosticFailures = 0
	for (const output of snapshot.shape.outputs) {
		const variable = `output_${output + 1}_mute`
		if (!snapshot.values[variable]?.exists) continue
		tested++
		const onBatch = `v2-output-${output + 1}-mute-on`
		const offBatch = `v2-output-${output + 1}-mute-off`
		await pressBatch(baseUrl, extPage, built, onBatch)
		if (await verifyOutputMute(baseUrl, label, variable, 'true', 1800)) continue

		if (!snapshotBlank(snapshot, variable)) {
			throw new Error(`HARD ABORT: Output ${output + 1} protective Mute ON was not confirmed from a known initial state.`)
		}

		let offConfirmed = false
		try {
			await pressBatch(baseUrl, extPage, built, offBatch)
			offConfirmed = await verifyOutputMute(baseUrl, label, variable, 'false', 6000)
		} finally {
			await pressBatch(baseUrl, extPage, built, onBatch)
			const onConfirmed = await verifyOutputMute(baseUrl, label, variable, 'true', 8000)
			if (!onConfirmed) {
				throw new Error(`HARD ABORT: Output ${output + 1} could not return to protective Mute ON after no-op recovery.`)
			}
		}
		if (offConfirmed) noopRecoveries++
		else {
			diagnosticFailures++
			reporter.add('protect', `output_${output + 1}_mute`, 'FAIL', 'OFF recovery transition was not confirmed, but protective Mute ON is confirmed.')
		}
	}
	if (!tested) throw new Error('No eligible output mute controls are available for the protective guard.')
	const detail = `${tested} eligible output mutes confirmed ON sequentially; ${noopRecoveries} no-op recoveries; ${diagnosticFailures} diagnostic failures with ON retained`
	reporter.add('protect', 'eligible-output-mutes', diagnosticFailures ? 'FAIL' : noopRecoveries ? 'NOOP_RECOVERY' : 'PASS', detail)
	line(diagnosticFailures ? 'FAIL' : 'PASS', 'Output mute guard', detail)
}

async function testOutputMutesIndividuallyV3(baseUrl, label, extPage, built, snapshot, reporter) {
	let tested = 0
	for (const output of snapshot.shape.outputs) {
		const variable = `output_${output + 1}_mute`
		if (!snapshot.values[variable]?.exists) continue
		tested++
		let error = null
		try {
			await pressBatch(baseUrl, extPage, built, `v2-output-${output + 1}-mute-off`)
			if (!(await verifyOutputMute(baseUrl, label, variable, 'false', 6000))) {
				error = new Error(`Output ${output + 1} Mute OFF was not server-confirmed.`)
			}
		} catch (err) {
			error = err
		} finally {
			await pressBatch(baseUrl, extPage, built, `v2-output-${output + 1}-mute-on`)
			if (!(await verifyOutputMute(baseUrl, label, variable, 'true', 8000))) {
				throw new Error(`HARD ABORT: Output ${output + 1} could not return to protective Mute ON after individual mute test.`)
			}
		}
		if (error) reporter.add('outputs', variable, 'FAIL', `${error.message} Protective ON restored.`)
		else reporter.add('outputs', variable, 'PASS', 'OFF -> ON server-confirmed while other eligible outputs remained muted.')
	}
	line('PASS', 'Output mute family', `${tested} eligible outputs exercised individually; protective ON retained`)
}

async function restoreOutputMutesV3(baseUrl, label, extPage, built, snapshot, reporter) {
	let restored = 0
	for (const output of snapshot.shape.outputs) {
		const variable = `output_${output + 1}_mute`
		const item = snapshot.values[variable]
		if (!item?.exists) continue
		const target = canonicalBool(item.value) || 'true'
		const batch = `v2-output-${output + 1}-mute-${target === 'true' ? 'on' : 'off'}`
		await pressBatch(baseUrl, extPage, built, batch)
		if (!(await verifyOutputMute(baseUrl, label, variable, target, 8000))) {
			throw new Error(`HARD ABORT: Output ${output + 1} mute restoration/baseline to ${target} was not confirmed.`)
		}
		restored++
	}
	reporter.add('restore', 'eligible-output-mutes', 'RESTORE_PASS', `${restored} eligible output mute states restored/baselined sequentially`)
}

module.exports = { engageOutputMuteGuardV3, testOutputMutesIndividuallyV3, restoreOutputMutesV3 }

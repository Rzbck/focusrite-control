const { line } = require('./FullTestBenchBase')
const { pressLocation } = require('./FullTestBenchAudit')
const { verifyMany, boolCheck, checksForBatch } = require('./FullTestBenchCorePhases')
const { onlyBlankFailures } = require('./FullTestBenchPhasesV2')

async function pressBatch(baseUrl, extPage, built, batchId) {
	const loc = built.locations[batchId]
	if (!loc) throw new Error(`Generated batch ${batchId} is unavailable.`)
	await pressLocation(baseUrl, extPage, loc)
}

async function engageOutputMuteGuardV2Safe(baseUrl, label, extPage, built, snapshot, reporter) {
	const checksOn = checksForBatch(snapshot, 'output-mute-on')
	await pressBatch(baseUrl, extPage, built, 'output-mute-on')
	let onResult = await verifyMany(baseUrl, label, checksOn, 6000)
	if (onResult.every((item) => item.ok)) {
		reporter.add('protect', 'all-output-mutes', 'PASS', `${checksOn.length} output mutes confirmed ON`)
		return
	}
	if (!onlyBlankFailures(onResult, snapshot)) {
		const failed = onResult.find((item) => !item.ok)
		throw new Error(`Protective output mute ON failed for known state ${failed.variable}.`)
	}

	let offError = null
	try {
		await pressBatch(baseUrl, extPage, built, 'v2-output-mute-off-all')
		const offChecks = checksOn.map((check) => boolCheck(check.variable, 'false'))
		const offResult = await verifyMany(baseUrl, label, offChecks, 10000)
		const offFailed = offResult.filter((item) => !item.ok)
		if (offFailed.length) {
			offError = new Error(`Output mute no-op recovery OFF was not fully confirmed (first: ${offFailed[0].variable}).`)
		}
	} catch (error) {
		offError = error
	} finally {
		await pressBatch(baseUrl, extPage, built, 'output-mute-on')
		onResult = await verifyMany(baseUrl, label, checksOn, 10000)
		if (onResult.some((item) => !item.ok)) {
			throw new Error('HARD ABORT: one or more output mutes could not return to protective ON after recovery.')
		}
	}

	if (offError) {
		reporter.add('protect', 'all-output-mutes', 'FAIL', `${offError.message} Protective ON is confirmed for all outputs.`)
		line('FAIL', 'Output mute guard recovery', `${offError.message} Protective ON confirmed; continuing.`)
	} else {
		reporter.add('protect', 'all-output-mutes', 'NOOP_RECOVERY', `${checksOn.length} outputs forced OFF -> ON to establish server-confirmed protective mute state`)
	}
}

module.exports = { engageOutputMuteGuardV2Safe }

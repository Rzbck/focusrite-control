'use strict'

const { EXPECTED_MODEL, EXPECTED_MODULE, findCompanion, get, readVariableOptional, canonicalBool, sleep } = require('./FullTestBenchBase')
const { normalizeConnections } = require('./FullTestBenchCompanionImportV7')

async function waitForRecorderReady(timeoutMs = 20000) {
	const baseUrl = await findCompanion()
	const connections = normalizeConnections(JSON.parse(await get(baseUrl, '/api/connections')))
	const candidates = connections.filter((connection) => connection?.moduleId === EXPECTED_MODULE && connection?.label)
	if (candidates.length !== 1) {
		throw new Error(`Expected exactly one live ${EXPECTED_MODULE} connection, got ${candidates.length}.`)
	}
	const label = String(candidates[0].label)
	const model = await readVariableOptional(baseUrl, label, 'device_model', 1800)
	if (!model.exists || String(model.value) !== EXPECTED_MODEL) {
		throw new Error(`Expected ${EXPECTED_MODEL}; recorder will not start.`)
	}

	const deadline = Date.now() + timeoutMs
	let lastAuthorised = ''
	let lastStatus = ''
	while (Date.now() < deadline) {
		const [authorised, status] = await Promise.all([
			readVariableOptional(baseUrl, label, 'client_authorised', 1800),
			readVariableOptional(baseUrl, label, 'connection_status', 1800),
		])
		lastAuthorised = authorised.exists ? String(authorised.value) : ''
		lastStatus = status.exists ? String(status.value) : ''
		if (canonicalBool(lastAuthorised) === 'true' && /authorised/i.test(lastStatus)) {
			return { baseUrl, label, status: lastStatus }
		}
		await sleep(200)
	}
	throw new Error(
		`Remote Devices state did not fully rematerialise after reconnect within ${timeoutMs}ms (authorised=${canonicalBool(lastAuthorised) || 'unknown'}; status=${lastStatus || 'unknown'}).`,
	)
}

async function main() {
	console.log('RECORDER READY PREFLIGHT - READ ONLY: attente de la rematerialisation Remote Devices apres reconnect...')
	await waitForRecorderReady()
	console.log('RECORDER READY PREFLIGHT PASS: modele exact + autorisation serveur rematerialisee.')
}

if (require.main === module) {
	main().catch((error) => {
		console.error(`RECORDER READY PREFLIGHT FAILED - ${error.message}`)
		console.error('Aucun write Focusrite et aucun bouton Companion n ont ete declenches.')
		process.exitCode = 3
	})
}

module.exports = { waitForRecorderReady }

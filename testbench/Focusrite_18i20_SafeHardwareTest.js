const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const packageJson = require('../package.json')

const EXPECTED_MODEL = 'Scarlett 18i20 (3rd Gen)'
const EXPECTED_MODULE = 'focusrite-scarlett-18i20'
const EXPECTED_MODULE_VERSION = packageJson.version
const testbenchDir = __dirname
const planPath = path.join(testbenchDir, 'Focusrite_18i20_SafeHardwarePlan.json')
const outputPath = path.join(testbenchDir, 'results', 'latest-safe-hardware-result.json')

function line(status, name, detail = '') {
	console.log(`${status.padEnd(5)} ${name}${detail ? ` :: ${detail}` : ''}`)
}

async function request(baseUrl, route, method = 'GET', timeoutMs = 5000) {
	const response = await fetch(`${baseUrl}${route}`, {
		method,
		signal: AbortSignal.timeout(timeoutMs),
	})
	const text = method === 'HEAD' ? '' : await response.text()
	return { status: response.status, text, xApp: response.headers.get('x-app') || '' }
}

async function findCompanion() {
	const ports = new Set([8000])
	try {
		const output = execFileSync('netstat', ['-ano', '-p', 'tcp'], { encoding: 'utf8', windowsHide: true })
		for (const rawLine of output.split(/\r?\n/)) {
			const match = rawLine.match(/^\s*TCP\s+\S+:(\d+)\s+\S+\s+LISTENING\b/i)
			if (match) ports.add(Number(match[1]))
		}
	} catch {
		// Port 8000 remains as a fallback candidate.
	}

	for (const port of ports) {
		if (!Number.isInteger(port) || port < 1024 || port > 65535) continue
		try {
			const probe = await request(`http://127.0.0.1:${port}`, '/', 'HEAD', 650)
			if (probe.xApp === 'Bitfocus Companion') return `http://127.0.0.1:${port}`
		} catch {
			// Not Companion.
		}
	}
	throw new Error('No local Bitfocus Companion web service was detected.')
}

async function get(baseUrl, route, timeoutMs = 5000) {
	const response = await request(baseUrl, route, 'GET', timeoutMs)
	if (response.status === 403) throw new Error('Companion refused the requested local API call (HTTP 403).')
	if (response.status < 200 || response.status >= 300) {
		throw new Error(`Companion returned HTTP ${response.status} for a required read.`)
	}
	return response.text
}

async function post(baseUrl, route, timeoutMs = 5000) {
	const response = await request(baseUrl, route, 'POST', timeoutMs)
	if (response.status === 204) throw new Error('No control exists at the expected r9 SAFE location.')
	if (response.status < 200 || response.status >= 300) {
		throw new Error(`Companion returned HTTP ${response.status} for a SAFE button press.`)
	}
}

function canonical(kind, value) {
	const raw = String(value ?? '').trim()
	if (!raw) return null
	if (kind === 'boolean') {
		if (/^(true|on|1)$/i.test(raw)) return 'true'
		if (/^(false|off|0)$/i.test(raw)) return 'false'
		return `__INVALID__:${raw}`
	}
	return raw
}

function getProperty(object, key) {
	if (!object || typeof object !== 'object') return undefined
	return object[String(key)]
}

async function readVariable(baseUrl, label, variable) {
	return (
		await get(baseUrl, `/api/variable/${encodeURIComponent(label)}/${encodeURIComponent(variable)}/value`)
	).trim()
}

async function waitVariable(baseUrl, label, test, expected) {
	const deadline = Date.now() + Number(test.timeoutMs || 5000)
	while (Date.now() < deadline) {
		const current = await readVariable(baseUrl, label, test.variable)
		if (canonical(test.kind, current) === canonical(test.kind, expected)) return true
		await new Promise((resolve) => setTimeout(resolve, 100))
	}
	return false
}

function setterFor(test, target) {
	const matches = test.setters.filter((setter) => String(setter.targetValue) === String(target))
	if (matches.length !== 1) throw new Error(`No unique explicit setter for ${test.id} -> ${target}`)
	return matches[0]
}

function unwrapOptions(options) {
	return Object.fromEntries(
		Object.entries(options || {}).map(([key, wrapped]) => {
			if (!wrapped || wrapped.isExpression !== false) throw new Error('SAFE action option is not a literal value.')
			return [key, wrapped.value]
		})
	)
}

function singleSafeDownAction(sets, location) {
	if (!sets || !Array.isArray(sets.down) || sets.down.length !== 1) {
		throw new Error(`r9 SAFE action-set mismatch at ${location}.`)
	}
	for (const [setId, actions] of Object.entries(sets)) {
		if (setId === 'down') continue
		if (!Array.isArray(actions) || actions.length !== 0) {
			throw new Error(`r9 SAFE action-set mismatch at ${location}.`)
		}
	}
	return sets.down[0]
}

function resolveLiveConnection(connections, exportedInstance) {
	const candidates = connections.filter((item) => item?.moduleId === EXPECTED_MODULE && item?.enabled === true)
	if (candidates.length === 0) throw new Error('No enabled Focusrite 18i20 Companion connection was found.')
	if (candidates.length === 1) return candidates[0]

	const exportedLabel = String(exportedInstance?.label || '').trim()
	if (exportedLabel) {
		const labelMatches = candidates.filter((item) => String(item?.label || '').trim() === exportedLabel)
		if (labelMatches.length === 1) return labelMatches[0]
	}

	throw new Error('Multiple enabled Focusrite connections exist and the r9 page cannot be mapped uniquely by label.')
}

function pageHasMarker(page, marker) {
	return JSON.stringify(page || {}).includes(marker)
}

async function auditR9Page(baseUrl, plan, connections) {
	const route =
		'/int/export/custom?buttons=true&connections=false&surfaces.known=false&surfaces.instances=false&surfaces.remote=false&triggers=false&customVariables=false&expressionVariables=false&includeSecrets=false&imageLibrary=false&format=json'
	const exported = JSON.parse(await get(baseUrl, route, 20000))
	if (exported.type !== 'full' || !exported.pages) throw new Error('Companion buttons-only export is unavailable.')

	let matches = Object.entries(exported.pages).filter(([, page]) => page?.name === plan.page.name)
	if (matches.length === 0) {
		matches = Object.entries(exported.pages).filter(([, page]) => pageHasMarker(page, plan.page.marker))
	}
	if (matches.length !== 1) {
		throw new Error('Expected exactly one existing r9 FULL MATRIX TestBench page.')
	}

	const [pageNumber, page] = matches[0]
	const grid = page.gridSize || {}
	for (const [key, value] of Object.entries(plan.page.grid)) {
		if (Number(grid[key]) !== Number(value)) throw new Error('Existing r9 TestBench page grid does not match 46x26.')
	}

	const referencedConnectionIds = new Set()
	const seenLocations = new Set()
	for (const test of plan.tests) {
		for (const setter of test.setters) {
			const location = `${setter.row}/${setter.column}`
			if (seenLocations.has(location)) throw new Error(`Duplicate SAFE setter location ${location}.`)
			seenLocations.add(location)

			const control = getProperty(getProperty(page.controls, setter.row), setter.column)
			if (!control || control.type !== 'button-layered') throw new Error(`r9 SAFE control mismatch at ${location}.`)
			const sets = getProperty(control.steps, 0)?.action_sets
			const action = singleSafeDownAction(sets, location)
			if (action.type !== 'action' || action.definitionId !== setter.definitionId) {
				throw new Error(`r9 SAFE action mismatch at ${location}.`)
			}
			const actualOptions = unwrapOptions(action.options)
			if (JSON.stringify(actualOptions) !== JSON.stringify(setter.options)) {
				throw new Error(`r9 SAFE option mismatch at ${location}.`)
			}
			if (!action.connectionId) throw new Error(`r9 SAFE connection reference missing at ${location}.`)
			referencedConnectionIds.add(action.connectionId)
		}
	}

	if (seenLocations.size !== 42) throw new Error('r9 SAFE setter count is not exactly 42.')
	if (referencedConnectionIds.size !== 1) throw new Error('r9 SAFE controls must reference exactly one Focusrite instance.')
	const referencedId = [...referencedConnectionIds][0]
	const exportedInstance = exported.instances?.[referencedId]
	if (!exportedInstance || exportedInstance.moduleId !== EXPECTED_MODULE) {
		throw new Error('r9 SAFE controls do not reference the expected Focusrite module.')
	}

	return {
		pageNumber: Number(pageNumber),
		connection: resolveLiveConnection(connections, exportedInstance),
	}
}

async function pressSetter(baseUrl, pageNumber, setter) {
	await post(baseUrl, `/api/location/${pageNumber}/${setter.row}/${setter.column}/press`)
}

function result(test, status, detail) {
	return { id: test.id, name: test.name, status, detail, confidence: test.confidence }
}

async function main() {
	if (!process.argv.includes('--allow-hardware-writes')) {
		throw new Error('REFUSED: missing explicit --allow-hardware-writes permission.')
	}
	const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'))
	if (
		plan.schemaVersion !== 2 ||
		plan.target?.moduleId !== EXPECTED_MODULE ||
		plan.target?.model !== EXPECTED_MODEL ||
		plan.tests?.length !== 21 ||
		plan.page?.marker !== 'TB-R9-ALL'
	) {
		throw new Error('REFUSED: SAFE hardware plan contract mismatch.')
	}

	console.log('')
	console.log('==================================================================')
	console.log(' FOCUSRITE 18i20 COMPANION TESTBENCH v0.2 - SAFE HARDWARE TEST')
	console.log('==================================================================')
	console.log('Using the existing r9 FULL MATRIX Companion page.')
	console.log('Unknown initial states are skipped without writing.')
	console.log('Every executed test uses explicit target + explicit restoration.')
	console.log('A restoration failure aborts all remaining tests immediately.')
	console.log('')

	const baseUrl = await findCompanion()
	const connectionsPayload = JSON.parse(await get(baseUrl, '/api/connections'))
	const connections = Array.isArray(connectionsPayload) ? connectionsPayload : connectionsPayload.connections || []
	const audited = await auditR9Page(baseUrl, plan, connections)
	line('PASS', 'Existing r9 TestBench page', '42 explicit SAFE setters verified; no page import required.')

	const connection = audited.connection
	const loadedVersion = String(connection.moduleVersionId || '').trim()
	if (loadedVersion !== EXPECTED_MODULE_VERSION) {
		throw new Error(
			`Loaded Focusrite Companion module version mismatch: expected ${EXPECTED_MODULE_VERSION}, got ${loadedVersion || 'unknown'}.`
		)
	}
	line('PASS', 'Module version', EXPECTED_MODULE_VERSION)

	const label = String(connection.label)
	const model = await readVariable(baseUrl, label, 'device_model')
	const authorised = canonical('boolean', await readVariable(baseUrl, label, 'client_authorised'))
	const status = await readVariable(baseUrl, label, 'connection_status')
	if (model !== EXPECTED_MODEL || authorised !== 'true' || !/authorised/i.test(status)) {
		throw new Error('Exact model / authorisation preflight failed.')
	}
	line('PASS', 'Preflight', 'Exact model and authorised module client confirmed.')

	const results = []
	const prepared = []
	let structuralFailure = false

	// Read every initial state before the first hardware write.
	for (const test of plan.tests) {
		try {
			const initial = canonical(test.kind, await readVariable(baseUrl, label, test.variable))
			if (initial === null) {
				const skipped = result(test, 'SKIP', 'Initial server state is unknown; no write attempted.')
				results.push(skipped)
				line(skipped.status, skipped.name, skipped.detail)
				continue
			}
			if (initial.startsWith('__INVALID__:') || !test.allowedInitial.includes(initial)) {
				throw new Error('Initial server state is invalid for this SAFE test.')
			}
			const changeTarget =
				test.kind === 'boolean'
					? initial === 'true'
						? 'false'
						: 'true'
					: test.allowedInitial.find((value) => value !== initial)
			if (!changeTarget) throw new Error('No reversible alternate target exists.')
			prepared.push({
				test,
				initial,
				changeTarget,
				changeSetter: setterFor(test, changeTarget),
				restoreSetter: setterFor(test, initial),
			})
		} catch (error) {
			structuralFailure = true
			const failed = result(test, 'FAIL', error.message)
			results.push(failed)
			line(failed.status, failed.name, failed.detail)
		}
	}
	if (structuralFailure) throw new Error('ABORTED BEFORE ANY TEST WRITE: invalid/unreadable initial state.')

	line('INFO', 'Runnable tests', String(prepared.length))
	line('INFO', 'Skipped unknown-state tests', String(results.filter((item) => item.status === 'SKIP').length))
	console.log('')

	let hardAbort = false
	for (const item of prepared) {
		const { test } = item
		const currentBefore = canonical(test.kind, await readVariable(baseUrl, label, test.variable))
		if (currentBefore !== item.initial) {
			hardAbort = true
			const failed = result(test, 'FAIL', 'State changed after preflight; no change button was pressed.')
			results.push(failed)
			line(failed.status, failed.name, failed.detail)
			break
		}

		let changeConfirmed = false
		let changeError = ''
		let writeAttempted = false
		try {
			writeAttempted = true
			await pressSetter(baseUrl, audited.pageNumber, item.changeSetter)
			changeConfirmed = await waitVariable(baseUrl, label, test, item.changeTarget)
			if (!changeConfirmed) changeError = `No server-confirmed transition to '${item.changeTarget}'.`
		} catch (error) {
			changeError = error.message
		}

		if (writeAttempted) {
			let restoreError = ''
			try {
				await pressSetter(baseUrl, audited.pageNumber, item.restoreSetter)
				const restored = await waitVariable(baseUrl, label, test, item.initial)
				if (!restored) restoreError = `Restoration was not server-confirmed to '${item.initial}'.`
			} catch (error) {
				restoreError = error.message
			}
			if (restoreError) {
				hardAbort = true
				const failed = result(test, 'FAIL', `HARD ABORT: ${restoreError}`)
				results.push(failed)
				line(failed.status, failed.name, failed.detail)
				break
			}
		}

		const finished = changeConfirmed
			? result(test, 'PASS', `Server-confirmed change and explicit restoration to '${item.initial}'.`)
			: result(test, 'FAIL', `Change unconfirmed; original state explicitly restored. ${changeError}`)
		results.push(finished)
		line(finished.status, finished.name, finished.detail)
		await new Promise((resolve) => setTimeout(resolve, 150))
	}

	const summary = {
		generatedUtc: new Date().toISOString(),
		planVersion: plan.planVersion,
		targetModel: EXPECTED_MODEL,
		moduleVersion: EXPECTED_MODULE_VERSION,
		pass: results.filter((item) => item.status === 'PASS').length,
		fail: results.filter((item) => item.status === 'FAIL').length,
		skip: results.filter((item) => item.status === 'SKIP').length,
		hardAbort,
		results,
	}
	fs.mkdirSync(path.dirname(outputPath), { recursive: true })
	fs.writeFileSync(outputPath, `${JSON.stringify(summary, null, '\t')}\n`, 'utf8')

	console.log('')
	console.log('==================================================================')
	console.log(`SUMMARY: PASS ${summary.pass} / FAIL ${summary.fail} / SKIP ${summary.skip}`)
	console.log('==================================================================')
	if (hardAbort) process.exitCode = 4
	else if (summary.fail > 0) process.exitCode = 2
	else if (summary.pass === 0) process.exitCode = 3
	else process.exitCode = 0
}

main().catch((error) => {
	line('FAIL', 'SAFE hardware runner', error.message)
	console.log('ABORTED. If any write had already been attempted, inspect hardware state before retrying.')
	process.exitCode = 2
})

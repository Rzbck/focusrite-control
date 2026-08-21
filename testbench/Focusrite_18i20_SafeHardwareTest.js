const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')

const EXPECTED_MODEL = 'Scarlett 18i20 (3rd Gen)'
const EXPECTED_MODULE = 'focusrite-scarlett-18i20'
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
	if (response.status === 204) throw new Error('No control exists at the expected SAFE TestBench location.')
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
	let last = ''
	while (Date.now() < deadline) {
		last = await readVariable(baseUrl, label, test.variable)
		if (canonical(test.kind, last) === canonical(test.kind, expected)) return true
		await new Promise((resolve) => setTimeout(resolve, 100))
	}
	return false
}

function setterFor(test, target) {
	const matches = test.setters.filter((setter) => String(setter.targetValue) === String(target))
	if (matches.length !== 1) throw new Error(`No unique explicit setter for ${test.id} -> ${target}`)
	return matches[0]
}

async function auditPages(baseUrl, plan, connection) {
	const route =
		'/int/export/custom?buttons=true&connections=false&surfaces.known=false&surfaces.instances=false&surfaces.remote=false&triggers=false&customVariables=false&expressionVariables=false&includeSecrets=false&imageLibrary=false&format=json'
	const exported = JSON.parse(await get(baseUrl, route, 15000))
	if (exported.type !== 'full' || !exported.pages) throw new Error('Companion buttons-only export is unavailable.')

	const resolved = {}
	for (const spec of plan.pages) {
		const matches = Object.entries(exported.pages).filter(([, page]) => page?.name === spec.name)
		if (matches.length !== 1) throw new Error(`Expected exactly one imported SAFE page ${spec.key}.`)
		const [pageNumber, page] = matches[0]
		resolved[spec.key] = Number(pageNumber)

		const actualCount = Object.values(page.controls || {}).reduce(
			(total, row) => total + Object.keys(row || {}).length,
			0
		)
		if (actualCount !== spec.expectedControls) throw new Error(`SAFE page ${spec.key} control-count mismatch.`)

		for (const test of plan.tests) {
			for (const setter of test.setters.filter((item) => item.pageKey === spec.key)) {
				const control = getProperty(getProperty(page.controls, setter.row), setter.column)
				if (!control || control.type !== 'button-layered') throw new Error(`SAFE page ${spec.key} control mismatch.`)
				const sets = getProperty(control.steps, 0)?.action_sets
				if (!sets || Object.keys(sets).length !== 1 || !Array.isArray(sets.down) || sets.down.length !== 1) {
					throw new Error(`SAFE page ${spec.key} action-set mismatch.`)
				}
				const action = sets.down[0]
				if (
					action.type !== 'action' ||
					action.definitionId !== setter.definitionId ||
					action.connectionId !== connection.id
				) {
					throw new Error(`SAFE page ${spec.key} action/connection mismatch.`)
				}
				if (exported.instances?.[action.connectionId]?.moduleId !== EXPECTED_MODULE) {
					throw new Error(`SAFE page ${spec.key} does not reference the expected module.`)
				}
				const actualOptionNames = Object.keys(action.options || {}).sort()
				const expectedOptionNames = Object.keys(setter.options || {}).sort()
				if (actualOptionNames.join('|') !== expectedOptionNames.join('|')) {
					throw new Error(`SAFE page ${spec.key} option-set mismatch.`)
				}
				for (const optionName of expectedOptionNames) {
					const wrapped = action.options[optionName]
					if (!wrapped || wrapped.isExpression !== false || String(wrapped.value) !== String(setter.options[optionName])) {
						throw new Error(`SAFE page ${spec.key} option-value mismatch.`)
					}
				}
			}
		}
	}
	return resolved
}

async function pressSetter(baseUrl, resolvedPages, setter) {
	const page = resolvedPages[setter.pageKey]
	if (!Number.isInteger(page)) throw new Error(`SAFE page ${setter.pageKey} was not resolved.`)
	await post(baseUrl, `/api/location/${page}/${setter.row}/${setter.column}/press`)
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
		plan.schemaVersion !== 1 ||
		plan.target?.moduleId !== EXPECTED_MODULE ||
		plan.target?.model !== EXPECTED_MODEL ||
		plan.tests?.length !== 21
	) {
		throw new Error('REFUSED: SAFE hardware plan contract mismatch.')
	}

	console.log('')
	console.log('==================================================================')
	console.log(' FOCUSRITE 18i20 COMPANION TESTBENCH v0.2 - SAFE HARDWARE TEST')
	console.log('==================================================================')
	console.log('Unknown initial states are skipped without writing.')
	console.log('Every executed test uses explicit target + explicit restoration.')
	console.log('A restoration failure aborts all remaining tests immediately.')
	console.log('')

	const baseUrl = await findCompanion()
	const connectionsPayload = JSON.parse(await get(baseUrl, '/api/connections'))
	const connections = Array.isArray(connectionsPayload) ? connectionsPayload : connectionsPayload.connections || []
	const matches = connections.filter((item) => item?.moduleId === EXPECTED_MODULE && item?.enabled === true)
	if (matches.length !== 1) throw new Error('Exactly one enabled Focusrite 18i20 Companion connection is required.')
	const connection = matches[0]
	const label = String(connection.label)

	const model = await readVariable(baseUrl, label, 'device_model')
	const authorised = canonical('boolean', await readVariable(baseUrl, label, 'client_authorised'))
	const status = await readVariable(baseUrl, label, 'connection_status')
	if (model !== EXPECTED_MODEL || authorised !== 'true' || !/authorised/i.test(status)) {
		throw new Error('Exact model / authorisation preflight failed.')
	}
	line('PASS', 'Preflight', 'Exact model and authorised module client confirmed.')

	const resolvedPages = await auditPages(baseUrl, plan, connection)
	line('PASS', 'TestBench pages', 'Both SAFE pages match the exact action map and active connection.')

	const results = []
	const prepared = []
	let structuralFailure = false

	// Read all initial states before the first hardware write.
	for (const test of plan.tests) {
		try {
			const initial = canonical(test.kind, await readVariable(baseUrl, label, test.variable))
			if (initial === null) {
				const item = result(test, 'SKIP', 'Initial server state is unknown; no write attempted.')
				results.push(item)
				line(item.status, item.name, item.detail)
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
			const item = result(test, 'FAIL', error.message)
			results.push(item)
			line(item.status, item.name, item.detail)
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
			await pressSetter(baseUrl, resolvedPages, item.changeSetter)
			changeConfirmed = await waitVariable(baseUrl, label, test, item.changeTarget)
			if (!changeConfirmed) changeError = `No server-confirmed transition to '${item.changeTarget}'.`
		} catch (error) {
			changeError = error.message
		}

		if (writeAttempted) {
			let restoreError = ''
			try {
				await pressSetter(baseUrl, resolvedPages, item.restoreSetter)
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

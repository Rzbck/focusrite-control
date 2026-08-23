'use strict'

const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const {
	EXPECTED_MODULE,
	R9_PAGE_NAME,
	generatedPagePath,
	findCompanion,
	get,
	exportButtons,
	stableStringify,
} = require('./FullTestBenchBase')
const { Reporter } = require('./FullTestBenchCorePhases')
const { prepareLab } = require('./FullTestBenchRunnerV4Preflight')
const { auditExtendedPageV4 } = require('./FullTestBenchPageV4')

// Procedure names and sequencing follow the Bitfocus Companion 5.0.3
// Import/Export implementation (MIT). See THIRD_PARTY_NOTICES.md.
const PAGE2_CONFIRM_FLAG = '--replace-page-2'
const IMPORT_CHUNK_BYTES = 1024 * 1024

function rpcWebSocketUrl(baseUrl) {
	const url = new URL('/trpc', baseUrl)
	url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
	return url.toString()
}

class TrpcWsRpc {
	constructor(url, WebSocketCtor = globalThis.WebSocket) {
		if (typeof WebSocketCtor !== 'function') {
			throw new Error('Node WebSocket support is unavailable. Use the project Node 22 runtime.')
		}
		this.url = url
		this.WebSocketCtor = WebSocketCtor
		this.ws = null
		this.nextId = 1
		this.pending = new Map()
	}

	async connect(timeoutMs = 5000) {
		if (this.ws) return
		await new Promise((resolve, reject) => {
			const ws = new this.WebSocketCtor(this.url)
			this.ws = ws
			const timeout = setTimeout(() => reject(new Error('Companion tRPC WebSocket connection timed out.')), timeoutMs)
			ws.addEventListener(
				'open',
				() => {
					clearTimeout(timeout)
					resolve()
				},
				{ once: true },
			)
			ws.addEventListener(
				'error',
				() => {
					clearTimeout(timeout)
					reject(new Error('Companion tRPC WebSocket connection failed.'))
				},
				{ once: true },
			)
			ws.addEventListener('message', (event) => {
				void this.handleMessage(event.data)
			})
			ws.addEventListener('close', () => {
				for (const { reject: rejectPending } of this.pending.values()) {
					rejectPending(new Error('Companion tRPC WebSocket closed before the operation completed.'))
				}
				this.pending.clear()
			})
		})
	}

	async handleMessage(data) {
		let text
		if (typeof data === 'string') text = data
		else if (data instanceof ArrayBuffer) text = Buffer.from(data).toString('utf8')
		else if (typeof data?.text === 'function') text = await data.text()
		else text = String(data)

		let messages
		try {
			const parsed = JSON.parse(text)
			messages = Array.isArray(parsed) ? parsed : [parsed]
		} catch {
			return
		}
		for (const message of messages) {
			if (message?.id === null || message?.id === undefined) continue
			const pending = this.pending.get(String(message.id))
			if (!pending) continue
			this.pending.delete(String(message.id))
			if (message.error) {
				const detail = message.error?.json?.message || message.error?.message || 'Unknown tRPC error'
				pending.reject(new Error(`Companion tRPC error: ${detail}`))
			} else if (message.result?.type === 'data') {
				pending.resolve(message.result.data)
			} else {
				pending.reject(new Error('Companion tRPC returned an unexpected response.'))
			}
		}
	}

	async mutate(pathName, input, timeoutMs = 30000) {
		if (!this.ws) throw new Error('Companion tRPC WebSocket is not connected.')
		const id = String(this.nextId++)
		const payload = JSON.stringify({
			id,
			method: 'mutation',
			params: { path: pathName, input },
		})
		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				this.pending.delete(id)
				reject(new Error(`Companion tRPC mutation timed out: ${pathName}`))
			}, timeoutMs)
			this.pending.set(id, {
				resolve: (value) => {
					clearTimeout(timeout)
					resolve(value)
				},
				reject: (error) => {
					clearTimeout(timeout)
					reject(error)
				},
			})
			try {
				this.ws.send(payload)
			} catch (error) {
				clearTimeout(timeout)
				this.pending.delete(id)
				reject(error)
			}
		})
	}

	close() {
		try {
			this.ws?.close()
		} catch {
			// Local configuration operation is already complete or failed closed.
		}
		this.ws = null
	}
}

function normalizeConnections(payload) {
	if (Array.isArray(payload)) return payload
	if (Array.isArray(payload?.connections)) return payload.connections
	if (payload?.connections && typeof payload.connections === 'object') return Object.values(payload.connections)
	if (payload && typeof payload === 'object') return Object.values(payload)
	return []
}

function buildConnectionRemap(preparedImport, liveConnection) {
	const candidates = Object.entries(preparedImport?.connections || {}).filter(
		([, connection]) => connection?.moduleId === EXPECTED_MODULE,
	)
	if (candidates.length !== 1) {
		throw new Error(`Generated Page 2 import must contain exactly one ${EXPECTED_MODULE} connection reference.`)
	}
	if (!liveConnection?.id || liveConnection.moduleId !== EXPECTED_MODULE) {
		throw new Error('Existing approved Focusrite Companion connection could not be resolved uniquely.')
	}
	return { [candidates[0][0]]: liveConnection.id }
}

function hashPagesExcept(exported, excludedPageNumber = 2) {
	return crypto
		.createHash('sha256')
		.update(
			stableStringify(
				Object.fromEntries(
					Object.entries(exported?.pages || {}).filter(([pageNumber]) => Number(pageNumber) !== excludedPageNumber),
				),
			),
		)
		.digest('hex')
}

function sameConnectionSet(before, after) {
	const beforeIds = before.map((connection) => String(connection?.id || '')).sort()
	const afterIds = after.map((connection) => String(connection?.id || '')).sort()
	return stableStringify(beforeIds) === stableStringify(afterIds)
}

async function prepareImport(rpc, filePath) {
	const bytes = fs.readFileSync(filePath)
	const sessionId = await rpc.mutate('importExport.prepareImport.start', {
		name: path.basename(filePath),
		size: bytes.length,
	})
	if (!sessionId) throw new Error('Companion did not create an import upload session.')

	try {
		for (let offset = 0; offset < bytes.length; offset += IMPORT_CHUNK_BYTES) {
			const chunk = bytes.subarray(offset, Math.min(bytes.length, offset + IMPORT_CHUNK_BYTES))
			const progress = await rpc.mutate('importExport.prepareImport.uploadChunk', {
				sessionId,
				offset,
				data: chunk.toString('base64'),
			})
			if (!Number.isFinite(Number(progress)) || Number(progress) <= 0) {
				throw new Error(`Companion rejected Page 2 upload chunk at offset ${offset}.`)
			}
		}
		const expectedChecksum = crypto.createHash('sha1').update(bytes).digest('hex')
		const prepared = await rpc.mutate('importExport.prepareImport.complete', {
			sessionId,
			expectedChecksum,
			userData: null,
		})
		const [error, config] = Array.isArray(prepared) ? prepared : [null, null]
		if (error || !config) throw new Error(error || 'Companion could not prepare the generated Page 2 import.')
		if (config.type !== 'page') throw new Error('Generated capability harness did not parse as a single-page Companion import.')
		return config
	} catch (error) {
		try {
			await rpc.mutate('importExport.prepareImport.cancel', { sessionId }, 5000)
		} catch {
			// The failed session may already be closed by Companion.
		}
		throw error
	}
}

async function replaceGeneratedPage2() {
	if (!process.argv.includes(PAGE2_CONFIRM_FLAG)) {
		throw new Error(`REFUSED: missing explicit ${PAGE2_CONFIRM_FLAG} confirmation.`)
	}
	if (!fs.existsSync(generatedPagePath)) throw new Error('Generated FULL_EXTENDED.companionconfig is missing.')

	console.log('')
	console.log('==================================================================')
	console.log(' COMPANION PAGE 2 AUTO-REPLACE - LOCAL CONFIG ONLY')
	console.log('==================================================================')
	console.log('No Focusrite hardware write is performed by this operation.')
	console.log('Only Companion Page 2 may be replaced; Page 1 and the existing Focusrite connection must remain unchanged.')
	console.log('')

	const reporter = new Reporter()
	const ctx = await prepareLab(reporter)
	if (ctx.prep === 'mixer-variables') throw new Error('Mixer variables must be exposed before Page 2 can be prepared.')
	if (ctx.prep !== 'harness') {
		console.log('PASS               Page 2 :: current generated harness is already present and audited.')
		return { alreadyCurrent: true }
	}

	const baseUrl = ctx.baseUrl || (await findCompanion())
	const beforeExport = await exportButtons(baseUrl)
	if (!beforeExport.pages?.['2']) {
		throw new Error('Companion Page 2 does not exist; automatic replacement refuses to create/reorder pages.')
	}
	const r9Page = Object.values(beforeExport.pages || {}).find((page) => page?.name === R9_PAGE_NAME)
	if (!r9Page) throw new Error('Live r9 Page 1 could not be located before Page 2 replacement.')
	const beforeOtherPagesHash = hashPagesExcept(beforeExport, 2)
	const beforeConnections = normalizeConnections(JSON.parse(await get(baseUrl, '/api/connections')))

	const rpc = new TrpcWsRpc(rpcWebSocketUrl(baseUrl))
	try {
		await rpc.connect()
		const preparedImport = await prepareImport(rpc, generatedPagePath)
		const connectionIdRemapping = buildConnectionRemap(preparedImport, ctx.r9.connection)
		await rpc.mutate('importExport.importSinglePage', {
			targetPage: 2,
			sourcePage: 1,
			connectionIdRemapping,
		})
	} finally {
		rpc.close()
	}

	const afterExport = await exportButtons(baseUrl)
	const afterConnections = normalizeConnections(JSON.parse(await get(baseUrl, '/api/connections')))
	if (hashPagesExcept(afterExport, 2) !== beforeOtherPagesHash) {
		throw new Error(
			'Automatic Page 2 audit failed: a page other than Page 2 changed. Hardware campaign remains blocked.',
		)
	}
	if (!sameConnectionSet(beforeConnections, afterConnections)) {
		throw new Error(
			'Automatic Page 2 audit failed: Companion connection set changed. Hardware campaign remains blocked.',
		)
	}
	const ext = auditExtendedPageV4(afterExport, ctx.built, afterConnections)
	if (!ext || ext.pageNumber !== 2) {
		throw new Error('Automatic Page 2 audit failed: generated harness was not found exactly on Page 2.')
	}
	if (ext.connection.id !== ctx.r9.connection.id) {
		throw new Error('Automatic Page 2 audit failed: harness was not mapped to the existing Focusrite connection.')
	}

	console.log(
		`PASS               Page 2 auto-replace :: generated harness ${ctx.built.signature} imported and audited on Page 2.`,
	)
	console.log(
		'PASS               Connection preservation :: existing Focusrite connection reused; no new connection was created.',
	)
	console.log('PASS               Hardware safety :: no Focusrite hardware write was sent by Page 2 replacement.')
	return { alreadyCurrent: false, signature: ctx.built.signature }
}

if (require.main === module) {
	replaceGeneratedPage2().catch((error) => {
		console.error(`AUTO PAGE2 FAIL     ${error.message}`)
		process.exitCode = 7
	})
}

module.exports = {
	PAGE2_CONFIRM_FLAG,
	IMPORT_CHUNK_BYTES,
	TrpcWsRpc,
	rpcWebSocketUrl,
	normalizeConnections,
	buildConnectionRemap,
	hashPagesExcept,
	sameConnectionSet,
	prepareImport,
	replaceGeneratedPage2,
}

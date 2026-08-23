'use strict'

const {
	get,
	exportButtons,
} = require('./FullTestBenchBase')
const { auditExtendedPageV4 } = require('./FullTestBenchPageV4')
const {
	TrpcWsRpc,
	rpcWebSocketUrl,
	normalizeConnections,
	buildConnectionRemap,
	resolveAuditedR9Page,
	hashPagesExcept,
	sameConnectionSet,
	prepareImport,
} = require('./FullTestBenchCompanionImportV7')

async function replacePage2FromFile({ baseUrl, r9, built, filePath }) {
	const beforeExport = await exportButtons(baseUrl)
	if (!beforeExport.pages?.['2']) {
		throw new Error('Companion Page 2 does not exist; meter routing refuses to create or reorder pages.')
	}
	resolveAuditedR9Page(beforeExport, r9)
	const beforeOtherPagesHash = hashPagesExcept(beforeExport, 2)
	const beforeConnections = normalizeConnections(JSON.parse(await get(baseUrl, '/api/connections')))

	const rpc = new TrpcWsRpc(rpcWebSocketUrl(baseUrl))
	try {
		await rpc.connect()
		const preparedImport = await prepareImport(rpc, filePath)
		const connectionIdRemapping = buildConnectionRemap(preparedImport, r9.connection)
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
		throw new Error('Meter routing Page 2 audit failed: a page other than Page 2 changed.')
	}
	if (!sameConnectionSet(beforeConnections, afterConnections)) {
		throw new Error('Meter routing Page 2 audit failed: Companion connection set changed.')
	}
	const ext = auditExtendedPageV4(afterExport, built, afterConnections)
	if (!ext || ext.pageNumber !== 2) {
		throw new Error('Meter routing Page 2 audit failed: expected harness was not found exactly on Page 2.')
	}
	if (ext.connection.id !== r9.connection.id) {
		throw new Error('Meter routing Page 2 audit failed: existing Focusrite connection was not preserved.')
	}
	return ext
}

module.exports = { replacePage2FromFile }

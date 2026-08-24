'use strict'

const path = require('node:path')
const { generatedPagePath, testbenchDir, line } = require('./FullTestBenchBase')
const { Reporter } = require('./FullTestBenchCorePhases')
const { prepareLab } = require('./FullTestBenchRunnerV4Preflight')

async function main() {
	console.log('==================================================================')
	console.log(' FOCUSRITE 18i20 METER ROUTING - READ-ONLY PREPARATION')
	console.log('==================================================================')
	console.log('Aucun bouton Companion presse. Aucun write Focusrite. Aucun routing hardware modifie.')
	console.log('')

	const reporter = new Reporter()
	const ctx = await prepareLab(reporter)
	if (ctx.prep === 'mixer-variables') {
		line(
			'PREP REQUIRED',
			'Mixer variables',
			'Expose all mixer slot variables must remain enabled on the existing Focusrite connection.',
		)
		process.exitCode = 6
		return
	}
	if (ctx.prep === 'harness') {
		line(
			'PREP REQUIRED',
			'Capability Lab Page 2',
			`${path.relative(testbenchDir, generatedPagePath)} generated from the current server-confirmed snapshot; zero hardware writes.`,
		)
		process.exitCode = 6
		return
	}
	if (ctx.prep !== null || !ctx.ext || ctx.ext.pageNumber !== 2) {
		throw new Error('Current V8 capability-lab harness is not audited exactly on Companion Page 2.')
	}
	line('PASS', 'Meter routing preparation', 'current V8 capability-lab harness audited exactly on Companion Page 2')
	console.log('Aucun write hardware n a ete effectue par cette preparation.')
}

if (require.main === module) {
	main().catch((error) => {
		console.error(`METER ROUTING PREP FATAL - ${error.message}`)
		console.error('Aucun write hardware n a ete effectue par cette preparation.')
		process.exitCode = 7
	})
}

module.exports = { main }

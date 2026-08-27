'use strict'

const { Reporter } = require('./FullTestBenchCorePhases')
const { prepareLab } = require('./FullTestBenchRunnerV4Preflight')

const PREP_REQUIRED_EXIT = 9
const PREP_AUTO_REPLACE_EXIT = 10

function printPage2State(state) {
	const page2 = state || {
		exists: false,
		classification: 'UNKNOWN',
		controlCount: 0,
		safeReplacementCandidate: false,
	}
	console.log(
		`Page 2 identity: ${page2.classification}; controls=${page2.controlCount}; known-TestBench-replacement-candidate=${page2.safeReplacementCandidate ? 'YES' : 'NO'}`,
	)
	return page2
}

async function main() {
	console.log('==================================================================')
	console.log(' FOCUSRITE 18i20 - MIX FEEDBACK PREPARATION CHECK - READ ONLY')
	console.log('==================================================================')
	console.log('No Focusrite hardware write. No Companion Page 2 mutation. No package install.')
	console.log('')

	const reporter = new Reporter()
	const ctx = await prepareLab(reporter)

	if (ctx.prep === 'mixer-variables') {
		console.log('PREP_REQUIRED - required mixer variables are not currently exposed by Companion.')
		console.log('Hardware writes: 0')
		console.log('Page 2 mutations: 0')
		console.log('Hardware restore required: NO')
		process.exitCode = PREP_REQUIRED_EXIT
		return
	}

	const page2 = printPage2State(ctx.page2State)
	if (ctx.prep === 'harness' || !ctx.ext || ctx.ext.pageNumber !== 2) {
		console.log('PREP_REQUIRED - the exact current V8 capability-lab harness is not on Companion Page 2.')
		if (page2.classification === 'STALE_FOCUSRITE_TESTBENCH_HARNESS' && page2.safeReplacementCandidate) {
			console.log('Page 2 is a recognized older Focusrite TestBench harness.')
			console.log(
				'Use the existing validated PAGE2_AUTO importer path to replace it with the generated current harness.',
			)
			console.log('Hardware writes: 0')
			console.log('Page 2 mutations: 0')
			console.log('Hardware restore required: NO')
			process.exitCode = PREP_AUTO_REPLACE_EXIT
			return
		}
		if (page2.classification === 'OTHER_OR_USER_PAGE') {
			console.log('Page 2 is not a recognized Focusrite TestBench harness. Do NOT replace it automatically.')
		} else if (page2.classification === 'UNVERIFIED_TESTBENCH_MARKER') {
			console.log('Page 2 resembles a TestBench page but its identity is not safe enough for automatic replacement.')
		}
		console.log('Hardware writes: 0')
		console.log('Page 2 mutations: 0')
		console.log('Hardware restore required: NO')
		process.exitCode = PREP_REQUIRED_EXIT
		return
	}

	console.log('PREP_READY - exact audited V8 capability-lab harness is already on Companion Page 2.')
	console.log('Hardware writes: 0')
	console.log('Page 2 mutations: 0')
	console.log('Hardware restore required: NO')
	process.exitCode = 0
}

if (require.main === module) {
	main().catch((error) => {
		console.error(`MIX FEEDBACK PREPARATION CHECK FAIL - ${error.message}`)
		console.error('This checker has no Focusrite hardware-write path and does not mutate Companion Page 2.')
		process.exitCode = 2
	})
}

module.exports = { PREP_REQUIRED_EXIT, PREP_AUTO_REPLACE_EXIT, printPage2State }

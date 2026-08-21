const { mainV3 } = require('./FullTestBenchRunnerV3')

mainV3().catch((error) => {
	console.error(`FATAL: ${error.message}`)
	process.exitCode = 2
})
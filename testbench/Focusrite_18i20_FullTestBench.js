const { mainV2 } = require('./FullTestBenchRunnerV2')

mainV2().catch((error) => {
	console.error(`FATAL: ${error.message}`)
	process.exitCode = 2
})

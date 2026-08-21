const { mainV4 } = require('./FullTestBenchRunnerV4')

mainV4().catch((error) => {
  console.error(`FATAL: ${error.message}`)
  process.exitCode = 2
})

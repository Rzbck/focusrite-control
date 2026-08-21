import { generateEslintConfig } from '@companion-module/tools/eslint/config.mjs'

export default generateEslintConfig({
	ignores: [
		'.build-tools/**',
		'node_modules/**',
		'pkg/**',
		'READY_TO_SHARE/**',
		'test/testbench-safety.test.js',
		'test/full-testbench-safety.test.js',
		'testbench/Focusrite_18i20_SafeHardwareTest.js',
		'testbench/Focusrite_18i20_FullTestBench.js',
		'testbench/FullTestBench*.js',
	],
})

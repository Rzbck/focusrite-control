const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const preflightPath = path.join(__dirname, '..', 'testbench', 'Focusrite_18i20_Preflight.ps1')
const preflight = fs.readFileSync(preflightPath, 'utf8')

test('TestBench preflight stays read-only and privacy-safe', () => {
	assert.doesNotMatch(preflight, /-Method\s+['"]POST['"]/i)
	assert.doesNotMatch(preflight, /\/press\//i)
	assert.doesNotMatch(preflight, /device_serial|client_control_id|server_port|client[_-]?key/i)
	assert.doesNotMatch(preflight, /1677/)
	assert.match(preflight, /Scarlett 18i20 \(3rd Gen\)/)
	assert.match(preflight, /focusrite-scarlett-18i20/)
})

test('TestBench preflight discovers Companion locally instead of hardcoding one web port', () => {
	assert.doesNotMatch(preflight, /CompanionBaseUrl\s*=\s*['"]http:\/\/127\.0\.0\.1:8000['"]/i)
	assert.match(preflight, /GetActiveTcpListeners/)
	assert.match(preflight, /X-App/)
	assert.match(preflight, /Bitfocus Companion/)
	assert.match(preflight, /UseProxy\s*=\s*\$false/)
})

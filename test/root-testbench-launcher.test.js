const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')
const shortcut = fs.readFileSync(path.join(root, 'RUN_TESTBENCH.bat'), 'utf8')

test('root TestBench shortcut delegates to the canonical SAFE/FULL launcher only', () => {
  assert.match(shortcut, /testbench\\RUN_SAFE_HARDWARE_TESTS\.cmd/i)
  assert.match(shortcut, /call "%TESTBENCH_LAUNCHER%"/)
  assert.doesNotMatch(shortcut, /Focusrite_18i20_(?:SafeHardwareTest|FullTestBench)\.js/i)
  assert.doesNotMatch(shortcut, /--allow-hardware-writes/i)
})

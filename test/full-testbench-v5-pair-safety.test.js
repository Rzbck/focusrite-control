const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')
const capability = require('../testbench/FullTestBenchCapabilityV4')
const pairs = require('../testbench/FullTestBenchPairsV4')
const pairSafety = require('../testbench/FullTestBenchPairSafetyV5')
const report = require('../testbench/FullTestBenchReportV4')

test('V5 campaign revision invalidates the old V4 harness signature', () => {
  assert.match(capability.CAMPAIGN_REVISION, /^full-v5-pair-aware-safety-/)
})

test('pair harness ids include explicit pair restore', () => {
  assert.deepEqual(pairs.pairBatchIds(10, 11), {
    test: 'v4-pair-11-12-source-test',
    none: 'v4-pair-11-12-source-none',
    restore: 'v4-pair-11-12-source-restore',
  })
})

test('signal-path safety reports server-confirmed guard reasons per output', () => {
  const rows = pairSafety.buildSignalPathSafety(
    [
      { output: 0, availability: 'AVAILABLE' },
      { output: 1, availability: 'AVAILABLE' },
      { output: 2, availability: 'UNAVAILABLE' },
    ],
    new Map([
      [0, { safe: true, reason: 'mute-confirmed' }],
      [1, { safe: true, reason: 'pair-source-none' }],
    ]),
  )
  assert.deepEqual(rows, [
    { output: 1, availability: 'AVAILABLE', safe: true, reason: 'mute-confirmed' },
    { output: 2, availability: 'AVAILABLE', safe: true, reason: 'pair-source-none' },
    { output: 3, availability: 'UNAVAILABLE', safe: true, reason: 'unavailable' },
  ])
})

test('a successful individual Source=None follower guard is upgraded to a pair-aware guard', () => {
  assert.equal(pairSafety.pairNeedsSourceGuard(0, 1, new Map([
    [0, { safe: true, reason: 'mute-confirmed' }],
    [1, { safe: true, reason: 'source-none' }],
  ])), true)
  assert.equal(pairSafety.pairNeedsSourceGuard(0, 1, new Map([
    [0, { safe: true, reason: 'mute-confirmed' }],
    [1, { safe: true, reason: 'pair-mute-confirmed' }],
  ])), false)
})

test('pair-source validation no longer assumes identical left and right source ids', () => {
  const source = fs.readFileSync(path.join(root, 'testbench', 'FullTestBenchPairsV4.js'), 'utf8')
  assert.match(source, /right member did not expose a non-zero paired source id/)
  assert.doesNotMatch(source, /exactCheck\(`output_\$\{right \+ 1\}_source`, built\.testSources\.primary\)/)
})

test('pair-aware safety never writes availability UNKNOWN pairs', () => {
  const source = fs.readFileSync(path.join(root, 'testbench', 'FullTestBenchPairSafetyV5.js'), 'utf8')
  assert.match(source, /leftAvail === 'UNKNOWN' \|\| rightAvail === 'UNKNOWN'/)
  assert.doesNotMatch(source, /\.setItem\s*\(|<set\b/i)
})

test('Monitor Mute restoration occurs before reconnect so reconnect is read/session validation only', () => {
  const source = fs.readFileSync(path.join(root, 'testbench', 'FullTestBenchRunnerV4Campaign.js'), 'utf8')
  const restoreIndex = source.indexOf("'Restore original Monitor Mute'")
  const reconnectIndex = source.indexOf("'Reconnect validation (no writes after reconnect)'")
  assert.ok(restoreIndex > 0)
  assert.ok(reconnectIndex > restoreIndex)
})

test('shareable report can expose only sanitized signal-path safety reasons', () => {
  const payload = report.buildShareablePayload({
    rows: [],
    meta: {
      completed: true,
      signalPathSafety: [
        { output: 2, availability: 'AVAILABLE', safe: false, reason: 'source-none-error:C:\\Private\\diag.txt' },
      ],
    },
  })
  const text = JSON.stringify(payload)
  assert.match(text, /signalPathSafety/)
  assert.doesNotMatch(text, /Private|diag\.txt/)
  assert.match(text, /<path-redacted>/)
})

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const root = path.join(__dirname, '..')
const capability = require('../testbench/FullTestBenchCapabilityV4')

function item(value, exists = true) {
  return { exists, value }
}

test('V5 keeps hardware writes gated while allowing future read-only profile discovery', () => {
  const profile = capability.profileForModel('Scarlett 18i20 (3rd Gen)')
  assert.equal(profile.supportedShape.outputs, 26)
  assert.equal(profile.hardwareTested, true)
  assert.equal(profile.writeEnabled, true)
  assert.throws(() => capability.profileForModel('Scarlett 4i4 (4th Gen)'), /No hardware-tested capability profile/)
  const discovery = capability.profileForModel('Scarlett 4i4 (4th Gen)', { allowUnvalidated: true })
  assert.equal(discovery.hardwareTested, false)
  assert.equal(discovery.writeEnabled, false)
  assert.throws(() => capability.assertHardwareWriteProfile(discovery), /Hardware writes are blocked/)
})

test('V5 classifies output availability instead of treating all schema outputs as writable', () => {
  const rows = capability.classifyOutputEligibility({ outputs: [0, 1, 2, 3] }, new Map([
    [0, item('true')],
    [1, item('false')],
    [2, item('')],
    [3, item('', false)],
  ]))
  assert.deepEqual(rows.map((row) => [row.availability, row.eligible]), [
    ['AVAILABLE', true],
    ['UNAVAILABLE', false],
    ['UNKNOWN', false],
    ['NO_FLAG', true],
  ])
})

test('V5 mute classifier distinguishes independent and coupled pair behavior', () => {
  const independent = capability.classifyMuteProbe({
    targetIndex: 10,
    mateIndex: 11,
    before: { 10: item('false'), 11: item('false') },
    afterOn: { 10: item('true'), 11: item('false') },
    afterOff: { 10: item('false'), 11: item('false') },
    restored: { 10: item('false'), 11: item('false') },
    goldenTarget: false,
  })
  assert.equal(independent.status, capability.STATUS.PASS_INDEPENDENT)

  const coupled = capability.classifyMuteProbe({
    targetIndex: 10,
    mateIndex: 11,
    before: { 10: item('false'), 11: item('false') },
    afterOn: { 10: item('true'), 11: item('true') },
    afterOff: { 10: item('false'), 11: item('false') },
    restored: { 10: item('false'), 11: item('false') },
    goldenTarget: false,
  })
  assert.equal(coupled.status, capability.STATUS.PASS_COUPLED_PAIR)
})

test('V5 recognizes a paired alias when target state does not cycle but mate does', () => {
  const alias = capability.classifyMuteProbe({
    targetIndex: 1,
    mateIndex: 0,
    before: { 1: item('true'), 0: item('true') },
    afterOn: { 1: item('true'), 0: item('true') },
    afterOff: { 1: item('true'), 0: item('false') },
    restored: { 1: item('true'), 0: item('true') },
    goldenTarget: true,
  })
  assert.equal(alias.status, capability.STATUS.PASS_COUPLED_PAIR)
  assert.equal(alias.aliasTarget, true)
  assert.equal(alias.safetyConfirmed, true)
})

test('V5 quarantines a target whose known original restore is not confirmed', () => {
  const result = capability.classifyMuteProbe({
    targetIndex: 0,
    before: { 0: item('false') },
    afterOn: { 0: item('true') },
    afterOff: { 0: item('false') },
    restored: { 0: item('true') },
    goldenTarget: false,
  })
  assert.equal(result.status, capability.STATUS.QUARANTINED_RESTORE)
})

test('V5 dependency decisions block only targets whose safety dependency is missing', () => {
  const results = new Map([
    ['a', { status: capability.STATUS.PASS_INDEPENDENT, safetyConfirmed: true }],
    ['b', { status: capability.STATUS.FAIL_NO_EFFECT, safetyConfirmed: false }],
  ])
  assert.equal(capability.dependencyDecision({ requiredTargets: ['a'], targetResults: results, requireSafetyConfirmed: true }).allowed, true)
  assert.equal(capability.dependencyDecision({ requiredTargets: ['a', 'b'], targetResults: results, requireSafetyConfirmed: true }).allowed, false)
})

test('V5 inventory cross-references hardware shape, variables and r9 feedback families', () => {
  const shape = { inputs: [0], outputs: [0], mixerSlots: [1], lanes: [] }
  const snapshot = { values: {
    input_1_nickname: item(''), output_1_mute: item('false'), output_1_source: item('100'),
    output_1_stereo: item('false'), output_1_nickname: item(''), output_1_gain: item('-12'),
    mixer_slot_1_source: item('100'), mixer_slot_1_stereo: item('false'),
  } }
  const inventory = capability.buildCapabilityInventory({
    model: 'Scarlett 18i20 (3rd Gen)', shape, snapshot, coreInitial: {},
    r9Probes: [{ definitionId: 'output_mute', options: { output: '0' } }],
    availabilityMap: new Map([[0, item('true')]]),
  })
  const mute = inventory.rows.find((row) => row.id === 'output:1:mute')
  assert.equal(mute.capability, true)
  assert.equal(mute.availability, 'AVAILABLE')
  assert.equal(mute.r9ProbeCount, 1)
})

test('V5 shareable report strips live state and nickname contents', () => {
  const { buildShareablePayload } = require('../testbench/FullTestBenchReportV4')
  const secretNickname = 'Scarlett18i20-PRIVATE-SERIAL-LIKE'
  const payload = buildShareablePayload({
    rows: [{
      id: 'device:nickname', family: 'device_nickname', variable: 'device_nickname', availability: 'N/A',
      r9ProbeCount: 0, state: secretNickname, stateKnown: true, capability: true, risk: 'safe', dependency: '',
      status: capability.STATUS.PASS, detail: 'All transitions and restore server-confirmed.',
    }],
    meta: { model: 'Scarlett 18i20 (3rd Gen)', revision: 'test', signature: 'abc', privatePath: 'C:/private/user/path' },
  })
  const serialized = JSON.stringify(payload)
  assert.doesNotMatch(serialized, /PRIVATE-SERIAL-LIKE/)
  assert.equal(serialized.includes('privatePath'), false)
  assert.equal(serialized.includes('C:/private'), false)
  assert.doesNotMatch(serialized, /"state"/)
  assert.match(serialized, /shareable-sanitized/)
})

test('V5 adds isolated output-pair source A/B, None and restore harness ids', () => {
  const { pairBatchIds } = require('../testbench/FullTestBenchPairsV4')
  assert.deepEqual(pairBatchIds(10, 11), {
    test: 'v4-pair-11-12-source-test',
    alt: 'v4-pair-11-12-source-test-alt',
    none: 'v4-pair-11-12-source-none',
    restore: 'v4-pair-11-12-source-restore',
  })
})

test('V5 code never writes Focusrite protocol directly and keeps forbidden paths out of the harness', () => {
  const files = [
    'FullTestBenchCapabilityV4.js', 'FullTestBenchPageV4.js', 'FullTestBenchPageV4Pairs.js',
    'FullTestBenchV4Common.js', 'FullTestBenchCoreV4.js', 'FullTestBenchOutputsV4.js',
    'FullTestBenchPairsV4.js', 'FullTestBenchPairSafetyV5.js', 'FullTestBenchMixerV4.js', 'FullTestBenchMonitorV4.js',
    'FullTestBenchReportV4.js', 'FullTestBenchRunnerV4Preflight.js', 'FullTestBenchRunnerV4Campaign.js', 'FullTestBenchRunnerV4.js',
  ]
  const combined = files.map((name) => fs.readFileSync(path.join(root, 'testbench', name), 'utf8')).join('\n')
  assert.doesNotMatch(combined, /\.setItem\s*\(/)
  assert.doesNotMatch(combined, /<set\b/i)
  assert.doesNotMatch(combined, /monitor_gain_set|monitor_gain_adjust/)
  assert.match(combined, /BLOCKED_FORBIDDEN/)
  assert.match(combined, /PASS_COUPLED_PAIR/)
  assert.match(combined, /QUARANTINED_RESTORE/)
  assert.match(combined, /LATEST_SHAREABLE/)
  assert.match(combined, /passive-mute-confirmed/)
  assert.match(combined, /pair-source-none/)
})

test('FULL launcher target self-test runs the current pair-aware capability harness without hardware', () => {
  const runner = path.join(root, 'testbench', 'Focusrite_18i20_FullTestBench.js')
  const result = spawnSync(process.execPath, [runner, '--self-test'], {
    cwd: root,
    encoding: 'utf8',
    timeout: 30000,
  })
  assert.equal(result.status, 0, result.stderr || result.stdout)
  assert.match(result.stdout, /SELFTEST PASS/)
  assert.match(result.stdout, /full-v5-pair-aware-safety/)
})

'use strict'
const { laneBase } = require('./FullTestBenchAudit')
const { buildExtendedPageV4 } = require('./FullTestBenchPageV4')
const { augmentPairSourceHarness } = require('./FullTestBenchPageV4Pairs')
const { CAMPAIGN_REVISION, profileForModel } = require('./FullTestBenchCapabilityV4')

async function selfTestV4() {
  const shape = {
    inputs: Array.from({ length: 8 }, (_, i) => i),
    outputs: Array.from({ length: 26 }, (_, i) => i),
    mixerSlots: Array.from({ length: 24 }, (_, i) => i + 1),
    lanes: ['A', 'B', 'C', 'D', 'E', 'F'].flatMap((letter) => [{ mix: `Mix ${letter}`, side: 'left' }, { mix: `Mix ${letter}`, side: 'right' }]),
  }
  const values = {}
  for (const i of shape.inputs) values[`input_${i + 1}_nickname`] = { exists: true, value: '' }
  for (const o of shape.outputs) for (const [key, value] of Object.entries({ mute: '', source: '100', stereo: 'false', nickname: '', gain: '-12' })) values[`output_${o + 1}_${key}`] = { exists: true, value }
  for (const slot of shape.mixerSlots) {
    values[`mixer_slot_${slot}_source`] = { exists: true, value: '100' }
    values[`mixer_slot_${slot}_stereo`] = { exists: true, value: 'false' }
  }
  for (const lane of shape.lanes) {
    const base = laneBase(lane)
    values[`${base}_talkback`] = { exists: true, value: 'false' }
    for (let slot = 1; slot <= 24; slot++) for (const [key, value] of Object.entries({ mute: 'true', solo: 'false', gain: '-10', pan: '32768' })) values[`${base}_slot_${slot}_${key}`] = { exists: true, value }
  }
  Object.assign(values, {
    device_nickname: { exists: true, value: '' }, monitor_altEnable: { exists: true, value: 'false' }, monitor_alt: { exists: true, value: 'false' }, monitor_preset: { exists: true, value: '1-2' }, device_phantomPersistence: { exists: true, value: 'false' }, device_talkbackInputSource: { exists: true, value: 'Scarlett Internal Mic' },
  })
  const snapshot = { shape, values }
  let built = buildExtendedPageV4(snapshot, { primary: '100', secondary: '101' })
  built.testSources = { primary: '100', secondary: '101' }
  built = augmentPairSourceHarness(built, snapshot, profileForModel('Scarlett 18i20 (3rd Gen)'))
  if (!built.locations['v4-output-12-source-none'] || !built.locations['v4-output-26-gain-restore'] || !built.locations['v4-mixer-slot-24-stereo-restore']) throw new Error('V5 self-test missing isolated harness controls.')
  if (!built.locations['v4-pair-11-12-source-test'] || !built.locations['v4-pair-11-12-source-none'] || !built.locations['v4-pair-11-12-source-restore']) throw new Error('V5 self-test missing pair-aware source controls.')
  if (built.batches.length > 1200) throw new Error(`V5 harness unexpectedly large: ${built.batches.length} batches.`)
  console.log(`SELFTEST PASS - ${built.batches.length} V5 batches, revision ${CAMPAIGN_REVISION}, signature ${built.signature}`)
}

module.exports = { selfTestV4 }

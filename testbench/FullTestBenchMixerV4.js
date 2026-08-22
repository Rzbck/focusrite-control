'use strict'
const { canonicalBool } = require('./FullTestBenchBase')
const { laneBase } = require('./FullTestBenchAudit')
const { exactCheck, boolCheck, batchChecksForLane, verifyMany } = require('./FullTestBenchCorePhases')
const { line } = require('./FullTestBenchBase')
const { STATUS } = require('./FullTestBenchCapabilityV4')
const { pressBatch, isolatedCycle, progress } = require('./FullTestBenchV4Common')

async function testMixerSlots({
  baseUrl,
  label,
  pageNumber,
  built,
  snapshot,
  update,
  globalSafety = false,
  signalTestsAllowed = globalSafety,
  hardAbortOnRestoreFailure = false,
  observeVariable = null,
}) {
  const slots = snapshot.shape.mixerSlots
  for (let index = 0; index < slots.length; index++) {
    const slot = slots[index]
    progress('MIXER SLOTS', index + 1, slots.length, `Slot ${slot}`)
    for (const prop of ['source', 'stereo']) {
      const rowId = `mixer-slot:${slot}:${prop}`
      const variable = `mixer_slot_${slot}_${prop}`
      const item = snapshot.values[variable]
      if (!item?.exists) continue
      if (!signalTestsAllowed) {
        update(rowId, STATUS.BLOCKED_BY_SAFETY, 'Neither server-confirmed global safety nor explicit physical isolation is available.')
        continue
      }
      if (prop === 'source') {
        await isolatedCycle({
          baseUrl, label, pageNumber, built, rowId, update, phase: 'mixer-slots',
          hardAbortOnRestoreFailure, observeVariable,
          steps: [
            { batch: `v4-mixer-slot-${slot}-source-a`, check: exactCheck(variable, built.testSources.primary) },
            { batch: `v4-mixer-slot-${slot}-source-b`, check: exactCheck(variable, built.testSources.secondary) },
            { batch: `v4-mixer-slot-${slot}-source-a`, check: exactCheck(variable, built.testSources.primary) },
          ],
          restore: { batch: `v4-mixer-slot-${slot}-source-restore`, check: exactCheck(variable, item.value !== '' ? item.value : built.testSources.primary) },
        })
      } else {
        const restoreBool = canonicalBool(item.value) || 'false'
        await isolatedCycle({
          baseUrl, label, pageNumber, built, rowId, update, phase: 'mixer-slots',
          hardAbortOnRestoreFailure, observeVariable,
          steps: [
            { batch: `v4-mixer-slot-${slot}-stereo-off`, check: boolCheck(variable, 'false') },
            { batch: `v4-mixer-slot-${slot}-stereo-on`, check: boolCheck(variable, 'true') },
            { batch: `v4-mixer-slot-${slot}-stereo-off`, check: boolCheck(variable, 'false') },
          ],
          restore: { batch: `v4-mixer-slot-${slot}-stereo-restore`, check: boolCheck(variable, restoreBool) },
        })
      }
    }
  }
}

async function softLaneFamily({
  baseUrl,
  label,
  pageNumber,
  built,
  snapshot,
  lane,
  property,
  steps,
  restoreSteps,
  update,
  hardAbortOnRestoreFailure = false,
  observeVariables = null,
}) {
  const base = laneBase(lane)
  const laneId = `${lane.mix.toLowerCase().replace(/\s+/g, '-')}-${lane.side === 'left' ? 'l' : 'r'}`
  const variables = []
  for (let slot = 1; slot <= 24; slot++) {
    const variable = `${base}_slot_${slot}_${property}`
    if (snapshot.values[variable]?.exists) variables.push({ slot, variable })
  }
  const failures = new Set()
  for (const step of steps) {
    if (!built.locations[step.batch]) {
      for (const item of variables) failures.add(item.variable)
      break
    }
    try {
      await pressBatch(baseUrl, pageNumber, built, step.batch)
      const result = await verifyMany(baseUrl, label, step.checks, step.timeout || 8000)
      for (const item of result) if (!item.ok) failures.add(item.variable)
      if (observeVariables) await observeVariables(step.checks.map((check) => check.variable))
    } catch {
      for (const item of variables) failures.add(item.variable)
      break
    }
  }
  const restoreFailures = new Set()
  for (const restore of restoreSteps) {
    if (!built.locations[restore.batch]) continue
    try {
      await pressBatch(baseUrl, pageNumber, built, restore.batch)
      const result = await verifyMany(baseUrl, label, restore.checks, 9000)
      for (const item of result) if (!item.ok) restoreFailures.add(item.variable)
      if (observeVariables) await observeVariables(restore.checks.map((check) => check.variable))
    } catch {
      for (const item of variables) restoreFailures.add(item.variable)
    }
  }
  for (const { slot, variable } of variables) {
    const rowId = `mix:${laneId}:slot:${slot}:${property}`
    if (restoreFailures.has(variable)) update(rowId, STATUS.QUARANTINED_RESTORE, `${property} restoration/baseline not confirmed for this strip.`, 'mix-lanes')
    else if (failures.has(variable)) update(rowId, STATUS.FAIL_NO_EFFECT, `${property} test transition not fully confirmed; restore/baseline confirmed.`, 'mix-lanes')
    else update(rowId, STATUS.PASS, `${property} transitions + restore server-confirmed.`, 'mix-lanes')
  }
  if (hardAbortOnRestoreFailure && restoreFailures.size) {
    const first = [...restoreFailures][0]
    throw new Error(`RESTORE FAILED: ${laneId}:${property}; ${first} did not return to its baseline.`)
  }
}

async function testMixLanes({
  baseUrl,
  label,
  pageNumber,
  built,
  snapshot,
  update,
  globalSafety = false,
  signalTestsAllowed = globalSafety,
  hardAbortOnRestoreFailure = false,
  observeVariable = null,
  observeVariables = null,
}) {
  if (!signalTestsAllowed) {
    for (const row of snapshot.shape.lanes.flatMap((lane) => {
      const side = lane.side === 'left' ? 'l' : 'r'
      const laneId = `${lane.mix.toLowerCase().replace(/\s+/g, '-')}-${side}`
      const ids = [`mix:${laneId}:talkback`]
      for (let slot = 1; slot <= 24; slot++) for (const prop of ['mute', 'solo', 'gain', 'pan']) ids.push(`mix:${laneId}:slot:${slot}:${prop}`)
      return ids
    })) update(row, STATUS.BLOCKED_BY_SAFETY, 'Mixer signal-path tests require server-confirmed global safety or explicit physical isolation.', 'mix-lanes')
    return
  }

  const lanes = snapshot.shape.lanes
  for (let laneIndex = 0; laneIndex < lanes.length; laneIndex++) {
    const lane = lanes[laneIndex]
    const laneBatch = `${lane.mix.replace(/\s+/g, '').toLowerCase()}-${lane.side[0]}`
    progress('MIXER LANES', laneIndex + 1, lanes.length, `${lane.mix} ${lane.side}`)
    line('INFO', 'Capability lane', `${lane.mix} ${lane.side}`)
    await softLaneFamily({
      baseUrl, label, pageNumber, built, snapshot, lane, property: 'mute', update,
      hardAbortOnRestoreFailure, observeVariables,
      steps: [
        { batch: `${laneBatch}-mute-on`, checks: batchChecksForLane(snapshot, lane, { property: 'mute', kind: 'bool', value: 'true' }) },
        { batch: `${laneBatch}-mute-off`, checks: batchChecksForLane(snapshot, lane, { property: 'mute', kind: 'bool', value: 'false' }) },
        { batch: `${laneBatch}-mute-on`, checks: batchChecksForLane(snapshot, lane, { property: 'mute', kind: 'bool', value: 'true' }) },
      ],
      restoreSteps: [{ batch: `${laneBatch}-mute-restore`, checks: batchChecksForLane(snapshot, lane, { property: 'mute', kind: 'bool', restore: true }) }],
    })
    await softLaneFamily({
      baseUrl, label, pageNumber, built, snapshot, lane, property: 'solo', update,
      hardAbortOnRestoreFailure, observeVariables,
      steps: [
        { batch: `${laneBatch}-solo-off`, checks: batchChecksForLane(snapshot, lane, { property: 'solo', kind: 'bool', value: 'false' }) },
        { batch: `${laneBatch}-solo-on`, checks: batchChecksForLane(snapshot, lane, { property: 'solo', kind: 'bool', value: 'true' }) },
        { batch: `${laneBatch}-solo-off`, checks: batchChecksForLane(snapshot, lane, { property: 'solo', kind: 'bool', value: 'false' }) },
      ],
      restoreSteps: [{ batch: `${laneBatch}-solo-restore`, checks: batchChecksForLane(snapshot, lane, { property: 'solo', kind: 'bool', restore: true }) }],
    })
    await softLaneFamily({
      baseUrl, label, pageNumber, built, snapshot, lane, property: 'gain', update,
      hardAbortOnRestoreFailure, observeVariables,
      steps: [
        { batch: `${laneBatch}-gain-set`, checks: batchChecksForLane(snapshot, lane, { property: 'gain', kind: 'exact', value: '-128' }) },
        { batch: `v2-${laneBatch}-gain-prime`, checks: batchChecksForLane(snapshot, lane, { property: 'gain', kind: 'exact', value: '-127' }) },
        { batch: `${laneBatch}-gain-set`, checks: batchChecksForLane(snapshot, lane, { property: 'gain', kind: 'exact', value: '-128' }) },
        { batch: `${laneBatch}-gain-adjust`, checks: batchChecksForLane(snapshot, lane, { property: 'gain', kind: 'exact', value: '-127' }) },
      ],
      restoreSteps: [
        { batch: `${laneBatch}-gain-set`, checks: batchChecksForLane(snapshot, lane, { property: 'gain', kind: 'exact', value: '-128' }) },
        { batch: `${laneBatch}-gain-restore`, checks: batchChecksForLane(snapshot, lane, { property: 'gain', kind: 'exact', restore: true }) },
      ],
    })
    await softLaneFamily({
      baseUrl, label, pageNumber, built, snapshot, lane, property: 'pan', update,
      hardAbortOnRestoreFailure, observeVariables,
      steps: [
        { batch: `${laneBatch}-pan-center`, checks: batchChecksForLane(snapshot, lane, { property: 'pan', kind: 'exact', value: 0 }) },
        { batch: `${laneBatch}-pan-right`, checks: batchChecksForLane(snapshot, lane, { property: 'pan', kind: 'exact', value: 25 }) },
        { batch: `${laneBatch}-pan-center`, checks: batchChecksForLane(snapshot, lane, { property: 'pan', kind: 'exact', value: 0 }) },
      ],
      restoreSteps: [
        { batch: `${laneBatch}-pan-center`, checks: batchChecksForLane(snapshot, lane, { property: 'pan', kind: 'exact', value: 0 }) },
        { batch: `${laneBatch}-pan-restore`, checks: batchChecksForLane(snapshot, lane, { property: 'pan', kind: 'exact', restore: true }) },
      ],
    })
    const tbVar = `${laneBase(lane)}_talkback`
    if (snapshot.values[tbVar]?.exists) {
      const side = lane.side === 'left' ? 'l' : 'r'
      const rowId = `mix:${lane.mix.toLowerCase().replace(/\s+/g, '-')}-${side}:talkback`
      const restoreBool = canonicalBool(snapshot.values[tbVar].value) || 'false'
      await isolatedCycle({
        baseUrl, label, pageNumber, built, rowId, update, phase: 'mix-lanes',
        hardAbortOnRestoreFailure, observeVariable,
        steps: [
          { batch: `${laneBatch}-talkback-off`, check: boolCheck(tbVar, 'false') },
          { batch: `${laneBatch}-talkback-on`, check: boolCheck(tbVar, 'true') },
          { batch: `${laneBatch}-talkback-off`, check: boolCheck(tbVar, 'false') },
        ],
        restore: { batch: `${laneBatch}-talkback-restore`, check: boolCheck(tbVar, restoreBool) },
      })
    }
  }
}

module.exports = { testMixerSlots, testMixLanes }

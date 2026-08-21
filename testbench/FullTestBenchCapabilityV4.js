'use strict'

const CAMPAIGN_REVISION = 'full-v4-capability-lab-20260821'

const STATUS = Object.freeze({
  PASS: 'PASS',
  PASS_INDEPENDENT: 'PASS_INDEPENDENT',
  PASS_COUPLED_PAIR: 'PASS_COUPLED_PAIR',
  PASS_BASELINE: 'PASS_BASELINE',
  EVAL_ONLY: 'EVAL_ONLY',
  SKIP_UNAVAILABLE: 'SKIP_UNAVAILABLE',
  SKIP_AVAILABILITY_UNKNOWN: 'SKIP_AVAILABILITY_UNKNOWN',
  SKIP_NO_CAPABILITY: 'SKIP_NO_CAPABILITY',
  SKIP_NO_HARNESS: 'SKIP_NO_HARNESS',
  BLOCKED_BY_SAFETY: 'BLOCKED_BY_SAFETY',
  FAIL_NO_EFFECT: 'FAIL_NO_EFFECT',
  FAIL_MISMATCH: 'FAIL_MISMATCH',
  QUARANTINED_RESTORE: 'QUARANTINED_RESTORE',
})

const MODEL_PROFILES = Object.freeze({
  'Scarlett 18i20 (3rd Gen)': Object.freeze({
    model: 'Scarlett 18i20 (3rd Gen)',
    outputPairs: Object.freeze([
      [0, 1], [2, 3], [4, 5], [6, 7], [8, 9], [10, 11], [12, 13],
      [14, 15], [16, 17], [18, 19], [20, 21], [22, 23], [24, 25],
    ]),
    supportedShape: Object.freeze({ inputs: 8, outputs: 26, mixerSlots: 24, mixLanes: 12 }),
  }),
})

function profileForModel(model) {
  const profile = MODEL_PROFILES[model]
  if (!profile) throw new Error(`No hardware-tested capability profile exists for ${model}.`)
  return profile
}

function canonicalBool(value) {
  const raw = String(value ?? '').trim().toLowerCase()
  if (['true', 'on', '1'].includes(raw)) return true
  if (['false', 'off', '0'].includes(raw)) return false
  return null
}

function pairForOutput(profile, outputIndex) {
  const pair = profile.outputPairs.find(([left, right]) => left === outputIndex || right === outputIndex)
  return pair ? [...pair] : null
}

function probeKey(probe) {
  const options = probe?.options || {}
  const optionPart = Object.keys(options)
    .sort()
    .map((key) => `${key}=${String(options[key])}`)
    .join('&')
  return `${String(probe?.definitionId || '')}?${optionPart}`
}

function buildR9Coverage(probes) {
  const byKey = new Map()
  const byDefinition = new Map()
  for (const probe of probes || []) {
    const key = probeKey(probe)
    byKey.set(key, (byKey.get(key) || 0) + 1)
    byDefinition.set(probe.definitionId, (byDefinition.get(probe.definitionId) || 0) + 1)
  }
  return { byKey, byDefinition, total: (probes || []).length }
}

function availabilityStatus(item) {
  if (!item || item.exists === false) return 'NO_FLAG'
  const value = canonicalBool(item.value)
  if (value === true) return 'AVAILABLE'
  if (value === false) return 'UNAVAILABLE'
  return 'UNKNOWN'
}

function classifyOutputEligibility(shape, availabilityMap) {
  const rows = []
  for (const output of shape.outputs || []) {
    const item = availabilityMap instanceof Map ? availabilityMap.get(output) : availabilityMap?.[output]
    const availability = availabilityStatus(item)
    const eligible = availability === 'AVAILABLE' || availability === 'NO_FLAG'
    const status = availability === 'UNAVAILABLE'
      ? STATUS.SKIP_UNAVAILABLE
      : availability === 'UNKNOWN'
        ? STATUS.SKIP_AVAILABILITY_UNKNOWN
        : 'ELIGIBLE'
    rows.push({ output, availability, eligible, status })
  }
  return rows
}

function observeBool(item) {
  if (!item || item.exists === false) return { observable: false, value: null }
  const value = canonicalBool(item.value)
  return { observable: value !== null, value }
}

function changed(before, after) {
  if (!before.observable || !after.observable) return null
  return before.value !== after.value
}

function classifyMuteProbe({ targetIndex, mateIndex = null, before = {}, afterOn = {}, afterOff = {}, restored = {}, goldenTarget = null }) {
  const targetKey = String(targetIndex)
  const mateKey = mateIndex === null ? null : String(mateIndex)
  const t0 = observeBool(before[targetKey])
  const tOn = observeBool(afterOn[targetKey])
  const tOff = observeBool(afterOff[targetKey])
  const tRestore = observeBool(restored[targetKey])
  const m0 = mateKey === null ? { observable: false, value: null } : observeBool(before[mateKey])
  const mOn = mateKey === null ? { observable: false, value: null } : observeBool(afterOn[mateKey])
  const mOff = mateKey === null ? { observable: false, value: null } : observeBool(afterOff[mateKey])

  const restoreExpected = goldenTarget === null ? null : Boolean(goldenTarget)
  const restoreOk = restoreExpected === null ? tRestore.observable : tRestore.observable && tRestore.value === restoreExpected
  if (restoreExpected !== null && !restoreOk) {
    return {
      status: STATUS.QUARANTINED_RESTORE,
      safetyConfirmed: tOn.observable && tOn.value === true,
      coupled: false,
      detail: `target=${targetIndex}; restore expected=${restoreExpected}; observed=${tRestore.observable ? tRestore.value : 'unknown'}`,
    }
  }

  const targetCycle = tOn.observable && tOn.value === true && tOff.observable && tOff.value === false
  const mateCycle = mateIndex !== null && mOn.observable && mOff.observable && changed(m0, mOn) === true && changed(mOn, mOff) === true
  if (targetCycle && mateCycle) {
    return {
      status: STATUS.PASS_COUPLED_PAIR,
      safetyConfirmed: true,
      coupled: true,
      detail: `output ${targetIndex + 1} and mate ${mateIndex + 1} changed together`,
    }
  }
  if (targetCycle) {
    return {
      status: STATUS.PASS_INDEPENDENT,
      safetyConfirmed: true,
      coupled: false,
      detail: `output ${targetIndex + 1} confirmed ON -> OFF; mate did not track as a coupled pair`,
    }
  }

  if (!tOn.observable && !tOff.observable) {
    const mateShowsCycle = mateIndex !== null && mOn.observable && mOn.value === true && mOff.observable && mOff.value === false
    return {
      status: mateShowsCycle ? STATUS.PASS_COUPLED_PAIR : STATUS.FAIL_NO_EFFECT,
      safetyConfirmed: mateShowsCycle,
      coupled: mateShowsCycle,
      detail: mateShowsCycle
        ? `target state unobservable; mate ${mateIndex + 1} tracks target action as pair/alias`
        : `target output ${targetIndex + 1} produced no independently observable mute cycle`,
    }
  }

  return {
    status: STATUS.FAIL_MISMATCH,
    safetyConfirmed: tOn.observable && tOn.value === true,
    coupled: false,
    detail: `target output ${targetIndex + 1} did not produce the expected ON/OFF observations`,
  }
}

function dependencyDecision({ requiredTargets = [], targetResults = new Map(), requireSafetyConfirmed = false }) {
  const blocked = []
  for (const target of requiredTargets) {
    const result = targetResults instanceof Map ? targetResults.get(target) : targetResults[target]
    if (!result) {
      blocked.push({ target, reason: 'missing-result' })
      continue
    }
    if (requireSafetyConfirmed && result.safetyConfirmed !== true) {
      blocked.push({ target, reason: result.status || 'safety-unconfirmed' })
    }
  }
  return { allowed: blocked.length === 0, blocked }
}

function summarizeRows(rows) {
  const summary = {}
  for (const row of rows || []) summary[row.status] = (summary[row.status] || 0) + 1
  return summary
}

function inventoryRow({ id, family, variable = '', availability = 'N/A', r9ProbeCount = 0, state = '', stateKnown = false, capability = true, risk = 'safe', dependency = '' }) {
  return { id, family, variable, availability, r9ProbeCount, state, stateKnown, capability, risk, dependency, status: capability ? 'DISCOVERED' : STATUS.SKIP_NO_CAPABILITY, detail: '' }
}

function buildCapabilityInventory({ model, shape, snapshot = { values: {} }, coreInitial = {}, r9Probes = [], availabilityMap = new Map() }) {
  const profile = profileForModel(model)
  const r9 = buildR9Coverage(r9Probes)
  const rows = []
  const values = snapshot.values || {}
  const avail = classifyOutputEligibility(shape, availabilityMap)
  const availabilityByOutput = new Map(avail.map((item) => [item.output, item]))

  const add = (row) => rows.push(inventoryRow(row))
  for (const i of shape.inputs || []) {
    for (const [definitionId, prop, risk] of [['input_air', 'air', 'safe'], ['input_pad', 'pad', 'safe'], ['input_mode', 'mode', 'safe']]) {
      const variable = `input_${i + 1}_${prop}`
      const item = coreInitial[variable] || values[variable]
      add({ id: `input:${i + 1}:${prop}`, family: definitionId, variable, r9ProbeCount: r9.byDefinition.get(definitionId) || 0, state: item?.value || '', stateKnown: Boolean(item?.exists && item.value !== ''), risk })
    }
    const nick = values[`input_${i + 1}_nickname`]
    add({ id: `input:${i + 1}:nickname`, family: 'input_nickname', variable: `input_${i + 1}_nickname`, r9ProbeCount: r9.byDefinition.get('input_nickname') || 0, state: nick?.value || '', stateKnown: Boolean(nick?.exists), risk: 'safe' })
  }

  for (const o of shape.outputs || []) {
    const eligibility = availabilityByOutput.get(o)
    for (const [family, prop, risk] of [
      ['output_mute', 'mute', 'safe'], ['output_source', 'source', 'routing'], ['output_stereo', 'stereo', 'routing'],
      ['output_nickname', 'nickname', 'safe'], ['output_gain_set', 'gain', 'level'],
    ]) {
      const variable = `output_${o + 1}_${prop}`
      const item = values[variable]
      add({
        id: `output:${o + 1}:${prop}`,
        family,
        variable,
        availability: eligibility?.availability || 'UNKNOWN',
        r9ProbeCount: r9.byDefinition.get(family === 'output_gain_set' ? 'output_meter' : family) || 0,
        state: item?.value || '',
        stateKnown: Boolean(item?.exists && item.value !== ''),
        capability: Boolean(item?.exists),
        risk,
        dependency: ['source', 'stereo', 'gain'].includes(prop) ? `output:${o + 1}:mute-safe` : '',
      })
    }
  }

  for (const slot of shape.mixerSlots || []) {
    for (const [family, prop] of [['mixer_slot_source', 'source'], ['mixer_slot_stereo', 'stereo']]) {
      const variable = `mixer_slot_${slot}_${prop}`
      const item = values[variable]
      add({ id: `mixer-slot:${slot}:${prop}`, family, variable, r9ProbeCount: r9.byDefinition.get(family) || 0, state: item?.value || '', stateKnown: Boolean(item?.exists && item.value !== ''), capability: Boolean(item?.exists), risk: 'routing', dependency: 'global-output-safety' })
    }
  }

  for (const lane of shape.lanes || []) {
    const side = lane.side === 'left' ? 'l' : 'r'
    const laneId = `${String(lane.mix).toLowerCase().replace(/\s+/g, '-')}-${side}`
    const base = `mix_${String(lane.mix).toLowerCase().replace(/\s+/g, '_')}_${side}`
    const talkback = values[`${base}_talkback`]
    add({ id: `mix:${laneId}:talkback`, family: 'mix_talkback', variable: `${base}_talkback`, r9ProbeCount: r9.byDefinition.get('mix_talkback') || 0, state: talkback?.value || '', stateKnown: Boolean(talkback?.exists && talkback.value !== ''), capability: Boolean(talkback?.exists), risk: 'routing', dependency: 'global-output-safety' })
    for (let slot = 1; slot <= 24; slot++) {
      for (const [family, prop, risk] of [['mix_mute', 'mute', 'routing'], ['mix_solo', 'solo', 'routing'], ['mix_gain_set', 'gain', 'level'], ['mix_pan', 'pan', 'routing']]) {
        const variable = `${base}_slot_${slot}_${prop}`
        const item = values[variable]
        add({ id: `mix:${laneId}:slot:${slot}:${prop}`, family, variable, r9ProbeCount: r9.byDefinition.get(family === 'mix_gain_set' ? 'mix_mute' : family) || 0, state: item?.value || '', stateKnown: Boolean(item?.exists && item.value !== ''), capability: Boolean(item?.exists), risk, dependency: 'global-output-safety' })
      }
    }
  }

  const monitorDefs = [
    ['monitor:mute', 'monitor_mute', 'monitor_mute', 'safe', ''],
    ['monitor:dim', 'monitor_dim', 'monitor_dim', 'routing', 'global-output-safety'],
    ['monitor:talkback', 'monitor_talkback', 'monitor_talkback', 'routing', 'global-output-safety'],
    ['monitor:alt-enable', 'monitor_alt_enable', 'monitor_altEnable', 'routing', 'global-output-safety'],
    ['monitor:alt', 'monitor_alt', 'monitor_alt', 'routing', 'global-output-safety'],
    ['monitor:preset', 'monitor_preset', 'monitor_preset', 'routing', 'global-output-safety'],
    ['setting:phantom-persistence', 'phantom_persistence', 'device_phantomPersistence', 'safe', ''],
    ['setting:talkback-source', 'talkback_source', 'device_talkbackInputSource', 'routing', 'global-output-safety'],
    ['device:nickname', 'device_nickname', 'device_nickname', 'safe', ''],
  ]
  for (const [id, family, variable, risk, dependency] of monitorDefs) {
    const item = coreInitial[variable] || values[variable]
    add({ id, family, variable, r9ProbeCount: r9.byDefinition.get(family) || 0, state: item?.value || '', stateKnown: Boolean(item?.exists && item.value !== ''), capability: Boolean(item?.exists), risk, dependency })
  }

  return { profile, rows, r9Coverage: r9, outputEligibility: avail }
}

module.exports = {
  CAMPAIGN_REVISION,
  STATUS,
  MODEL_PROFILES,
  profileForModel,
  canonicalBool,
  pairForOutput,
  probeKey,
  buildR9Coverage,
  availabilityStatus,
  classifyOutputEligibility,
  classifyMuteProbe,
  dependencyDecision,
  summarizeRows,
  buildCapabilityInventory,
}

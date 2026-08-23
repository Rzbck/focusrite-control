'use strict'
const { canonicalBool, readVariableOptional } = require('./FullTestBenchBase')
const { verifyMany, exactCheck, boolCheck, numericCheck } = require('./FullTestBenchCorePhases')
const { STATUS, pairForOutput, classifyMuteProbe } = require('./FullTestBenchCapabilityV4')
const { pressBatch, sampleBoolVariables, settleAndSample, isolatedCycle, progress } = require('./FullTestBenchV4Common')
const { isPairOwnedRight } = require('./FullTestBenchOwnershipV7')

function muteRestoreFailure({ output, mate, before, restored, goldenBool }) {
  const targetExpected = goldenBool ? 'true' : 'false'
  const targetActual = canonicalBool(restored[String(output)]?.value)
  if (targetActual !== targetExpected) {
    return `target mute restore expected=${targetExpected} observed=${targetActual || 'unknown'}`
  }
  if (mate !== null) {
    const mateBefore = canonicalBool(before[String(mate)]?.value)
    if (mateBefore !== null) {
      const mateAfter = canonicalBool(restored[String(mate)]?.value)
      if (mateAfter !== mateBefore) {
        return `mate mute restore expected=${mateBefore} observed=${mateAfter || 'unknown'}`
      }
    }
  }
  return ''
}

function shouldSkipMuteProbeForUnknownBaseline(item, hardAbortOnRestoreFailure) {
  return hardAbortOnRestoreFailure && canonicalBool(item?.value) === null
}

function directSourceChecks(snapshot, pairOwnership, output, targetExpected) {
  const checks = [exactCheck(`output_${output + 1}_source`, targetExpected)]
  const ownership = pairOwnership?.get(output)
  if (ownership?.role !== 'pair-owner-left') return checks
  const mate = ownership.mate
  const mateSource = snapshot.values[`output_${mate + 1}_source`]
  if (mateSource?.exists && mateSource.value !== '') {
    checks.push(exactCheck(`output_${mate + 1}_source`, mateSource.value))
  }
  return checks
}

function stereoPairWriteSafety(snapshot, pairOwnership, output) {
  const ownership = pairOwnership?.get(output)
  if (ownership?.role !== 'pair-owner-left') return { safe: true, reason: '' }

  const targetVariable = `output_${output + 1}_stereo`
  const mateVariable = `output_${ownership.mate + 1}_stereo`
  const target = canonicalBool(snapshot.values[targetVariable]?.value)
  const mate = canonicalBool(snapshot.values[mateVariable]?.value)
  if (target === null || mate === null) {
    return {
      safe: false,
      reason: 'Stereo pair baseline is not fully server-confirmed; no pair-owner stereo write is allowed.',
    }
  }
  if (mate === 'true') {
    return {
      safe: false,
      reason: `Captured stereo pair vector is ${target}/${mate}; hardware evidence has not proven that the pair-owner action can reconstruct a pair-owned right-member=true baseline, so no stereo write is attempted.`,
    }
  }
  return { safe: true, reason: '', target, mate }
}

async function probeOutputMutes({
  baseUrl,
  label,
  pageNumber,
  built,
  snapshot,
  outputEligibility,
  profile,
  update,
  reporter,
  hardAbortOnRestoreFailure = false,
  observeVariable = null,
}) {
  const results = new Map()
  const eligibility = new Map(outputEligibility.map((row) => [row.output, row]))
  const outputs = snapshot.shape.outputs
  for (let index = 0; index < outputs.length; index++) {
    const output = outputs[index]
    const n = output + 1
    progress('OUTPUT MUTE', index + 1, outputs.length, `Out ${n}`)
    const rowId = `output:${n}:mute`
    const variable = `output_${n}_mute`
    const item = snapshot.values[variable]
    const state = eligibility.get(output)
    if (!item?.exists) {
      const result = { status: STATUS.SKIP_NO_CAPABILITY, safetyConfirmed: false }
      results.set(output, result)
      update(rowId, result.status, 'No output mute variable/capability is exposed.')
      continue
    }
    if (state?.availability === 'UNAVAILABLE') {
      const result = { status: STATUS.SKIP_UNAVAILABLE, safetyConfirmed: true, unavailable: true }
      results.set(output, result)
      update(rowId, result.status, 'Output is server-confirmed unavailable; no mute write attempted.')
      continue
    }
    if (state?.availability === 'UNKNOWN') {
      const result = { status: STATUS.SKIP_AVAILABILITY_UNKNOWN, safetyConfirmed: false }
      results.set(output, result)
      update(rowId, result.status, 'Availability flag exists but has no confirmed value; normal mute cycle skipped.')
      continue
    }
    const onBatch = `v2-output-${n}-mute-on`
    const offBatch = `v2-output-${n}-mute-off`
    if (!built.locations[onBatch] || !built.locations[offBatch]) {
      const result = { status: STATUS.SKIP_NO_HARNESS, safetyConfirmed: false }
      results.set(output, result)
      update(rowId, result.status, 'Per-output mute harness actions are missing.')
      continue
    }

    const pair = pairForOutput(profile, output)
    const mate = pair ? pair.find((value) => value !== output) : null
    const variables = { [String(output)]: variable }
    if (mate !== null) variables[String(mate)] = `output_${mate + 1}_mute`
    const golden = canonicalBool(item.value)
    const baselineUnknown = golden === null
    if (shouldSkipMuteProbeForUnknownBaseline(item, hardAbortOnRestoreFailure)) {
      const result = {
        status: STATUS.EVAL_ONLY,
        safetyConfirmed: false,
        baselineUnknown: true,
        detail:
          'Initial output mute state is unknown; exact restoration is impossible under ALL_ISOLATED, so no mute write was attempted.',
      }
      results.set(output, result)
      update(rowId, result.status, result.detail, 'output-mute-probe')
      continue
    }
    const goldenBool = baselineUnknown ? true : golden === 'true'
    let before = {}
    let afterOn = {}
    let afterOff = {}
    let restored = {}
    try {
      before = await sampleBoolVariables(baseUrl, label, variables)
      await pressBatch(baseUrl, pageNumber, built, onBatch)
      afterOn = await settleAndSample(baseUrl, label, variables)
      if (observeVariable) await observeVariable(variable)
      await pressBatch(baseUrl, pageNumber, built, offBatch)
      afterOff = await settleAndSample(baseUrl, label, variables)
      if (observeVariable) await observeVariable(variable)
    } catch (error) {
      reporter.add('output-mute-probe', rowId, STATUS.FAIL_NO_EFFECT, error.message)
    } finally {
      try {
        await pressBatch(baseUrl, pageNumber, built, goldenBool ? onBatch : offBatch)
        restored = await settleAndSample(baseUrl, label, variables)
        if (observeVariable) await observeVariable(variable)
      } catch (error) {
        restored = {}
        reporter.add('output-mute-probe', `${rowId}:restore`, STATUS.QUARANTINED_RESTORE, error.message)
      }
    }
    let result = classifyMuteProbe({
      targetIndex: output,
      mateIndex: mate,
      before,
      afterOn,
      afterOff,
      restored,
      goldenTarget: baselineUnknown ? null : goldenBool,
    })
    const restoreFailure = muteRestoreFailure({ output, mate, before, restored, goldenBool })
    if (restoreFailure) {
      result = {
        ...result,
        status: STATUS.QUARANTINED_RESTORE,
        detail: `${result.detail}; ${restoreFailure}`,
      }
    }
    if (baselineUnknown && [STATUS.PASS_INDEPENDENT, STATUS.PASS_COUPLED_PAIR].includes(result.status)) {
      result = { ...result, baselineUsed: true, detail: `${result.detail}; initial target state was unknown, protective Mute ON retained as documented baseline` }
    }
    if (result.status === STATUS.QUARANTINED_RESTORE || (!hardAbortOnRestoreFailure && result.safetyConfirmed !== true)) {
      try {
        await pressBatch(baseUrl, pageNumber, built, onBatch)
        const safe = await settleAndSample(baseUrl, label, { [String(output)]: variable })
        if (canonicalBool(safe[String(output)]?.value) === 'true') {
          result = { ...result, safetyConfirmed: true, detail: `${result.detail}; protective ON confirmed after quarantine` }
        }
      } catch {
        // Physical isolation or a later source guard may still contain the signal path.
      }
    }
    results.set(output, result)
    update(rowId, result.status, result.detail, 'output-mute-probe')
    if (hardAbortOnRestoreFailure && result.status === STATUS.QUARANTINED_RESTORE) {
      throw new Error(`RESTORE FAILED: ${rowId}; ${result.detail}`)
    }
  }
  return results
}

async function establishSourceNoneSafety({
  baseUrl,
  label,
  pageNumber,
  built,
  snapshot,
  outputEligibility,
  muteResults,
  update,
  pairOwnership = new Map(),
}) {
  const sourceSafety = new Map()
  const eligibility = new Map(outputEligibility.map((row) => [row.output, row]))
  const outputs = snapshot.shape.outputs
  for (let index = 0; index < outputs.length; index++) {
    const output = outputs[index]
    const n = output + 1
    progress('OUTPUT SAFETY', index + 1, outputs.length, `Out ${n}`)
    const eligibilityRow = eligibility.get(output)
    if (eligibilityRow?.availability === 'UNAVAILABLE') {
      sourceSafety.set(output, { safe: true, reason: 'unavailable' })
      continue
    }
    if (eligibilityRow?.availability === 'UNKNOWN') {
      const muteVariable = `output_${n}_mute`
      const liveMute = await readVariableOptional(baseUrl, label, muteVariable, 2500)
      if (liveMute.exists && canonicalBool(liveMute.value) === 'true') {
        sourceSafety.set(output, { safe: true, reason: 'passive-mute-confirmed' })
        update(`output:${n}:mute`, STATUS.SKIP_AVAILABILITY_UNKNOWN, 'Availability remains unknown so no write was attempted; existing server-confirmed Mute ON is accepted as a passive safety guard.', 'safety')
      } else {
        sourceSafety.set(output, { safe: false, reason: 'availability-unknown-and-not-passively-muted' })
      }
      continue
    }
    if (muteResults.get(output)?.safetyConfirmed === true) {
      sourceSafety.set(output, { safe: true, reason: muteResults.get(output)?.coupled ? 'pair-mute-confirmed' : 'mute-confirmed' })
      continue
    }
    if (isPairOwnedRight(pairOwnership, output)) {
      sourceSafety.set(output, { safe: false, reason: 'pair-owned-right-no-independent-source-guard' })
      continue
    }
    const variable = `output_${n}_source`
    if (!snapshot.values[variable]?.exists || !built.locations[`v4-output-${n}-source-none`]) {
      sourceSafety.set(output, { safe: false, reason: 'no-safe-source-guard' })
      continue
    }
    try {
      await pressBatch(baseUrl, pageNumber, built, `v4-output-${n}-source-none`)
      const result = await verifyMany(baseUrl, label, [exactCheck(variable, '0')], 6500)
      if (result[0]?.ok) {
        sourceSafety.set(output, { safe: true, reason: 'source-none', restoreNeeded: true })
        update(`output:${n}:source`, STATUS.PASS_BASELINE, 'Source=None retained temporarily as safety guard because mute could not be independently confirmed.', 'safety')
      } else sourceSafety.set(output, { safe: false, reason: 'source-none-unconfirmed' })
    } catch (error) {
      sourceSafety.set(output, { safe: false, reason: `source-none-error:${error.message}` })
    }
  }
  return sourceSafety
}

async function restoreSourceSafety({
  baseUrl,
  label,
  pageNumber,
  built,
  sourceSafety,
  snapshot,
  update,
  hardAbortOnRestoreFailure = false,
}) {
  for (const [output, safety] of sourceSafety.entries()) {
    if (!safety.restoreNeeded) continue
    const n = output + 1
    const batch = `v4-output-${n}-source-restore`
    const variable = `output_${n}_source`
    const expected = snapshot.values[variable]?.value !== '' ? snapshot.values[variable].value : '0'
    let restoreFailure = ''
    try {
      await pressBatch(baseUrl, pageNumber, built, batch)
      const result = await verifyMany(baseUrl, label, [exactCheck(variable, expected)], 7000)
      if (!result[0]?.ok) {
        await pressBatch(baseUrl, pageNumber, built, `v4-output-${n}-source-none`)
        restoreFailure = `Original source ${expected} not confirmed; Source=None retained as safe quarantine.`
      }
    } catch (error) {
      restoreFailure = `Source restore error: ${error.message}; safe Source=None may remain.`
    }
    if (restoreFailure) {
      update(`output:${n}:source`, STATUS.QUARANTINED_RESTORE, restoreFailure, 'restore')
      if (hardAbortOnRestoreFailure) throw new Error(`RESTORE FAILED: output:${n}:source; ${restoreFailure}`)
    }
  }
}

async function testMetadataTargets({
  baseUrl,
  label,
  pageNumber,
  built,
  snapshot,
  update,
  outputEligibility,
  hardAbortOnRestoreFailure = false,
  observeVariable = null,
}) {
  const total = snapshot.shape.inputs.length + snapshot.shape.outputs.length
  let progressIndex = 0
  for (const i of snapshot.shape.inputs) {
    const n = i + 1
    progress('METADATA', ++progressIndex, total, `Input ${n}`)
    const variable = `input_${n}_nickname`
    const item = snapshot.values[variable]
    if (!item?.exists) continue
    await isolatedCycle({
      baseUrl, label, pageNumber, built, rowId: `input:${n}:nickname`, update, phase: 'metadata',
      hardAbortOnRestoreFailure, observeVariable,
      steps: [
        { batch: `v4-input-${n}-nick-a`, check: exactCheck(variable, `V4_IN_${String(n).padStart(2, '0')}_A`) },
        { batch: `v4-input-${n}-nick-b`, check: exactCheck(variable, `V4_IN_${String(n).padStart(2, '0')}_B`) },
      ],
      restore: { batch: `v4-input-${n}-nick-restore`, check: exactCheck(variable, item.value) },
    })
  }
  const eligibility = new Map((outputEligibility || []).map((row) => [row.output, row]))
  for (const o of snapshot.shape.outputs) {
    const n = o + 1
    progress('METADATA', ++progressIndex, total, `Output ${n}`)
    const eligibilityRow = eligibility.get(o)
    if (eligibilityRow?.availability === 'UNAVAILABLE') { update(`output:${n}:nickname`, STATUS.SKIP_UNAVAILABLE, 'Output unavailable; nickname write skipped.', 'metadata'); continue }
    if (eligibilityRow?.availability === 'UNKNOWN') { update(`output:${n}:nickname`, STATUS.SKIP_AVAILABILITY_UNKNOWN, 'Output availability unknown; nickname write skipped.', 'metadata'); continue }
    const variable = `output_${n}_nickname`
    const item = snapshot.values[variable]
    if (!item?.exists) continue
    await isolatedCycle({
      baseUrl, label, pageNumber, built, rowId: `output:${n}:nickname`, update, phase: 'metadata',
      hardAbortOnRestoreFailure, observeVariable,
      steps: [
        { batch: `v4-output-${n}-nick-a`, check: exactCheck(variable, `V4_OUT_${String(n).padStart(2, '0')}_A`) },
        { batch: `v4-output-${n}-nick-b`, check: exactCheck(variable, `V4_OUT_${String(n).padStart(2, '0')}_B`) },
      ],
      restore: { batch: `v4-output-${n}-nick-restore`, check: exactCheck(variable, item.value) },
    })
  }
}

async function testOutputFamilies({
  baseUrl,
  label,
  pageNumber,
  built,
  snapshot,
  profile,
  muteResults,
  update,
  outputEligibility,
  pairOwnership = new Map(),
  isolationConfirmed = false,
  hardAbortOnRestoreFailure = false,
  observeVariable = null,
}) {
  const eligibility = new Map((outputEligibility || []).map((row) => [row.output, row]))
  const outputs = snapshot.shape.outputs
  for (let index = 0; index < outputs.length; index++) {
    const o = outputs[index]
    const eligibilityRow = eligibility.get(o)
    const n = o + 1
    progress('OUTPUT FAMILIES', index + 1, outputs.length, `Out ${n}`)
    const muteSafe = muteResults.get(o)?.safetyConfirmed === true
    const signalSafe = muteSafe || isolationConfirmed
    const pairOwnedRight = isPairOwnedRight(pairOwnership, o)
    const skipStatus = eligibilityRow?.availability === 'UNAVAILABLE' ? STATUS.SKIP_UNAVAILABLE : eligibilityRow?.availability === 'UNKNOWN' ? STATUS.SKIP_AVAILABILITY_UNKNOWN : null
    const source = snapshot.values[`output_${n}_source`]
    if (source?.exists) {
      if (skipStatus) update(`output:${n}:source`, skipStatus, `Output availability=${eligibilityRow.availability}; functional source test skipped.`)
      else if (pairOwnedRight) update(`output:${n}:source`, STATUS.PASS_BASELINE, 'Runtime pair topology proved this right-member source is pair-owned; direct source writes are intentionally skipped and pair behavior is covered by the topology sweep.', 'outputs')
      else if (!signalSafe) update(`output:${n}:source`, STATUS.BLOCKED_BY_SAFETY, 'Neither server-confirmed mute safety nor explicit physical isolation is available; source routing test skipped.')
      else {
        const original = source.value !== '' ? source.value : '0'
        await isolatedCycle({
          baseUrl, label, pageNumber, built, rowId: `output:${n}:source`, update, phase: 'outputs',
          hardAbortOnRestoreFailure, observeVariable,
          steps: [
            { batch: `v4-output-${n}-source-none`, check: directSourceChecks(snapshot, pairOwnership, o, '0') },
            { batch: `v4-output-${n}-source-test`, check: directSourceChecks(snapshot, pairOwnership, o, built.testSources.primary) },
            { batch: `v4-output-${n}-source-none`, check: directSourceChecks(snapshot, pairOwnership, o, '0') },
          ],
          restore: { batch: `v4-output-${n}-source-restore`, check: directSourceChecks(snapshot, pairOwnership, o, original) },
          safeFallback: { batch: `v4-output-${n}-source-none`, check: directSourceChecks(snapshot, pairOwnership, o, '0') },
        })
      }
    }
    const gain = snapshot.values[`output_${n}_gain`]
    if (gain?.exists) {
      if (skipStatus) update(`output:${n}:gain`, skipStatus, `Output availability=${eligibilityRow.availability}; functional gain test skipped.`)
      else if (!signalSafe) update(`output:${n}:gain`, STATUS.BLOCKED_BY_SAFETY, 'Neither output mute nor explicit physical isolation is confirmed; gain test skipped.')
      else await isolatedCycle({
        baseUrl, label, pageNumber, built, rowId: `output:${n}:gain`, update, phase: 'outputs',
        hardAbortOnRestoreFailure, observeVariable,
        steps: [
          { batch: `v4-output-${n}-gain-low`, check: numericCheck(`output_${n}_gain`, -128) },
          { batch: `v4-output-${n}-gain-prime`, check: numericCheck(`output_${n}_gain`, -127) },
          { batch: `v4-output-${n}-gain-low`, check: numericCheck(`output_${n}_gain`, -128) },
          { batch: `v4-output-${n}-gain-adjust`, check: numericCheck(`output_${n}_gain`, -127) },
        ],
        restore: { batch: `v4-output-${n}-gain-restore`, check: numericCheck(`output_${n}_gain`, gain.value !== '' && Number.isFinite(Number(gain.value)) ? Number(gain.value) : -128) },
        safeFallback: { batch: `v4-output-${n}-gain-low`, check: numericCheck(`output_${n}_gain`, -128) },
      })
    }
    const stereo = snapshot.values[`output_${n}_stereo`]
    if (stereo?.exists) {
      if (skipStatus) { update(`output:${n}:stereo`, skipStatus, `Output availability=${eligibilityRow.availability}; functional stereo test skipped.`); continue }
      if (pairOwnedRight) { update(`output:${n}:stereo`, STATUS.EVAL_ONLY, 'Runtime pair topology proved right-member pair ownership; direct right-member stereo writes are intentionally skipped and stereo-link ownership is exercised from the pair owner when its captured pair vector is known-restorable.', 'outputs'); continue }
      const pair = pairForOutput(profile, o) || [o]
      const pairSafe = isolationConfirmed || pair.every((member) => muteResults.get(member)?.safetyConfirmed === true)
      if (!pairSafe) update(`output:${n}:stereo`, STATUS.BLOCKED_BY_SAFETY, 'Stereo-link test requires either explicit physical isolation or mute safety for both members of the output pair.')
      else {
        const stereoSafety = stereoPairWriteSafety(snapshot, pairOwnership, o)
        if (!stereoSafety.safe) {
          update(`output:${n}:stereo`, STATUS.EVAL_ONLY, stereoSafety.reason, 'outputs')
          continue
        }
        const restoreBool = canonicalBool(stereo.value) || 'false'
        const restoreChecks = [boolCheck(`output_${n}_stereo`, restoreBool)]
        const ownership = pairOwnership.get(o)
        if (ownership?.role === 'pair-owner-left') {
          const mateVariable = `output_${ownership.mate + 1}_stereo`
          const mateStereo = snapshot.values[mateVariable]
          const mateRestore = canonicalBool(mateStereo?.value)
          if (mateStereo?.exists && mateRestore !== null) restoreChecks.push(boolCheck(mateVariable, mateRestore))
        }
        await isolatedCycle({
          baseUrl, label, pageNumber, built, rowId: `output:${n}:stereo`, update, phase: 'outputs',
          hardAbortOnRestoreFailure, observeVariable,
          steps: [
            { batch: `v4-output-${n}-stereo-off`, check: boolCheck(`output_${n}_stereo`, 'false') },
            { batch: `v4-output-${n}-stereo-on`, check: boolCheck(`output_${n}_stereo`, 'true') },
            { batch: `v4-output-${n}-stereo-off`, check: boolCheck(`output_${n}_stereo`, 'false') },
          ],
          restore: { batch: `v4-output-${n}-stereo-restore`, check: restoreChecks },
          safeFallback: { batch: `v4-output-${n}-stereo-off`, check: boolCheck(`output_${n}_stereo`, 'false') },
        })
      }
    }
  }
}

module.exports = {
  probeOutputMutes,
  establishSourceNoneSafety,
  restoreSourceSafety,
  testMetadataTargets,
  testOutputFamilies,
  muteRestoreFailure,
  shouldSkipMuteProbeForUnknownBaseline,
  directSourceChecks,
  stereoPairWriteSafety,
}

'use strict'
const { canonicalBool } = require('./FullTestBenchBase')
const { verifyMany, exactCheck, boolCheck, numericCheck } = require('./FullTestBenchCorePhases')
const { STATUS, pairForOutput, classifyMuteProbe } = require('./FullTestBenchCapabilityV4')
const { pressBatch, sampleBoolVariables, settleAndSample, isolatedCycle } = require('./FullTestBenchV4Common')
async function probeOutputMutes({ baseUrl, label, pageNumber, built, snapshot, outputEligibility, profile, update, reporter }) {
  const results = new Map()
  const eligibility = new Map(outputEligibility.map((row) => [row.output, row]))
  for (const output of snapshot.shape.outputs) {
    const n = output + 1
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
    const goldenBool = golden === null ? true : golden === 'true'
    let before = {}
    let afterOn = {}
    let afterOff = {}
    let restored = {}
    try {
      before = await sampleBoolVariables(baseUrl, label, variables)
      await pressBatch(baseUrl, pageNumber, built, onBatch)
      afterOn = await settleAndSample(baseUrl, label, variables)
      await pressBatch(baseUrl, pageNumber, built, offBatch)
      afterOff = await settleAndSample(baseUrl, label, variables)
    } catch (error) {
      reporter.add('output-mute-probe', rowId, STATUS.FAIL_NO_EFFECT, error.message)
    } finally {
      try {
        await pressBatch(baseUrl, pageNumber, built, goldenBool ? onBatch : offBatch)
        restored = await settleAndSample(baseUrl, label, variables)
      } catch (error) {
        restored = {}
        reporter.add('output-mute-probe', `${rowId}:restore`, STATUS.QUARANTINED_RESTORE, error.message)
      }
    }
    let result = classifyMuteProbe({ targetIndex: output, mateIndex: mate, before, afterOn, afterOff, restored, goldenTarget: goldenBool })
    if (result.status === STATUS.QUARANTINED_RESTORE || result.safetyConfirmed !== true) {
      try {
        await pressBatch(baseUrl, pageNumber, built, onBatch)
        const safe = await settleAndSample(baseUrl, label, { [String(output)]: variable })
        if (canonicalBool(safe[String(output)]?.value) === 'true') result = { ...result, safetyConfirmed: true, detail: `${result.detail}; protective ON confirmed after quarantine` }
      } catch {
        // A source=None guard may still make this output safe later.
      }
    }
    results.set(output, result)
    update(rowId, result.status, result.detail, 'output-mute-probe')
  }
  return results
}

async function establishSourceNoneSafety({ baseUrl, label, pageNumber, built, snapshot, outputEligibility, muteResults, update }) {
  const sourceSafety = new Map()
  const eligibility = new Map(outputEligibility.map((row) => [row.output, row]))
  for (const output of snapshot.shape.outputs) {
    const n = output + 1
    const eligibilityRow = eligibility.get(output)
    if (eligibilityRow?.availability === 'UNAVAILABLE') {
      sourceSafety.set(output, { safe: true, reason: 'unavailable' })
      continue
    }
    if (muteResults.get(output)?.safetyConfirmed === true) {
      sourceSafety.set(output, { safe: true, reason: 'mute-confirmed' })
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

async function restoreSourceSafety({ baseUrl, label, pageNumber, built, sourceSafety, snapshot, update }) {
  for (const [output, safety] of sourceSafety.entries()) {
    if (!safety.restoreNeeded) continue
    const n = output + 1
    const batch = `v4-output-${n}-source-restore`
    const variable = `output_${n}_source`
    const expected = snapshot.values[variable]?.value !== '' ? snapshot.values[variable].value : '0'
    try {
      await pressBatch(baseUrl, pageNumber, built, batch)
      const result = await verifyMany(baseUrl, label, [exactCheck(variable, expected)], 7000)
      if (!result[0]?.ok) {
        await pressBatch(baseUrl, pageNumber, built, `v4-output-${n}-source-none`)
        update(`output:${n}:source`, STATUS.QUARANTINED_RESTORE, `Original source ${expected} not confirmed; Source=None retained as safe quarantine.`, 'restore')
      }
    } catch (error) {
      update(`output:${n}:source`, STATUS.QUARANTINED_RESTORE, `Source restore error: ${error.message}; safe Source=None may remain.`, 'restore')
    }
  }
}

async function testMetadataTargets({ baseUrl, label, pageNumber, built, snapshot, update, outputEligibility }) {
  for (const i of snapshot.shape.inputs) {
    const n = i + 1
    const variable = `input_${n}_nickname`
    const item = snapshot.values[variable]
    if (!item?.exists) continue
    await isolatedCycle({
      baseUrl, label, pageNumber, built, rowId: `input:${n}:nickname`, update, phase: 'metadata',
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
    const eligibilityRow = eligibility.get(o)
    if (eligibilityRow?.availability === 'UNAVAILABLE') { update(`output:${n}:nickname`, STATUS.SKIP_UNAVAILABLE, 'Output unavailable; nickname write skipped.', 'metadata'); continue }
    if (eligibilityRow?.availability === 'UNKNOWN') { update(`output:${n}:nickname`, STATUS.SKIP_AVAILABILITY_UNKNOWN, 'Output availability unknown; nickname write skipped.', 'metadata'); continue }
    const variable = `output_${n}_nickname`
    const item = snapshot.values[variable]
    if (!item?.exists) continue
    await isolatedCycle({
      baseUrl, label, pageNumber, built, rowId: `output:${n}:nickname`, update, phase: 'metadata',
      steps: [
        { batch: `v4-output-${n}-nick-a`, check: exactCheck(variable, `V4_OUT_${String(n).padStart(2, '0')}_A`) },
        { batch: `v4-output-${n}-nick-b`, check: exactCheck(variable, `V4_OUT_${String(n).padStart(2, '0')}_B`) },
      ],
      restore: { batch: `v4-output-${n}-nick-restore`, check: exactCheck(variable, item.value) },
    })
  }
}

async function testOutputFamilies({ baseUrl, label, pageNumber, built, snapshot, profile, muteResults, update, outputEligibility }) {
  const eligibility = new Map((outputEligibility || []).map((row) => [row.output, row]))
  for (const o of snapshot.shape.outputs) {
    const eligibilityRow = eligibility.get(o)
    const n = o + 1
    const muteSafe = muteResults.get(o)?.safetyConfirmed === true
    const skipStatus = eligibilityRow?.availability === 'UNAVAILABLE' ? STATUS.SKIP_UNAVAILABLE : eligibilityRow?.availability === 'UNKNOWN' ? STATUS.SKIP_AVAILABILITY_UNKNOWN : null
    const source = snapshot.values[`output_${n}_source`]
    if (source?.exists) {
      if (skipStatus) update(`output:${n}:source`, skipStatus, `Output availability=${eligibilityRow.availability}; functional source test skipped.`)
      else if (!muteSafe) update(`output:${n}:source`, STATUS.BLOCKED_BY_SAFETY, 'Output mute is not independently/pair-confirmed; source routing test skipped.')
      else await isolatedCycle({
        baseUrl, label, pageNumber, built, rowId: `output:${n}:source`, update, phase: 'outputs',
        steps: [
          { batch: `v4-output-${n}-source-none`, check: exactCheck(`output_${n}_source`, '0') },
          { batch: `v4-output-${n}-source-test`, check: exactCheck(`output_${n}_source`, built.testSources.primary) },
          { batch: `v4-output-${n}-source-none`, check: exactCheck(`output_${n}_source`, '0') },
        ],
        restore: { batch: `v4-output-${n}-source-restore`, check: exactCheck(`output_${n}_source`, source.value !== '' ? source.value : '0') },
        safeFallback: { batch: `v4-output-${n}-source-none`, check: exactCheck(`output_${n}_source`, '0') },
      })
    }
    const gain = snapshot.values[`output_${n}_gain`]
    if (gain?.exists) {
      if (skipStatus) update(`output:${n}:gain`, skipStatus, `Output availability=${eligibilityRow.availability}; functional gain test skipped.`)
      else if (!muteSafe) update(`output:${n}:gain`, STATUS.BLOCKED_BY_SAFETY, 'Output mute not confirmed; gain test skipped.')
      else await isolatedCycle({
        baseUrl, label, pageNumber, built, rowId: `output:${n}:gain`, update, phase: 'outputs',
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
      const pair = pairForOutput(profile, o) || [o]
      const pairSafe = pair.every((member) => muteResults.get(member)?.safetyConfirmed === true)
      if (!pairSafe) update(`output:${n}:stereo`, STATUS.BLOCKED_BY_SAFETY, 'Stereo-link test requires mute safety for both members of the output pair.')
      else {
        const restoreBool = canonicalBool(stereo.value) || 'false'
        await isolatedCycle({
          baseUrl, label, pageNumber, built, rowId: `output:${n}:stereo`, update, phase: 'outputs',
          steps: [
            { batch: `v4-output-${n}-stereo-off`, check: boolCheck(`output_${n}_stereo`, 'false') },
            { batch: `v4-output-${n}-stereo-on`, check: boolCheck(`output_${n}_stereo`, 'true') },
            { batch: `v4-output-${n}-stereo-off`, check: boolCheck(`output_${n}_stereo`, 'false') },
          ],
          restore: { batch: `v4-output-${n}-stereo-restore`, check: boolCheck(`output_${n}_stereo`, restoreBool) },
          safeFallback: { batch: `v4-output-${n}-stereo-off`, check: boolCheck(`output_${n}_stereo`, 'false') },
        })
      }
    }
  }
}

module.exports = { probeOutputMutes, establishSourceNoneSafety, restoreSourceSafety, testMetadataTargets, testOutputFamilies }

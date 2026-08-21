'use strict'

const { exactCheck, verifyMany } = require('./FullTestBenchCorePhases')
const { STATUS, pairForOutput } = require('./FullTestBenchCapabilityV4')
const { pressBatch } = require('./FullTestBenchV4Common')

function addPairInventoryRows(inventory, snapshot, profile) {
  const existing = new Set(inventory.rows.map((row) => row.id))
  for (const [left, right] of profile.outputPairs) {
    if (!snapshot.shape.outputs.includes(left) || !snapshot.shape.outputs.includes(right)) continue
    const id = `output-pair:${left + 1}-${right + 1}:source`
    if (existing.has(id)) continue
    const leftSource = snapshot.values[`output_${left + 1}_source`]
    const rightSource = snapshot.values[`output_${right + 1}_source`]
    inventory.rows.push({
      id,
      family: 'output_pair_source',
      variable: `output_${left + 1}_source + output_${right + 1}_source`,
      availability: 'PAIR',
      r9ProbeCount: 0,
      state: '',
      stateKnown: Boolean(leftSource?.value !== '' && rightSource?.value !== ''),
      capability: Boolean(leftSource?.exists && rightSource?.exists),
      risk: 'routing',
      dependency: `output:${left + 1}:mute-safe + output:${right + 1}:mute-safe`,
      status: leftSource?.exists && rightSource?.exists ? 'DISCOVERED' : STATUS.SKIP_NO_CAPABILITY,
      detail: '',
    })
  }
}

function pairBatchIds(left, right) {
  const stem = `v4-pair-${left + 1}-${right + 1}-source`
  return { test: `${stem}-test`, none: `${stem}-none` }
}

async function testOutputPairSource({ baseUrl, label, pageNumber, built, snapshot, profile, muteResults, outputEligibility, update }) {
  const eligibility = new Map((outputEligibility || []).map((row) => [row.output, row]))
  for (const [left, right] of profile.outputPairs) {
    if (!snapshot.shape.outputs.includes(left) || !snapshot.shape.outputs.includes(right)) continue
    const rowId = `output-pair:${left + 1}-${right + 1}:source`
    const leftSource = snapshot.values[`output_${left + 1}_source`]
    const rightSource = snapshot.values[`output_${right + 1}_source`]
    if (!leftSource?.exists || !rightSource?.exists) {
      update(rowId, STATUS.SKIP_NO_CAPABILITY, 'Both pair members do not expose output source control.', 'output-pairs')
      continue
    }
    const leftAvail = eligibility.get(left)?.availability
    const rightAvail = eligibility.get(right)?.availability
    if (leftAvail === 'UNAVAILABLE' || rightAvail === 'UNAVAILABLE') {
      update(rowId, STATUS.SKIP_UNAVAILABLE, `Pair availability is ${leftAvail}/${rightAvail}; pair-source write skipped.`, 'output-pairs')
      continue
    }
    if (leftAvail === 'UNKNOWN' || rightAvail === 'UNKNOWN') {
      update(rowId, STATUS.SKIP_AVAILABILITY_UNKNOWN, `Pair availability is ${leftAvail}/${rightAvail}; pair-source write skipped.`, 'output-pairs')
      continue
    }
    if (muteResults.get(left)?.safetyConfirmed !== true || muteResults.get(right)?.safetyConfirmed !== true) {
      update(rowId, STATUS.BLOCKED_BY_SAFETY, 'Both pair members must have confirmed mute safety before pair-source routing.', 'output-pairs')
      continue
    }
    const batches = pairBatchIds(left, right)
    if (!built.locations[batches.test] || !built.locations[batches.none]) {
      update(rowId, STATUS.SKIP_NO_HARNESS, 'Pair-source isolated harness actions are missing.', 'output-pairs')
      continue
    }

    let failed = ''
    let restoreFailed = false
    try {
      await pressBatch(baseUrl, pageNumber, built, batches.test)
      let result = await verifyMany(baseUrl, label, [
        exactCheck(`output_${left + 1}_source`, built.testSources.primary),
        exactCheck(`output_${right + 1}_source`, built.testSources.primary),
      ], 7500)
      if (result.some((item) => !item.ok)) failed = 'pair-source test value was not confirmed on both channels'
      if (!failed) {
        await pressBatch(baseUrl, pageNumber, built, batches.none)
        result = await verifyMany(baseUrl, label, [
          exactCheck(`output_${left + 1}_source`, '0'),
          exactCheck(`output_${right + 1}_source`, '0'),
        ], 7500)
        if (result.some((item) => !item.ok)) failed = 'pair-source None was not confirmed on both channels'
      }
    } catch (error) {
      failed = error.message
    } finally {
      try {
        await pressBatch(baseUrl, pageNumber, built, `v4-output-${left + 1}-source-restore`)
        await pressBatch(baseUrl, pageNumber, built, `v4-output-${right + 1}-source-restore`)
        const restored = await verifyMany(baseUrl, label, [
          exactCheck(`output_${left + 1}_source`, leftSource.value !== '' ? leftSource.value : '0'),
          exactCheck(`output_${right + 1}_source`, rightSource.value !== '' ? rightSource.value : '0'),
        ], 8000)
        restoreFailed = restored.some((item) => !item.ok)
      } catch {
        restoreFailed = true
      }
    }
    if (restoreFailed) update(rowId, STATUS.QUARANTINED_RESTORE, `${failed ? `${failed}; ` : ''}pair original sources were not both restored.`, 'output-pairs')
    else if (failed) update(rowId, STATUS.FAIL_NO_EFFECT, `${failed}; pair sources restored.`, 'output-pairs')
    else update(rowId, STATUS.PASS, 'Pair source test -> None -> individual source restore confirmed.', 'output-pairs')
  }
}

module.exports = { addPairInventoryRows, pairBatchIds, testOutputPairSource, pairForOutput }

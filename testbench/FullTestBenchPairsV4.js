'use strict'

const { readVariableOptional } = require('./FullTestBenchBase')
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
  return { test: `${stem}-test`, alt: `${stem}-test-alt`, none: `${stem}-none`, restore: `${stem}-restore` }
}

async function pairedTestMapping(baseUrl, label, left, right, expectedLeft) {
  const leftResult = await verifyMany(baseUrl, label, [exactCheck(`output_${left + 1}_source`, expectedLeft)], 7500)
  if (!leftResult[0]?.ok) return { ok: false, detail: 'left member did not confirm the requested paired source' }
  const rightItem = await readVariableOptional(baseUrl, label, `output_${right + 1}_source`, 3000)
  const rightValue = String(rightItem?.value ?? '').trim()
  if (!rightItem?.exists || !rightValue || rightValue === '0') {
    return { ok: false, detail: 'right member did not expose a non-zero paired source id' }
  }
  return { ok: true, rightValue }
}

async function confirmPairNone(baseUrl, label, pageNumber, built, batches, left, right) {
  await pressBatch(baseUrl, pageNumber, built, batches.none)
  const result = await verifyMany(baseUrl, label, [
    exactCheck(`output_${left + 1}_source`, '0'),
    exactCheck(`output_${right + 1}_source`, '0'),
  ], 7500)
  return result.every((item) => item.ok)
}

async function testOutputPairSource({ baseUrl, label, pageNumber, built, snapshot, profile, muteResults, outputEligibility, update, pairGuards = new Map() }) {
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
    if (pairGuards.has(left)) {
      update(rowId, STATUS.PASS_BASELINE, 'Pair Source=None is retained as the active safety guard; arbitrary pair routing is deferred until independent mute guards are proven.', 'output-pairs')
      continue
    }
    if (muteResults.get(left)?.safetyConfirmed !== true || muteResults.get(right)?.safetyConfirmed !== true) {
      update(rowId, STATUS.BLOCKED_BY_SAFETY, 'Both pair members must have confirmed mute safety before functional pair-source routing.', 'output-pairs')
      continue
    }
    const batches = pairBatchIds(left, right)
    if (!built.locations[batches.test] || !built.locations[batches.alt] || !built.locations[batches.none] || !built.locations[batches.restore]) {
      update(rowId, STATUS.SKIP_NO_HARNESS, 'Pair-source test-A/test-B/None/restore harness actions are missing.', 'output-pairs')
      continue
    }

    let mappedCandidate = null
    let failed = ''
    let restoreFailed = false
    try {
      const candidates = [
        { batch: batches.test, source: built.testSources.primary },
        { batch: batches.alt, source: built.testSources.secondary },
      ]
      for (const candidate of candidates) {
        await pressBatch(baseUrl, pageNumber, built, candidate.batch)
        const mapped = await pairedTestMapping(baseUrl, label, left, right, candidate.source)
        if (mapped.ok) {
          mappedCandidate = candidate.source
          break
        }
        const noneOk = await confirmPairNone(baseUrl, label, pageNumber, built, batches, left, right)
        if (!noneOk) {
          failed = 'pair-source None could not be confirmed while resetting between source candidates'
          break
        }
      }
      if (mappedCandidate && !failed) {
        const noneOk = await confirmPairNone(baseUrl, label, pageNumber, built, batches, left, right)
        if (!noneOk) failed = 'pair-source None was not confirmed on both channels'
      }
    } catch (error) {
      failed = error.message
    } finally {
      try {
        await pressBatch(baseUrl, pageNumber, built, batches.restore)
        const restored = await verifyMany(baseUrl, label, [
          exactCheck(`output_${left + 1}_source`, leftSource.value !== '' ? leftSource.value : '0'),
          exactCheck(`output_${right + 1}_source`, rightSource.value !== '' ? rightSource.value : '0'),
        ], 8000)
        restoreFailed = restored.some((item) => !item.ok)
      } catch {
        restoreFailed = true
      }
      if (restoreFailed && built.locations[batches.none]) {
        try {
          await confirmPairNone(baseUrl, label, pageNumber, built, batches, left, right)
        } catch {
          // Report quarantine below; no optimistic restore/safety claim is made.
        }
      }
    }
    if (restoreFailed) {
      update(rowId, STATUS.QUARANTINED_RESTORE, `${failed ? `${failed}; ` : ''}pair original sources were not both restored; pair Source=None fallback attempted.`, 'output-pairs')
    } else if (failed) {
      update(rowId, STATUS.FAIL_NO_EFFECT, `${failed}; pair sources restored.`, 'output-pairs')
    } else if (!mappedCandidate) {
      update(rowId, STATUS.EVAL_ONLY, 'Two known source IDs were tried but neither was proven pairable; pair None and original restore were server-confirmed, so no hardware failure is claimed.', 'output-pairs')
    } else {
      update(rowId, STATUS.PASS, 'A known pairable source candidate, pair None, and original pair restore were server-confirmed.', 'output-pairs')
    }
  }
}

module.exports = { addPairInventoryRows, pairBatchIds, pairedTestMapping, confirmPairNone, testOutputPairSource, pairForOutput }

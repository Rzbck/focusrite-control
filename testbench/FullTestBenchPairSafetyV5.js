'use strict'

const { exactCheck, verifyMany } = require('./FullTestBenchCorePhases')
const { STATUS } = require('./FullTestBenchCapabilityV4')
const { pressBatch } = require('./FullTestBenchV4Common')
const { pairBatchIds } = require('./FullTestBenchPairsV4')
const { isPairOwnedRight } = require('./FullTestBenchOwnershipV7')

const DIRECT_MUTE_GUARD_REASONS = new Set(['mute-confirmed', 'pair-mute-confirmed'])

function pairSafetyRowId(left, right) {
  return `output-pair:${left + 1}-${right + 1}:safety`
}

function describePairNoneResult(results) {
  return (results || [])
    .map((item) => {
      const observed =
        item.actual === undefined || item.actual === null || String(item.actual) === '' ? 'unknown' : String(item.actual)
      return `${item.variable} expected=${item.expected} observed=${observed}`
    })
    .join('; ')
}

function pairSourceChecks(left, right, leftExpected, rightExpected) {
  return [
    exactCheck(`output_${left + 1}_source`, leftExpected),
    exactCheck(`output_${right + 1}_source`, rightExpected),
  ]
}

function buildSignalPathSafety(outputEligibility, sourceSafety) {
  return (outputEligibility || []).map((row) => ({
    output: row.output + 1,
    availability: row.availability,
    safe: row.availability === 'UNAVAILABLE' || sourceSafety.get(row.output)?.safe === true,
    reason:
      row.availability === 'UNAVAILABLE'
        ? 'unavailable'
        : sourceSafety.get(row.output)?.reason || 'no-confirmed-guard',
  }))
}

function pairNeedsSourceGuard(left, right, sourceSafety) {
  const leftSafety = sourceSafety.get(left)
  const rightSafety = sourceSafety.get(right)
  return !(
    leftSafety?.safe === true &&
    rightSafety?.safe === true &&
    DIRECT_MUTE_GUARD_REASONS.has(leftSafety.reason) &&
    DIRECT_MUTE_GUARD_REASONS.has(rightSafety.reason)
  )
}

async function recoverFailedPairSafetyAttempt({
  baseUrl,
  label,
  pageNumber,
  built,
  batches,
  left,
  right,
  leftOriginal,
  rightOriginal,
}) {
  let restoreResult = []
  try {
    await pressBatch(baseUrl, pageNumber, built, batches.restore)
    restoreResult = await verifyMany(
      baseUrl,
      label,
      pairSourceChecks(left, right, leftOriginal, rightOriginal),
      8000,
    )
    if (restoreResult.every((item) => item.ok)) {
      return { restored: true, fallbackConfirmed: false, restoreResult, fallbackResult: [] }
    }
  } catch {
    restoreResult = []
  }

  let fallbackResult = []
  try {
    await pressBatch(baseUrl, pageNumber, built, batches.none)
    fallbackResult = await verifyMany(baseUrl, label, pairSourceChecks(left, right, '0', '0'), 7500)
  } catch {
    fallbackResult = []
  }

  return {
    restored: false,
    fallbackConfirmed: fallbackResult.length === 2 && fallbackResult.every((item) => item.ok),
    restoreResult,
    fallbackResult,
  }
}

async function establishPairSourceSafety({
  baseUrl,
  label,
  pageNumber,
  built,
  snapshot,
  profile,
  outputEligibility,
  sourceSafety,
  update,
  pairOwnership = new Map(),
  hardAbortOnRestoreFailure = false,
}) {
  const eligibility = new Map((outputEligibility || []).map((row) => [row.output, row]))
  const pairGuards = new Map()

  for (const [left, right] of profile.outputPairs || []) {
    if (!snapshot.shape.outputs.includes(left) || !snapshot.shape.outputs.includes(right)) continue

    const rowId = pairSafetyRowId(left, right)
    const leftAvail = eligibility.get(left)?.availability
    const rightAvail = eligibility.get(right)?.availability
    if (leftAvail === 'UNKNOWN' || rightAvail === 'UNKNOWN') {
      update(
        rowId,
        STATUS.SKIP_AVAILABILITY_UNKNOWN,
        `Pair availability is ${leftAvail}/${rightAvail}; pair Source=None safety write skipped.`,
        'pair-safety',
      )
      continue
    }
    if (leftAvail === 'UNAVAILABLE' || rightAvail === 'UNAVAILABLE') {
      update(
        rowId,
        STATUS.SKIP_UNAVAILABLE,
        `Pair availability is ${leftAvail}/${rightAvail}; pair Source=None safety write skipped.`,
        'pair-safety',
      )
      continue
    }
    if (!pairNeedsSourceGuard(left, right, sourceSafety)) {
      update(
        rowId,
        STATUS.PASS_BASELINE,
        'Pair Source=None safety guard not required because both members already have direct server-confirmed mute guards.',
        'pair-safety',
      )
      continue
    }
    if (isPairOwnedRight(pairOwnership, right)) {
      update(
        rowId,
        STATUS.BLOCKED_BY_SAFETY,
        'Runtime topology proved the right member remains on its original source during pair Source=None; a false both-member None guard is not retried.',
        'pair-safety',
      )
      continue
    }

    const leftSource = snapshot.values[`output_${left + 1}_source`]
    const rightSource = snapshot.values[`output_${right + 1}_source`]
    if (!leftSource?.exists || !rightSource?.exists) {
      update(
        rowId,
        STATUS.SKIP_NO_CAPABILITY,
        'Both pair members must expose source controls for pair Source=None safety.',
        'pair-safety',
      )
      continue
    }
    if (leftSource.value === '' || rightSource.value === '') {
      update(
        rowId,
        STATUS.BLOCKED_BY_SAFETY,
        'Pair Source=None safety write skipped because one or both original source values are unknown and exact restoration cannot be guaranteed.',
        'pair-safety',
      )
      continue
    }

    const batches = pairBatchIds(left, right)
    if (!built.locations[batches.none] || !built.locations[batches.restore]) {
      update(rowId, STATUS.SKIP_NO_HARNESS, 'Pair Source=None/restore safety harness actions are missing.', 'pair-safety')
      continue
    }

    const leftOriginal = leftSource.value
    const rightOriginal = rightSource.value
    try {
      await pressBatch(baseUrl, pageNumber, built, batches.none)
      const noneResult = await verifyMany(baseUrl, label, pairSourceChecks(left, right, '0', '0'), 7500)
      if (noneResult.some((item) => !item.ok)) {
        const recovery = await recoverFailedPairSafetyAttempt({
          baseUrl,
          label,
          pageNumber,
          built,
          batches,
          left,
          right,
          leftOriginal,
          rightOriginal,
        })
        if (recovery.restored) {
          update(
            rowId,
            STATUS.BLOCKED_BY_SAFETY,
            `Pair Source=None was not server-confirmed on both members: ${describePairNoneResult(noneResult)}; original pair restore confirmed after failed safety attempt.`,
            'pair-safety',
          )
        } else {
          const detail = `Pair Source=None was not server-confirmed on both members: ${describePairNoneResult(noneResult)}; original pair restore was not confirmed; pair Source=None fallback ${recovery.fallbackConfirmed ? 'was confirmed' : 'was not confirmed'}. Restore saved Focusrite configuration manually.`
          update(rowId, STATUS.QUARANTINED_RESTORE, detail, 'pair-safety')
          if (hardAbortOnRestoreFailure) throw new Error(`RESTORE FAILED: ${rowId}; ${detail}`)
        }
        continue
      }

      const guard = {
        left,
        right,
        restoreBatch: batches.restore,
        noneBatch: batches.none,
        leftOriginal,
        rightOriginal,
      }
      pairGuards.set(left, guard)
      sourceSafety.set(left, { safe: true, reason: 'pair-source-none', pairGuard: left, restoreNeeded: false })
      sourceSafety.set(right, { safe: true, reason: 'pair-source-none', pairGuard: left, restoreNeeded: false })
      update(
        rowId,
        STATUS.PASS_BASELINE,
        'Pair Source=None is server-confirmed on both members and retained as a temporary signal-path safety guard.',
        'pair-safety',
      )
    } catch (error) {
      if (/^RESTORE FAILED:/.test(error.message)) throw error
      const recovery = await recoverFailedPairSafetyAttempt({
        baseUrl,
        label,
        pageNumber,
        built,
        batches,
        left,
        right,
        leftOriginal,
        rightOriginal,
      })
      if (recovery.restored) {
        update(
          rowId,
          STATUS.BLOCKED_BY_SAFETY,
          `Pair Source=None safety guard failed: ${error.message}; original pair restore confirmed after failed safety attempt.`,
          'pair-safety',
        )
      } else {
        const detail = `Pair Source=None safety guard failed: ${error.message}; original pair restore was not confirmed; pair Source=None fallback ${recovery.fallbackConfirmed ? 'was confirmed' : 'was not confirmed'}. Restore saved Focusrite configuration manually.`
        update(rowId, STATUS.QUARANTINED_RESTORE, detail, 'pair-safety')
        if (hardAbortOnRestoreFailure) throw new Error(`RESTORE FAILED: ${rowId}; ${detail}`)
      }
    }
  }

  return pairGuards
}

async function restorePairSourceSafety({
  baseUrl,
  label,
  pageNumber,
  built,
  pairGuards,
  update,
  hardAbortOnRestoreFailure = false,
}) {
  for (const guard of pairGuards.values()) {
    const { left, right, restoreBatch, noneBatch, leftOriginal, rightOriginal } = guard
    const rowId = pairSafetyRowId(left, right)
    let restored = false
    try {
      await pressBatch(baseUrl, pageNumber, built, restoreBatch)
      const result = await verifyMany(
        baseUrl,
        label,
        pairSourceChecks(left, right, leftOriginal, rightOriginal),
        8000,
      )
      restored = result.every((item) => item.ok)
    } catch {
      restored = false
    }

    if (restored) {
      update(
        rowId,
        STATUS.PASS_BASELINE,
        'Pair Source=None safety guard and original pair restore were server-confirmed; arbitrary paired routing was not exercised under this guard.',
        'pair-safety-restore',
      )
      continue
    }

    try {
      await pressBatch(baseUrl, pageNumber, built, noneBatch)
      await verifyMany(baseUrl, label, pairSourceChecks(left, right, '0', '0'), 7500)
    } catch {
      // No optimistic safety claim: quarantine is reported below.
    }
    const detail = 'Original pair sources were not both restored; pair Source=None fallback attempted and saved Focusrite configuration must be restored manually.'
    update(rowId, STATUS.QUARANTINED_RESTORE, detail, 'pair-safety-restore')
    if (hardAbortOnRestoreFailure) throw new Error(`RESTORE FAILED: ${rowId}; ${detail}`)
  }
}

module.exports = {
  DIRECT_MUTE_GUARD_REASONS,
  pairSafetyRowId,
  describePairNoneResult,
  pairSourceChecks,
  buildSignalPathSafety,
  pairNeedsSourceGuard,
  recoverFailedPairSafetyAttempt,
  establishPairSourceSafety,
  restorePairSourceSafety,
}

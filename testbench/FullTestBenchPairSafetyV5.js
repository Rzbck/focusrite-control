'use strict'

const { exactCheck, verifyMany } = require('./FullTestBenchCorePhases')
const { STATUS } = require('./FullTestBenchCapabilityV4')
const { pressBatch } = require('./FullTestBenchV4Common')
const { pairBatchIds } = require('./FullTestBenchPairsV4')

const DIRECT_MUTE_GUARD_REASONS = new Set(['mute-confirmed', 'pair-mute-confirmed'])

function pairSafetyRowId(left, right) {
  return `output-pair:${left + 1}-${right + 1}:safety`
}

function describePairNoneResult(results) {
  return (results || [])
    .map((item) => {
      const observed = item.actual === undefined || item.actual === null || String(item.actual) === '' ? 'unknown' : String(item.actual)
      return `${item.variable} expected=${item.expected} observed=${observed}`
    })
    .join('; ')
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

    const leftSource = snapshot.values[`output_${left + 1}_source`]
    const rightSource = snapshot.values[`output_${right + 1}_source`]
    if (!leftSource?.exists || !rightSource?.exists) {
      update(rowId, STATUS.SKIP_NO_CAPABILITY, 'Both pair members must expose source controls for pair Source=None safety.', 'pair-safety')
      continue
    }

    const batches = pairBatchIds(left, right)
    if (!built.locations[batches.none] || !built.locations[batches.restore]) {
      update(rowId, STATUS.SKIP_NO_HARNESS, 'Pair Source=None/restore safety harness actions are missing.', 'pair-safety')
      continue
    }

    try {
      await pressBatch(baseUrl, pageNumber, built, batches.none)
      const noneResult = await verifyMany(
        baseUrl,
        label,
        [exactCheck(`output_${left + 1}_source`, '0'), exactCheck(`output_${right + 1}_source`, '0')],
        7500,
      )
      if (noneResult.some((item) => !item.ok)) {
        update(
          rowId,
          STATUS.BLOCKED_BY_SAFETY,
          `Pair Source=None was not server-confirmed on both members: ${describePairNoneResult(noneResult)}.`,
          'pair-safety',
        )
        continue
      }

      const guard = {
        left,
        right,
        restoreBatch: batches.restore,
        noneBatch: batches.none,
        leftOriginal: leftSource.value !== '' ? leftSource.value : '0',
        rightOriginal: rightSource.value !== '' ? rightSource.value : '0',
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
      update(rowId, STATUS.BLOCKED_BY_SAFETY, `Pair Source=None safety guard failed: ${error.message}`, 'pair-safety')
    }
  }

  return pairGuards
}

async function restorePairSourceSafety({ baseUrl, label, pageNumber, built, pairGuards, update }) {
  for (const guard of pairGuards.values()) {
    const { left, right, restoreBatch, noneBatch, leftOriginal, rightOriginal } = guard
    const rowId = pairSafetyRowId(left, right)
    let restored = false
    try {
      await pressBatch(baseUrl, pageNumber, built, restoreBatch)
      const result = await verifyMany(
        baseUrl,
        label,
        [exactCheck(`output_${left + 1}_source`, leftOriginal), exactCheck(`output_${right + 1}_source`, rightOriginal)],
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
      await verifyMany(
        baseUrl,
        label,
        [exactCheck(`output_${left + 1}_source`, '0'), exactCheck(`output_${right + 1}_source`, '0')],
        7500,
      )
    } catch {
      // No optimistic safety claim: quarantine is reported below.
    }
    update(
      rowId,
      STATUS.QUARANTINED_RESTORE,
      'Original pair sources were not both restored; pair Source=None fallback attempted and saved Focusrite configuration must be restored manually.',
      'pair-safety-restore',
    )
  }
}

module.exports = {
  DIRECT_MUTE_GUARD_REASONS,
  pairSafetyRowId,
  describePairNoneResult,
  buildSignalPathSafety,
  pairNeedsSourceGuard,
  establishPairSourceSafety,
  restorePairSourceSafety,
}

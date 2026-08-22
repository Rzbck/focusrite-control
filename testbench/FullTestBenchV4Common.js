'use strict'
const { readVariableOptional, sleep } = require('./FullTestBenchBase')
const { pressLocation } = require('./FullTestBenchAudit')
const { verifyMany } = require('./FullTestBenchCorePhases')
const { STATUS } = require('./FullTestBenchCapabilityV4')

function progress(phase, current, total, detail = '') {
  const safeTotal = Math.max(1, Number(total) || 1)
  const safeCurrent = Math.min(safeTotal, Math.max(0, Number(current) || 0))
  const width = String(safeTotal).length
  const counter = `${String(safeCurrent).padStart(width, '0')}/${safeTotal}`
  console.log(`PROGRESS           ${String(phase).padEnd(18)} ${counter}${detail ? ` :: ${detail}` : ''}`)
}

async function pressBatch(baseUrl, pageNumber, built, batchId) {
  const location = built.locations[batchId]
  if (!location) throw new Error(`Harness batch ${batchId} is unavailable.`)
  await pressLocation(baseUrl, pageNumber, location)
}

async function sampleBoolVariables(baseUrl, label, variables) {
  const result = {}
  for (const [key, variable] of Object.entries(variables)) result[key] = await readVariableOptional(baseUrl, label, variable, 2200)
  return result
}

async function settleAndSample(baseUrl, label, variables, delay = 350) {
  await sleep(delay)
  let sample = await sampleBoolVariables(baseUrl, label, variables)
  if (Object.values(sample).some((item) => item.exists && item.value === '')) {
    await sleep(650)
    sample = await sampleBoolVariables(baseUrl, label, variables)
  }
  return sample
}

function rowUpdater(inventory, reporter) {
  const byId = new Map(inventory.rows.map((row) => [row.id, row]))
  return (id, status, detail, phase = 'capability') => {
    const row = byId.get(id)
    if (row) {
      if (row.status === STATUS.QUARANTINED_RESTORE && status !== STATUS.QUARANTINED_RESTORE) {
        reporter.add(phase, id, row.status, row.detail)
        return
      }
      row.status = status
      row.detail = detail
    }
    reporter.add(phase, id, status, detail)
  }
}

function asChecks(check) {
  return Array.isArray(check) ? check : [check]
}

async function observeChecks(checks, observeVariable) {
  if (!observeVariable) return
  for (const variable of [...new Set(checks.map((check) => check.variable).filter(Boolean))]) {
    await observeVariable(variable)
  }
}

function failedCheckDetail(batch, result) {
  const failed = result.find((item) => !item.ok)
  if (!failed) return `${batch}: verification failed`
  return `${batch}: ${failed.variable} expected ${failed.expected}, observed ${failed.actual ?? 'unknown'}`
}

async function isolatedCycle({
  baseUrl,
  label,
  pageNumber,
  built,
  rowId,
  update,
  steps,
  restore,
  safeFallback = null,
  phase = 'isolated',
  hardAbortOnRestoreFailure = false,
  observeVariable = null,
}) {
  let failed = null
  for (const step of steps) {
    if (!built.locations[step.batch]) {
      update(rowId, STATUS.SKIP_NO_HARNESS, `Missing harness batch ${step.batch}.`, phase)
      return false
    }
    try {
      await pressBatch(baseUrl, pageNumber, built, step.batch)
      const checks = asChecks(step.check)
      const result = await verifyMany(baseUrl, label, checks, step.timeout || 6000)
      if (result.some((item) => !item.ok)) {
        failed = failedCheckDetail(step.batch, result)
        break
      }
      await observeChecks(checks, observeVariable)
    } catch (error) {
      failed = `${step.batch}: ${error.message}`
      break
    }
  }

  let restoreOk = true
  if (restore) {
    try {
      await pressBatch(baseUrl, pageNumber, built, restore.batch)
      const checks = asChecks(restore.check)
      const result = await verifyMany(baseUrl, label, checks, restore.timeout || 7000)
      restoreOk = result.every((item) => item.ok)
      if (restoreOk) await observeChecks(checks, observeVariable)
    } catch {
      restoreOk = false
    }
  }
  if (!restoreOk) {
    if (safeFallback && built.locations[safeFallback.batch]) {
      try {
        await pressBatch(baseUrl, pageNumber, built, safeFallback.batch)
        await verifyMany(baseUrl, label, asChecks(safeFallback.check), 6000)
      } catch {
        // Quarantine remains recorded below.
      }
    }
    const detail = `Functional probe ${failed ? `also failed (${failed}); ` : ''}original restore was not confirmed; safe fallback attempted.`
    update(rowId, STATUS.QUARANTINED_RESTORE, detail, phase)
    if (hardAbortOnRestoreFailure) throw new Error(`RESTORE FAILED: ${rowId}; ${detail}`)
    return false
  }
  if (failed) {
    update(rowId, STATUS.FAIL_NO_EFFECT, `${failed}; original/baseline restore confirmed.`, phase)
    return false
  }
  update(rowId, STATUS.PASS, 'All transitions and restore server-confirmed.', phase)
  return true
}

module.exports = {
  progress,
  pressBatch,
  sampleBoolVariables,
  settleAndSample,
  rowUpdater,
  asChecks,
  isolatedCycle,
}

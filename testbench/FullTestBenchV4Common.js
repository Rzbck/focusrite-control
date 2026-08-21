'use strict'
const { readVariableOptional, sleep } = require('./FullTestBenchBase')
const { pressLocation } = require('./FullTestBenchAudit')
const { verifyMany } = require('./FullTestBenchCorePhases')
const { STATUS } = require('./FullTestBenchCapabilityV4')
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
      row.status = status
      row.detail = detail
    }
    reporter.add(phase, id, status, detail)
  }
}

async function isolatedCycle({ baseUrl, label, pageNumber, built, rowId, update, steps, restore, safeFallback = null, phase = 'isolated' }) {
  let failed = null
  for (const step of steps) {
    if (!built.locations[step.batch]) {
      update(rowId, STATUS.SKIP_NO_HARNESS, `Missing harness batch ${step.batch}.`, phase)
      return false
    }
    try {
      await pressBatch(baseUrl, pageNumber, built, step.batch)
      const result = await verifyMany(baseUrl, label, [step.check], step.timeout || 6000)
      if (!result[0]?.ok) {
        failed = `${step.batch}: expected ${step.check.expected}, observed ${result[0]?.actual ?? 'unknown'}`
        break
      }
    } catch (error) {
      failed = `${step.batch}: ${error.message}`
      break
    }
  }

  let restoreOk = true
  if (restore) {
    try {
      await pressBatch(baseUrl, pageNumber, built, restore.batch)
      const result = await verifyMany(baseUrl, label, [restore.check], restore.timeout || 7000)
      restoreOk = result[0]?.ok === true
    } catch {
      restoreOk = false
    }
  }
  if (!restoreOk) {
    if (safeFallback && built.locations[safeFallback.batch]) {
      try {
        await pressBatch(baseUrl, pageNumber, built, safeFallback.batch)
        await verifyMany(baseUrl, label, [safeFallback.check], 6000)
      } catch {
        // Quarantine remains recorded below.
      }
    }
    update(rowId, STATUS.QUARANTINED_RESTORE, `Functional probe ${failed ? `also failed (${failed}); ` : ''}original restore was not confirmed; safe fallback attempted.`, phase)
    return false
  }
  if (failed) {
    update(rowId, STATUS.FAIL_NO_EFFECT, `${failed}; original/baseline restore confirmed.`, phase)
    return false
  }
  update(rowId, STATUS.PASS, `All transitions and restore server-confirmed.`, phase)
  return true
}

module.exports = { pressBatch, sampleBoolVariables, settleAndSample, rowUpdater, isolatedCycle }

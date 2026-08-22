'use strict'
const { canonicalBool, readVariableOptional, waitVariable, waitExact } = require('./FullTestBenchBase')
const { pressLocation, safePlanSetter } = require('./FullTestBenchAudit')
const { STATUS } = require('./FullTestBenchCapabilityV4')
function coreBaseline(test) {
  if (test.id.startsWith('air-') || test.id.startsWith('pad-')) return 'false'
  if (test.id === 'monitor-mute') return 'true'
  if (test.id === 'monitor-dim' || test.id === 'talkback') return 'false'
  if (test.id === 'input-1-mode' || test.id === 'input-2-mode') return 'Line'
  return ''
}

function coreAlternate(test, baseline) {
  if (test.kind === 'boolean') return baseline === 'true' ? 'false' : 'true'
  return (test.allowedInitial || []).find((value) => String(value) !== String(baseline)) || ''
}

function coreRowId(test) {
  let match = test.id.match(/^air-(\d+)$/)
  if (match) return `input:${match[1]}:air`
  match = test.id.match(/^pad-(\d+)$/)
  if (match) return `input:${match[1]}:pad`
  match = test.id.match(/^input-(\d+)-mode$/)
  if (match) return `input:${match[1]}:mode`
  if (test.id === 'monitor-mute') return 'monitor:mute'
  if (test.id === 'monitor-dim') return 'monitor:dim'
  if (test.id === 'talkback') return 'monitor:talkback'
  return `core:${test.id}`
}

async function captureCoreVariables(baseUrl, label, safePlan) {
  const result = {}
  for (const test of safePlan.tests) result[test.variable] = await readVariableOptional(baseUrl, label, test.variable, 2500)
  return result
}

async function probeCoreTarget({
  baseUrl,
  label,
  r9,
  safePlan,
  test,
  update,
  hardAbortOnRestoreFailure = false,
  observeVariable = null,
}) {
  const id = coreRowId(test)
  const current = await readVariableOptional(baseUrl, label, test.variable, 2500)
  const known = current.exists && current.value !== ''
  const original = test.kind === 'boolean' ? canonicalBool(current.value) : String(current.value || '')
  const baseline = known && original ? original : coreBaseline(test)
  const alternate = coreAlternate(test, baseline)
  if (!baseline || !alternate) {
    update(id, STATUS.SKIP_NO_CAPABILITY, 'No safe baseline/alternate pair is defined for this target.')
    return
  }

  const waitFor = async (value, timeout = 5000) => test.kind === 'boolean'
    ? waitVariable(baseUrl, label, test.variable, (actual) => canonicalBool(actual) === value, timeout)
    : waitExact(baseUrl, label, test.variable, value, timeout)
  const set = async (value) => pressLocation(baseUrl, r9.pageNumber, safePlanSetter(safePlan, test, value))

  let baselineObserved = false
  let alternateObserved = false
  let restoreFailure = ''
  try {
    await set(baseline)
    baselineObserved = (await waitFor(baseline, 1800)).ok
    if (baselineObserved && observeVariable) await observeVariable(test.variable)
    if (!baselineObserved) {
      await set(alternate)
      alternateObserved = (await waitFor(alternate)).ok
      if (alternateObserved && observeVariable) await observeVariable(test.variable)
      await set(baseline)
      baselineObserved = (await waitFor(baseline)).ok
      if (baselineObserved && observeVariable) await observeVariable(test.variable)
      if (alternateObserved && baselineObserved) {
        update(id, STATUS.PASS_BASELINE, `blank/no-op recovered through ${alternate} -> ${baseline}; safe baseline retained`)
        return
      }
    }
    if (!baselineObserved) {
      update(id, STATUS.FAIL_NO_EFFECT, `could not server-confirm safe baseline ${baseline}`)
      return
    }
    await set(alternate)
    alternateObserved = (await waitFor(alternate)).ok
    if (alternateObserved && observeVariable) await observeVariable(test.variable)
  } catch (error) {
    update(id, STATUS.FAIL_NO_EFFECT, `probe error: ${error.message}`)
  } finally {
    try {
      await set(baseline)
      const restored = await waitFor(baseline)
      if (!restored.ok) restoreFailure = `restore/baseline ${baseline} not confirmed; target quarantined`
      else if (observeVariable) await observeVariable(test.variable)
    } catch (error) {
      restoreFailure = `restore/baseline threw: ${error.message}`
    }
    if (restoreFailure) {
      update(id, STATUS.QUARANTINED_RESTORE, restoreFailure)
      if (hardAbortOnRestoreFailure) throw new Error(`RESTORE FAILED: ${id}; ${restoreFailure}`)
    }
  }
  if (restoreFailure) return
  if (alternateObserved) update(id, STATUS.PASS, `${baseline} -> ${alternate} -> ${baseline} server-confirmed`)
  else update(id, STATUS.FAIL_NO_EFFECT, `alternate ${alternate} was not server-confirmed; baseline restored where observable`)
}

module.exports = { coreRowId, captureCoreVariables, probeCoreTarget }

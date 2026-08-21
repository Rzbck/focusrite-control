'use strict'

const path = require('node:path')
const { testbenchDir, line } = require('./FullTestBenchBase')
const { Reporter } = require('./FullTestBenchCorePhases')
const { CAMPAIGN_REVISION, STATUS, summarizeRows } = require('./FullTestBenchCapabilityV4')
const { writeCapabilityReportV4 } = require('./FullTestBenchReportV4')
const { selfTestV4 } = require('./FullTestBenchSelfTestV4')
const { prepareLab } = require('./FullTestBenchRunnerV4Preflight')
const { runCampaign } = require('./FullTestBenchRunnerV4Campaign')

function finishPending(inventory, status, detail) {
  for (const row of inventory.rows) {
    if (row.status === 'DISCOVERED') {
      row.status = status
      row.detail = detail
    }
  }
}

async function mainV4() {
  if (process.argv.includes('--self-test')) return selfTestV4()
  if (!process.argv.includes('--allow-hardware-writes')) throw new Error('REFUSED: missing explicit --allow-hardware-writes permission.')

  console.log('')
  console.log('==================================================================')
  console.log(' FOCUSRITE 18i20 CAPABILITY LAB v0.3 - FULL HARDWARE MATRIX')
  console.log('==================================================================')
  console.log('Capability-driven: unavailable/unknown/coupled targets are classified, not guessed.')
  console.log('Individual failures continue when the remaining campaign is still safe.')
  console.log('Only loss of the global safety/authorization guard causes a global HARD ABORT.')
  console.log('Normal FULL excludes device preset, clock source, sample rate and S/PDIF mode.')
  console.log('Monitor gain 1677, Advanced Raw, firmware/reset/restore/snapshot remain forbidden.')
  console.log('')

  const reporter = new Reporter()
  let ctx = null
  let campaign = null
  try {
    ctx = await prepareLab(reporter)
    if (ctx.prep === 'mixer-variables') {
      line('PREP REQUIRED', 'Mixer variables', 'Enable "Expose all mixer slot variables" on the existing Focusrite connection, Apply, then rerun FULL.')
      process.exitCode = 6
      return
    }
    if (ctx.prep === 'harness') {
      line('PREP REQUIRED', 'Capability Lab page 2', 'generated/FULL_EXTENDED.companionconfig is the V4 isolated harness. Replace only page 2 and remap FOCUSRITE TESTBENCH TARGET to the existing Focusrite connection.')
      line('INFO', 'Snapshot lock', `revision=${CAMPAIGN_REVISION}; signature=${ctx.built.signature}; batches=${ctx.built.batches.length}`)
      writeCapabilityReportV4({ rows: ctx.inventory.rows, meta: { completed: false, hardwareWrites: false, reason: 'v4-harness-import-required', revision: CAMPAIGN_REVISION, signature: ctx.built.signature } })
      process.exitCode = 6
      return
    }

    line('INFO', 'Hardware campaign', 'Monitor Mute guard first; then isolated capability probes and per-target classification')
    campaign = await runCampaign(ctx, reporter)
    if (campaign.blockedBeforeHardware) {
      writeCapabilityReportV4({ rows: ctx.inventory.rows, meta: { completed: false, hardwareWrites: false, reason: 'feedback-before-failed', revision: CAMPAIGN_REVISION, signature: ctx.built.signature }, feedbackBefore: campaign.feedbackBefore })
      process.exitCode = 2
      return
    }

    finishPending(ctx.inventory, STATUS.EVAL_ONLY, 'Capability discovered but no safe isolated automatic V4 functional probe was executed.')
    const summary = summarizeRows(ctx.inventory.rows)
    const files = writeCapabilityReportV4({
      rows: ctx.inventory.rows,
      meta: {
        completed: true,
        hardwareWrites: campaign.hardwareWrites,
        revision: CAMPAIGN_REVISION,
        signature: ctx.built.signature,
        model: ctx.model,
        r9Probes: ctx.r9.probes.length,
        r9Definitions: new Set(ctx.r9.probes.map((probe) => probe.definitionId)).size,
        globalSignalPathSafety: campaign.globalSafety,
      },
      feedbackBefore: campaign.feedbackBefore,
      feedbackAfter: campaign.feedbackAfter,
    })

    console.log('')
    console.log('==================================================================')
    console.log(' CAPABILITY LAB SUMMARY')
    console.log('==================================================================')
    for (const [status, count] of Object.entries(summary).sort()) console.log(`${status.padEnd(28)} ${count}`)
    console.log(`REPORT TXT          ${path.relative(testbenchDir, files.txt)}`)
    console.log(`REPORT JSON         ${path.relative(testbenchDir, files.json)}`)
    console.log(`REPORT CSV          ${path.relative(testbenchDir, files.csv)}`)
    console.log('Report columns cross-reference capability, r9 coverage, hardware result, skip/block reason and restore/quarantine.')
    console.log('')
    const bad = (summary.FAIL_NO_EFFECT || 0) + (summary.FAIL_MISMATCH || 0) + (summary.QUARANTINED_RESTORE || 0)
    process.exitCode = bad ? 2 : 0
  } catch (error) {
    const hardAbort = /GLOBAL SAFETY LOST|authorization preflight|authorised/i.test(error.message)
    line('FAIL', 'Capability Lab', error.message)
    reporter.add('fatal', 'runner', hardAbort ? 'HARD_ABORT' : 'FAIL', error.message)
    if (ctx?.inventory) {
      finishPending(ctx.inventory, hardAbort ? STATUS.BLOCKED_BY_SAFETY : STATUS.EVAL_ONLY, hardAbort ? 'Campaign stopped because global safety/authorization was lost.' : 'Campaign ended before this target was reached.')
      writeCapabilityReportV4({ rows: ctx.inventory.rows, meta: { completed: false, hardwareWrites: Boolean(campaign?.hardwareWrites), fatal: true, revision: CAMPAIGN_REVISION }, feedbackBefore: campaign?.feedbackBefore, feedbackAfter: campaign?.feedbackAfter })
    }
    process.exitCode = hardAbort ? 4 : 2
  }
}

module.exports = { mainV4 }

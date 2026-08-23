'use strict'

const path = require('node:path')
const { testbenchDir, line } = require('./FullTestBenchBase')
const { Reporter } = require('./FullTestBenchCorePhases')
const { STATUS, summarizeRows } = require('./FullTestBenchCapabilityV4')
const { writeCapabilityReportV4 } = require('./FullTestBenchReportV4')
const { selfTestV4 } = require('./FullTestBenchSelfTestV4')
const { prepareLab } = require('./FullTestBenchRunnerV4Preflight')
const { runCampaign } = require('./FullTestBenchRunnerV4Campaign')
const { resolveDiagnosticResumePhase } = require('./FullTestBenchResumeV7')
const { applyEvidenceClassifications, auditEvidenceCoverage, publicEvidenceAudit } = require('./FullTestBenchEvidenceV8')

const FULL_CAMPAIGN_REVISION = 'full-v8-generic-evidence-profile-20260823'
const FULL_ROUTING_ISOLATION_FLAG = '--confirm-all-output-routing-isolated'

function finishPending(inventory, status, detail) {
	for (const row of inventory.rows) {
		if (row.status === 'DISCOVERED') {
			row.status = status
			row.detail = detail
		}
	}
}

function refreshEvidence(ctx) {
	if (!ctx?.inventory) return null
	applyEvidenceClassifications(ctx.inventory, ctx.profile)
	const audit = auditEvidenceCoverage({
		inventory: ctx.inventory,
		snapshot: ctx.snapshot,
		coreInitial: ctx.coreInitial,
		r9Coverage: ctx.inventory.r9Coverage,
	})
	ctx.evidenceAudit = audit
	return audit
}

function fatalCampaignEvidence(ctx, campaign) {
	return {
		hardwareWrites: Boolean(campaign?.hardwareWrites || ctx?.hardwareWritesStarted),
		feedbackBefore: campaign?.feedbackBefore ?? ctx?.partialCampaign?.feedbackBefore ?? null,
		feedbackAfter: campaign?.feedbackAfter ?? ctx?.partialCampaign?.feedbackAfter ?? null,
		feedbackDynamic: campaign?.feedbackDynamic ?? ctx?.partialCampaign?.feedbackDynamic ?? null,
		diagnosticResumePhase:
			campaign?.diagnosticResumePhase ?? ctx?.partialCampaign?.diagnosticResumePhase ?? null,
	}
}

async function mainV4() {
	if (process.argv.includes('--self-test')) return selfTestV4()
	if (!process.argv.includes('--allow-hardware-writes')) {
		throw new Error('REFUSED: missing explicit --allow-hardware-writes permission.')
	}
	if (!process.argv.includes(FULL_ROUTING_ISOLATION_FLAG)) {
		throw new Error(`REFUSED: missing explicit ${FULL_ROUTING_ISOLATION_FLAG} permission for the device-wide routing sweep.`)
	}

	const requestedDiagnosticResume = resolveDiagnosticResumePhase()

	console.log('')
	console.log('==================================================================')
	console.log(
		requestedDiagnosticResume
			? ' FOCUSRITE CAPABILITY LAB V8 - DIAGNOSTIC RESUME'
			: ' FOCUSRITE CAPABILITY LAB V8 - DEVICE-WIDE HARDWARE MATRIX',
	)
	console.log('==================================================================')
	console.log('Generic engine inventory is separated from model-specific hardware evidence.')
	console.log('Runtime pair topology is source-specific evidence; it is never promoted into unrelated mute/stereo conclusions.')
	console.log('Explicit ALL_ISOLATED and server-confirmed global signal safety are tracked separately.')
	console.log('Reversible Core/mixer/lane/monitoring tests may run under physical isolation with exact local restore.')
	console.log('Any unconfirmed restore HARD ABORTS the campaign before the next reversible family.')
	console.log('Every observed snapshot/Core variable must map to a classified inventory row before hardware writes.')
	console.log('Feedbacks are sampled statically and during the transitions that exercise their server variables.')
	console.log('Manual meter validation uses explicit SILENT then SIGNAL phases instead of one unsynchronised window.')
	console.log('Normal FULL still excludes device preset, clock source, sample rate and S/PDIF mode.')
	console.log('Monitor gain 1677 remains read-only; Advanced Raw, firmware/reset/restore/snapshot remain forbidden.')
	if (requestedDiagnosticResume) {
		console.log(`DIAGNOSTIC RESUME starts at ${requestedDiagnosticResume}; it is never accepted as final/publishable FULL evidence.`)
	}
	console.log('')

	const reporter = new Reporter()
	let ctx = null
	let campaign = null
	try {
		ctx = await prepareLab(reporter)
		if (ctx.prep === 'mixer-variables') {
			line(
				'PREP REQUIRED',
				'Mixer variables',
				'Enable "Expose all mixer slot variables" on the existing Focusrite connection, Apply, then rerun FULL.',
			)
			process.exitCode = 6
			return
		}
		if (ctx.prep === 'harness') {
			line(
				'PREP REQUIRED',
				'Capability Lab page 2',
				'generated/FULL_EXTENDED.companionconfig is the current isolated harness. Replace only page 2 and remap FOCUSRITE TESTBENCH TARGET to the existing Focusrite connection.',
			)
			line(
				'INFO',
				'Snapshot lock',
				`campaign=${FULL_CAMPAIGN_REVISION}; harnessSignature=${ctx.built.signature}; batches=${ctx.built.batches.length}`,
			)
			refreshEvidence(ctx)
			writeCapabilityReportV4({
				rows: ctx.inventory.rows,
				meta: {
					completed: false,
					hardwareWrites: false,
					reason: 'device-wide-harness-import-required',
					revision: FULL_CAMPAIGN_REVISION,
					signature: ctx.built.signature,
					diagnosticResumePhase: requestedDiagnosticResume,
					evidenceAudit: publicEvidenceAudit(ctx.evidenceAudit),
				},
			})
			process.exitCode = 6
			return
		}

		line(
			'INFO',
			'Hardware campaign',
			requestedDiagnosticResume
				? `DIAGNOSTIC RESUME from ${requestedDiagnosticResume}; mandatory safety/topology guards rerun; final FULL evidence is not replaced.`
				: 'Protective Monitor Mute; runtime pair ownership; isolated reversible families; dynamic feedback; targeted manual meters; exact restoration.',
		)
		campaign = await runCampaign(ctx, reporter)
		if (campaign.blockedBeforeHardware) {
			refreshEvidence(ctx)
			writeCapabilityReportV4({
				rows: ctx.inventory.rows,
				meta: {
					completed: false,
					hardwareWrites: false,
					reason: 'feedback-before-failed',
					revision: FULL_CAMPAIGN_REVISION,
					signature: ctx.built.signature,
					evidenceAudit: publicEvidenceAudit(ctx.evidenceAudit),
				},
				feedbackBefore: campaign.feedbackBefore,
			})
			process.exitCode = 2
			return
		}

		const diagnosticResume = Boolean(campaign.diagnosticResumePhase)
		finishPending(
			ctx.inventory,
			STATUS.EVAL_ONLY,
			diagnosticResume
				? 'Not exercised on this diagnostic-resume pass; final status requires a FULL-from-zero validation.'
				: 'Capability discovered but no isolated automatic functional probe was executed in this campaign.',
		)
		const evidenceAudit = refreshEvidence(ctx)
		if (!evidenceAudit?.complete) {
			throw new Error('EVIDENCE COVERAGE LOST: observed capability inventory is no longer completely classified.')
		}
		const summary = summarizeRows(ctx.inventory.rows)
		const files = writeCapabilityReportV4({
			rows: ctx.inventory.rows,
			meta: {
				completed: !diagnosticResume,
				hardwareWrites: campaign.hardwareWrites,
				reason: diagnosticResume ? 'diagnostic-resume-completed' : undefined,
				revision: FULL_CAMPAIGN_REVISION,
				signature: ctx.built.signature,
				model: ctx.model,
				r9Probes: ctx.r9.probes.length,
				r9Definitions: new Set(ctx.r9.probes.map((probe) => probe.definitionId)).size,
				globalSignalPathSafety: campaign.globalSafety,
				physicalIsolationConfirmed: campaign.physicalIsolationConfirmed,
				signalPathSafety: campaign.signalPathSafety,
				diagnosticResumePhase: campaign.diagnosticResumePhase,
				evidenceAudit: publicEvidenceAudit(evidenceAudit),
			},
			feedbackBefore: campaign.feedbackBefore,
			feedbackAfter: campaign.feedbackAfter,
			feedbackDynamic: campaign.feedbackDynamic,
		})

		console.log('')
		console.log('==================================================================')
		console.log(diagnosticResume ? ' CAPABILITY LAB V8 DIAGNOSTIC RESUME SUMMARY' : ' CAPABILITY LAB V8 SUMMARY')
		console.log('==================================================================')
		for (const [status, count] of Object.entries(summary).sort()) console.log(`${status.padEnd(28)} ${count}`)
		console.log(
			`EVIDENCE COVERAGE    rows=${evidenceAudit.classifiedRows}/${evidenceAudit.inventoryRows} snapshot=${evidenceAudit.snapshotMapped}/${evidenceAudit.snapshotObserved} core=${evidenceAudit.coreMapped}/${evidenceAudit.coreObserved} feedback=${evidenceAudit.feedbackProbes}/${evidenceAudit.feedbackDefinitions}`,
		)
		if (campaign.feedbackDynamic) {
			console.log(
				`DYNAMIC FEEDBACK     both=${campaign.feedbackDynamic.bothStates}/${campaign.feedbackDynamic.total} single=${campaign.feedbackDynamic.singleState} never=${campaign.feedbackDynamic.neverObserved} fail=${campaign.feedbackDynamic.fail}`,
			)
		}
		console.log(`REPORT TXT          ${path.relative(testbenchDir, files.txt)}`)
		console.log(`REPORT JSON PRIVATE ${path.relative(testbenchDir, files.json)}`)
		console.log(`REPORT SHAREABLE    ${path.relative(testbenchDir, files.shareable)}`)
		console.log(`LATEST SHAREABLE    ${path.relative(testbenchDir, files.latestShareable)}`)
		console.log(`REPORT CSV          ${path.relative(testbenchDir, files.csv)}`)
		console.log('Raw JSON stays private. Share only the sanitized .shareable.json / LATEST_SHAREABLE.json result.')
		if (diagnosticResume) {
			console.log('DIAGNOSTIC RESUME is intentionally meta.completed=false and must never replace final FULL-from-zero evidence.')
		}
		console.log('MANUAL_PENDING means the capability is intentionally not claimed as fully exercised yet.')
		console.log('')
		const bad =
			(summary.FAIL_NO_EFFECT || 0) +
			(summary.FAIL_MISMATCH || 0) +
			(summary.QUARANTINED_RESTORE || 0) +
			(campaign.feedbackDynamic?.fail || 0)
		process.exitCode = bad ? 2 : 0
	} catch (error) {
		const hardAbort = /GLOBAL SAFETY LOST|EVIDENCE COVERAGE LOST|authorization preflight|authorised|TOPOLOGY RESTORE FAILED|RESTORE FAILED|HARD ABORT/i.test(
			error.message,
		)
		const evidence = fatalCampaignEvidence(ctx, campaign)
		line('FAIL', 'Capability Lab', error.message)
		reporter.add('fatal', 'runner', hardAbort ? 'HARD_ABORT' : 'FAIL', error.message)
		if (ctx?.inventory) {
			finishPending(
				ctx.inventory,
				hardAbort ? STATUS.BLOCKED_BY_SAFETY : STATUS.EVAL_ONLY,
				hardAbort
					? 'Campaign stopped because authorization/safety/restoration/evidence coverage was not confirmed.'
					: 'Campaign ended before this target was reached.',
			)
			refreshEvidence(ctx)
			writeCapabilityReportV4({
				rows: ctx.inventory.rows,
				meta: {
					completed: false,
					hardwareWrites: evidence.hardwareWrites,
					reason: hardAbort ? 'hard-abort' : 'campaign-failed',
					revision: FULL_CAMPAIGN_REVISION,
					signature: ctx.built?.signature,
					physicalIsolationConfirmed: process.argv.includes(FULL_ROUTING_ISOLATION_FLAG),
					diagnosticResumePhase: evidence.diagnosticResumePhase,
					evidenceAudit: publicEvidenceAudit(ctx.evidenceAudit),
				},
				feedbackBefore: evidence.feedbackBefore,
				feedbackAfter: evidence.feedbackAfter,
				feedbackDynamic: evidence.feedbackDynamic,
			})
		}
		process.exitCode = hardAbort ? 4 : 2
	}
}

module.exports = {
	FULL_CAMPAIGN_REVISION,
	FULL_ROUTING_ISOLATION_FLAG,
	fatalCampaignEvidence,
	refreshEvidence,
	mainV4,
}

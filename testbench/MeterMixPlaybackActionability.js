'use strict'

const { line } = require('./FullTestBenchBase')
const { Reporter } = require('./FullTestBenchCorePhases')
const { prepareLab } = require('./FullTestBenchRunnerV4Preflight')
const { buildMeterDescriptors, classifyTrack } = require('./MeterFeedbackClosure')
const { meterSignature, loadTracks, detectPlaybackSource } = require('./MeterRoutingClosure')
const { augmentMixPlaybackHarness } = require('./MeterMixPlaybackPage')

const NO_ACTIONABLE_EXIT = 8

function laneMeterLabel(lane) {
	return `Mix ${lane.mix} ${lane.side}`
}

function laneActionability(entry, tracks) {
	if (entry.status !== 'READY') return entry.status
	const label = laneMeterLabel(entry.lane)
	const track = [...tracks.values()].find((item) => item.definitionId === 'mix_meter' && item.label === label)
	if (!track) return 'BLOCKED_NO_METER_TRACK'
	return classifyTrack(track) === 'PASS_FLOOR_AND_MOVEMENT' ? 'SKIP_ALREADY_CLOSED' : 'ACTIONABLE'
}

function classifyEntries(lanes, tracks) {
	return lanes.map((entry) => ({ ...entry, actionability: laneActionability(entry, tracks) }))
}

async function main() {
	console.log('==================================================================')
	console.log(' FOCUSRITE 18i20 MIX METER - READ-ONLY ACTIONABILITY GATE')
	console.log('==================================================================')
	console.log('Aucun bouton Companion presse. Aucun write Focusrite. Aucune Page 2 remplacee.')
	console.log('')

	const reporter = new Reporter()
	const ctx = await prepareLab(reporter)
	if (ctx.prep === 'mixer-variables') {
		throw new Error('Expose all mixer slot variables must remain enabled before mix meter closure.')
	}
	if (ctx.prep !== null || !ctx.ext || ctx.ext.pageNumber !== 2) {
		throw new Error('Actionability gate requires the current V8 capability-lab harness on Companion Page 2.')
	}

	const playback = await detectPlaybackSource(ctx.baseUrl, ctx.label, ctx.snapshot)
	line(
		'PASS',
		'Playback source',
		`existing mixer slot ${playback.slot} :: ${playback.name}${playback.stereo ? ' / stereo' : ''}`,
	)

	const descriptors = buildMeterDescriptors(ctx.r9)
	if (descriptors.length !== 46) throw new Error(`Expected exactly 46 meter probes, got ${descriptors.length}.`)
	const signature = meterSignature(ctx.model, descriptors)
	const tracks = loadTracks(signature, descriptors)
	const augmented = augmentMixPlaybackHarness(ctx.built, ctx.snapshot, playback.slot)
	const classified = classifyEntries(augmented.lanes, tracks)
	const actionable = classified.filter((entry) => entry.actionability === 'ACTIONABLE')
	const alreadyClosed = classified.filter((entry) => entry.actionability === 'SKIP_ALREADY_CLOSED')
	const unknownBaseline = classified.filter((entry) => entry.actionability === 'SKIP_BASELINE_UNKNOWN')
	const blockedTrack = classified.filter((entry) => entry.actionability === 'BLOCKED_NO_METER_TRACK')

	line(
		'INFO',
		'Focused actionability',
		`ACTIONABLE=${actionable.length} ALREADY_CLOSED=${alreadyClosed.length} BASELINE_UNKNOWN=${unknownBaseline.length} NO_TRACK=${blockedTrack.length}`,
	)
	for (const entry of classified) {
		line('INFO', `Mix ${entry.lane.mix} ${entry.lane.side}`, `${entry.actionability} / Playback slot ${entry.slot}`)
	}

	if (blockedTrack.length) {
		throw new Error('Focused actionability could not map every exact-baseline lane to its mix meter track.')
	}
	if (!actionable.length) {
		console.log('')
		console.log('MIX METER NO-OP SAFE - aucune lane encore non close ne dispose d une baseline Playback exacte.')
		console.log('Aucun write hardware n est utile ou autorise par cette campagne dans cet etat.')
		process.exitCode = NO_ACTIONABLE_EXIT
		return
	}

	console.log('')
	console.log(`ACTIONABILITY PASS - ${actionable.length} lane(s) encore non close(s) peuvent etre exercees avec restauration exacte.`)
}

if (require.main === module) {
	main().catch((error) => {
		console.error(`ACTIONABILITY BLOCKED - ${error.message}`)
		console.error('Aucun write hardware n a ete effectue par ce gate.')
		process.exitCode = 2
	})
}

module.exports = {
	NO_ACTIONABLE_EXIT,
	laneMeterLabel,
	laneActionability,
	classifyEntries,
}

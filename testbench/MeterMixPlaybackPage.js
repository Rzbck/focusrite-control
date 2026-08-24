'use strict'

const { canonicalBool } = require('./FullTestBenchBase')
const { laneBase } = require('./FullTestBenchAudit')
const { METER_FLOOR_DBFS } = require('./MeterFeedbackClosure')
const { METER_DRIVE_GAIN_DB, appendBatch } = require('./MeterRoutingPage')

function laneId(lane) {
	return `${String(lane.mix).replace(/\s+/g, '').toLowerCase()}-${String(lane.side)[0]}`
}

function playbackSlotBaseline(snapshot, lane, slot) {
	const base = laneBase(lane)
	const gain = snapshot.values?.[`${base}_slot_${slot}_gain`]
	const mute = snapshot.values?.[`${base}_slot_${slot}_mute`]
	const solo = snapshot.values?.[`${base}_slot_${slot}_solo`]
	if (!gain?.exists || !mute?.exists || !solo?.exists) return null
	if (gain.value === null || gain.value === undefined || String(gain.value).trim() === '') return null
	if (!Number.isFinite(Number(gain.value))) return null
	const muteValue = canonicalBool(mute.value)
	const soloValue = canonicalBool(solo.value)
	if (muteValue === null || soloValue === null) return null
	return {
		gain: Number(gain.value),
		mute: muteValue,
		solo: soloValue,
		variables: {
			gain: `${base}_slot_${slot}_gain`,
			mute: `${base}_slot_${slot}_mute`,
			solo: `${base}_slot_${slot}_solo`,
		},
	}
}

function mixSpec(definitionId, lane, slot, options) {
	return {
		definitionId,
		options: { mix: lane.mix, side: lane.side, slot, ...options },
	}
}

function augmentMixPlaybackHarness(built, snapshot, playbackSlot) {
	const slot = Number(playbackSlot)
	if (!Number.isInteger(slot) || slot < 1 || slot > 24) {
		throw new Error(`Invalid existing Playback mixer slot ${playbackSlot}.`)
	}
	const lanes = []
	for (const lane of snapshot.shape.lanes || []) {
		const baseline = playbackSlotBaseline(snapshot, lane, slot)
		const id = `meter-mix-${laneId(lane)}-slot-${slot}`
		if (!baseline) {
			lanes.push({ lane, slot, id, status: 'SKIP_BASELINE_UNKNOWN' })
			continue
		}
		const floor = `${id}-floor`
		const drive = `${id}-drive`
		const restore = `${id}-restore`
		appendBatch(built, {
			id: floor,
			label: `${lane.mix} ${lane.side}\nS${slot} FLOOR`,
			specs: [
				mixSpec('mix_gain_set', lane, slot, { level: METER_FLOOR_DBFS }),
				mixSpec('mix_solo', lane, slot, { state: 'false' }),
				mixSpec('mix_mute', lane, slot, { state: 'true' }),
			],
		})
		appendBatch(built, {
			id: drive,
			label: `${lane.mix} ${lane.side}\nS${slot} DRIVE`,
			specs: [
				mixSpec('mix_gain_set', lane, slot, { level: METER_DRIVE_GAIN_DB }),
				mixSpec('mix_solo', lane, slot, { state: 'false' }),
				mixSpec('mix_mute', lane, slot, { state: 'false' }),
			],
		})
		appendBatch(built, {
			id: restore,
			label: `${lane.mix} ${lane.side}\nS${slot} RESTORE`,
			specs: [
				mixSpec('mix_mute', lane, slot, { state: 'true' }),
				mixSpec('mix_gain_set', lane, slot, { level: baseline.gain }),
				mixSpec('mix_solo', lane, slot, { state: baseline.solo }),
				mixSpec('mix_mute', lane, slot, { state: baseline.mute }),
			],
		})
		lanes.push({ lane, slot, id, status: 'READY', baseline, batches: { floor, drive, restore } })
	}
	return { built, lanes, playbackSlot: slot }
}

module.exports = {
	laneId,
	playbackSlotBaseline,
	augmentMixPlaybackHarness,
}

'use strict'

const { canonicalBool } = require('./FullTestBenchBase')
const { laneBase } = require('./FullTestBenchAudit')

function exactBaselineKnown(item) {
	return Boolean(item?.exists && String(item.value ?? '') !== '')
}

function boolBaselineKnown(item) {
	return Boolean(item?.exists && canonicalBool(item.value) !== null)
}

function numericBaselineKnown(item) {
	return Boolean(item?.exists && String(item.value ?? '') !== '' && Number.isFinite(Number(item.value)))
}

function cloneSnapshot(snapshot) {
	return {
		...snapshot,
		values: Object.fromEntries(
			Object.entries(snapshot?.values || {}).map(([name, item]) => [
				name,
				item && typeof item === 'object' ? { ...item } : item,
			]),
		),
	}
}

function cloneBuilt(built) {
	return { ...built, locations: { ...(built?.locations || {}) } }
}

function buildRestorableV7Context({ snapshot, built, profile, enabled = false }) {
	if (!enabled) {
		return {
			snapshot,
			built,
			pairProfile: profile,
			maskedVariables: [],
			maskedLaneFamilies: [],
			skippedSourcePairs: 0,
		}
	}

	const safeSnapshot = cloneSnapshot(snapshot)
	const safeBuilt = cloneBuilt(built)
	const masked = new Set()
	const maskedLaneFamilies = []
	const originalValues = snapshot?.values || {}
	const safeValues = safeSnapshot.values

	const maskVariable = (name) => {
		const original = originalValues[name]
		if (!original?.exists) return
		if (!masked.has(name)) masked.add(name)
		safeValues[name] = { ...safeValues[name], exists: false }
	}

	for (const output of snapshot?.shape?.outputs || []) {
		const n = output + 1
		const sourceName = `output_${n}_source`
		const gainName = `output_${n}_gain`
		const stereoName = `output_${n}_stereo`
		if (originalValues[sourceName]?.exists && !exactBaselineKnown(originalValues[sourceName])) maskVariable(sourceName)
		if (originalValues[gainName]?.exists && !numericBaselineKnown(originalValues[gainName])) maskVariable(gainName)
		if (originalValues[stereoName]?.exists && !boolBaselineKnown(originalValues[stereoName])) maskVariable(stereoName)
	}

	const restorablePairs = []
	for (const pair of profile?.outputPairs || []) {
		const [left, right] = pair
		const sourceNames = [`output_${left + 1}_source`, `output_${right + 1}_source`]
		const pairSourcesKnown = sourceNames.every((name) => exactBaselineKnown(originalValues[name]))
		if (pairSourcesKnown) restorablePairs.push([...pair])
		else for (const name of sourceNames) maskVariable(name)

		const stereoNames = [`output_${left + 1}_stereo`, `output_${right + 1}_stereo`]
		const exposedStereo = stereoNames.filter((name) => originalValues[name]?.exists)
		if (exposedStereo.length && exposedStereo.some((name) => !boolBaselineKnown(originalValues[name]))) {
			for (const name of exposedStereo) maskVariable(name)
		}
	}

	for (const slot of snapshot?.shape?.mixerSlots || []) {
		const sourceName = `mixer_slot_${slot}_source`
		const stereoName = `mixer_slot_${slot}_stereo`
		if (originalValues[sourceName]?.exists && !exactBaselineKnown(originalValues[sourceName])) maskVariable(sourceName)
		if (originalValues[stereoName]?.exists && !boolBaselineKnown(originalValues[stereoName])) maskVariable(stereoName)
	}

	const laneBatchIds = (lane, property) => {
		const stem = `${lane.mix.replace(/\s+/g, '').toLowerCase()}-${lane.side[0]}`
		if (property === 'mute') return [`${stem}-mute-on`, `${stem}-mute-off`, `${stem}-mute-restore`]
		if (property === 'solo') return [`${stem}-solo-off`, `${stem}-solo-on`, `${stem}-solo-restore`]
		if (property === 'gain') {
			return [`${stem}-gain-set`, `v2-${stem}-gain-prime`, `${stem}-gain-adjust`, `${stem}-gain-restore`]
		}
		if (property === 'pan') return [`${stem}-pan-center`, `${stem}-pan-right`, `${stem}-pan-restore`]
		return []
	}

	for (const lane of snapshot?.shape?.lanes || []) {
		const base = laneBase(lane)
		for (const property of ['mute', 'solo', 'gain', 'pan']) {
			const names = []
			for (let slot = 1; slot <= 24; slot++) {
				const name = `${base}_slot_${slot}_${property}`
				if (originalValues[name]?.exists) names.push(name)
			}
			const known = (name) => {
				if (property === 'mute' || property === 'solo') return boolBaselineKnown(originalValues[name])
				return numericBaselineKnown(originalValues[name])
			}
			if (names.some((name) => !known(name))) {
				for (const name of names) maskVariable(name)
				for (const batchId of laneBatchIds(lane, property)) delete safeBuilt.locations[batchId]
				maskedLaneFamilies.push(`${lane.mix}:${lane.side}:${property}`)
			}
		}

		const talkbackName = `${base}_talkback`
		if (originalValues[talkbackName]?.exists && !boolBaselineKnown(originalValues[talkbackName])) {
			maskVariable(talkbackName)
		}
	}

	for (const name of ['device_phantomPersistence', 'monitor_altEnable', 'monitor_alt']) {
		if (originalValues[name]?.exists && !boolBaselineKnown(originalValues[name])) maskVariable(name)
	}
	for (const name of ['monitor_preset', 'device_talkbackInputSource']) {
		if (originalValues[name]?.exists && !exactBaselineKnown(originalValues[name])) maskVariable(name)
	}

	const pairProfile = profile
		? { ...profile, outputPairs: Object.freeze(restorablePairs.map((pair) => Object.freeze([...pair]))) }
		: profile

	return {
		snapshot: safeSnapshot,
		built: safeBuilt,
		pairProfile,
		maskedVariables: [...masked].sort(),
		maskedLaneFamilies,
		skippedSourcePairs: (profile?.outputPairs?.length || 0) - restorablePairs.length,
	}
}

module.exports = {
	exactBaselineKnown,
	boolBaselineKnown,
	numericBaselineKnown,
	buildRestorableV7Context,
}

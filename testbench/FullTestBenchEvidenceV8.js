'use strict'

const { STATUS } = require('./FullTestBenchCapabilityV4')

const CLASSIFICATION = Object.freeze({
	SCHEMA_OBSERVED: 'SCHEMA_OBSERVED',
	READ_ONLY_CONFIRMED: 'READ_ONLY_CONFIRMED',
	WRITE_CANDIDATE: 'WRITE_CANDIDATE',
	WRITE_CONFIRMED: 'WRITE_CONFIRMED',
	NO_EFFECT_CONFIRMED: 'NO_EFFECT_CONFIRMED',
	WRITE_BEHAVIOR_MISMATCH: 'WRITE_BEHAVIOR_MISMATCH',
	PAIR_OWNED_ALIAS: 'PAIR_OWNED_ALIAS',
	UNRESTORABLE: 'UNRESTORABLE',
	BLOCKED_BY_SAFETY: 'BLOCKED_BY_SAFETY',
	AVAILABILITY_UNKNOWN: 'AVAILABILITY_UNKNOWN',
	NO_CAPABILITY: 'NO_CAPABILITY',
	WITHHELD_BY_PROFILE: 'WITHHELD_BY_PROFILE',
	MANUAL_PENDING: 'MANUAL_PENDING',
	UNSUPPORTED: 'UNSUPPORTED',
	FORBIDDEN: 'FORBIDDEN',
	UNKNOWN: 'UNKNOWN',
})

function outputIndexFromRow(row) {
	const match = String(row?.id || '').match(/^output:(\d+):/)
	return match ? Number(match[1]) - 1 : null
}

function mixerSlotFromRow(row) {
	const match = String(row?.id || '').match(/^mixer-slot:(\d+):/)
	return match ? Number(match[1]) : null
}

function laneIdFromRow(row) {
	const match = String(row?.id || '').match(/^mix:([^:]+):talkback$/)
	return match?.[1] || ''
}

function profileClassification(row, profile) {
	if (row.capability === false) return null
	const evidence = profile?.evidence
	const output = outputIndexFromRow(row)
	if (output !== null) {
		const prop = String(row.id).split(':').at(-1)
		if (prop === 'source' && evidence?.output?.pairOwnedSourceRight?.has(output)) {
			return CLASSIFICATION.PAIR_OWNED_ALIAS
		}
		if (evidence?.output?.behaviorMismatch?.[prop]?.has(output)) {
			return CLASSIFICATION.WRITE_BEHAVIOR_MISMATCH
		}
		if (evidence?.output?.noEffect?.[prop]?.has(output)) return CLASSIFICATION.NO_EFFECT_CONFIRMED
	}

	const slot = mixerSlotFromRow(row)
	if (slot !== null) {
		if (row.family === 'mixer_slot_source') {
			if (evidence?.mixerSlot?.noEffectSourceSlots?.has(slot)) return CLASSIFICATION.NO_EFFECT_CONFIRMED
			if (evidence?.mixerSlot?.withheldControls?.has('source')) return CLASSIFICATION.WITHHELD_BY_PROFILE
		}
		if (row.family === 'mixer_slot_stereo') {
			if (evidence?.mixerSlot?.noEffectStereoSlots?.has(slot)) return CLASSIFICATION.NO_EFFECT_CONFIRMED
			if (evidence?.mixerSlot?.withheldControls?.has('stereo')) return CLASSIFICATION.WITHHELD_BY_PROFILE
		}
	}

	if (row.family === 'mix_talkback') {
		const laneId = laneIdFromRow(row)
		if (evidence?.mixLane?.noEffectTalkbackLaneIds?.has(laneId)) return CLASSIFICATION.NO_EFFECT_CONFIRMED
		if (evidence?.mixLane?.withheldControls?.has('talkback')) return CLASSIFICATION.WITHHELD_BY_PROFILE
	}

	if (row.family === 'monitor_gain_1677_readback') return CLASSIFICATION.READ_ONLY_CONFIRMED
	// Unknown/unvalidated hardware remains discoverable, but every observed
	// variable is non-writing until a dedicated hardware evidence profile exists.
	if (profile?.writeEnabled === false && row.variable) return CLASSIFICATION.WITHHELD_BY_PROFILE
	return null
}

function statusClassification(row) {
	if ([STATUS.PASS, STATUS.PASS_INDEPENDENT, STATUS.PASS_COUPLED_PAIR].includes(row.status)) {
		return CLASSIFICATION.WRITE_CONFIRMED
	}
	if (row.status === STATUS.FAIL_NO_EFFECT) return CLASSIFICATION.NO_EFFECT_CONFIRMED
	if (row.status === STATUS.FAIL_MISMATCH) return CLASSIFICATION.WRITE_BEHAVIOR_MISMATCH
	if (row.status === STATUS.QUARANTINED_RESTORE) return CLASSIFICATION.UNRESTORABLE
	if (row.status === STATUS.BLOCKED_BY_SAFETY) return CLASSIFICATION.BLOCKED_BY_SAFETY
	if (row.status === STATUS.SKIP_AVAILABILITY_UNKNOWN) return CLASSIFICATION.AVAILABILITY_UNKNOWN
	if (row.status === STATUS.SKIP_NO_CAPABILITY) return CLASSIFICATION.NO_CAPABILITY
	if (row.status === 'MANUAL_PENDING') return CLASSIFICATION.MANUAL_PENDING
	if (row.status === 'BLOCKED_FORBIDDEN') return CLASSIFICATION.FORBIDDEN
	if (row.status === 'UNSUPPORTED') return CLASSIFICATION.UNSUPPORTED
	if (row.status === STATUS.PASS_BASELINE) return CLASSIFICATION.SCHEMA_OBSERVED
	if (row.status === STATUS.EVAL_ONLY || row.status === 'DISCOVERED') {
		return row.capability === false ? CLASSIFICATION.NO_CAPABILITY : CLASSIFICATION.WRITE_CANDIDATE
	}
	return CLASSIFICATION.UNKNOWN
}

function classifyRow(row, profile) {
	const fromProfile = profileClassification(row, profile)
	if (fromProfile) return fromProfile
	return statusClassification(row)
}

function evidenceDetail(classification) {
	if (classification === CLASSIFICATION.PAIR_OWNED_ALIAS) {
		return 'Direct source write withheld by model evidence: this member is pair-owned/aliased for source routing.'
	}
	if (classification === CLASSIFICATION.NO_EFFECT_CONFIRMED) {
		return 'Direct write withheld because prior hardware testing confirmed no useful transition with exact baseline restoration.'
	}
	if (classification === CLASSIFICATION.WRITE_BEHAVIOR_MISMATCH) {
		return 'Direct write withheld because prior hardware testing produced a repeatable behavior mismatch; readable state remains observable.'
	}
	return 'Write family withheld by the current hardware evidence profile; readable state remains observable.'
}

function normalizeWithheldStatus(row) {
	if (
		[
			CLASSIFICATION.NO_EFFECT_CONFIRMED,
			CLASSIFICATION.WRITE_BEHAVIOR_MISMATCH,
			CLASSIFICATION.PAIR_OWNED_ALIAS,
			CLASSIFICATION.WITHHELD_BY_PROFILE,
		].includes(row.classification) &&
		['DISCOVERED', STATUS.EVAL_ONLY, STATUS.SKIP_NO_CAPABILITY].includes(row.status)
	) {
		const wasMaskedAsNoCapability = row.status === STATUS.SKIP_NO_CAPABILITY
		row.status = STATUS.EVAL_ONLY
		if (!row.detail || wasMaskedAsNoCapability || /no .*capability|not .*exposed/i.test(row.detail)) {
			row.detail = evidenceDetail(row.classification)
		}
	}
}

function applyEvidenceClassifications(inventory, profile) {
	for (const row of inventory?.rows || []) {
		row.classification = classifyRow(row, profile)
		normalizeWithheldStatus(row)
	}
	return inventory
}

function observedVariableNames(values = {}) {
	return Object.entries(values)
		.filter(([, item]) => item?.exists)
		.map(([name]) => name)
}

function auditEvidenceCoverage({ inventory, snapshot, coreInitial, r9Coverage }) {
	const rows = inventory?.rows || []
	const rowVariables = new Set(rows.map((row) => row.variable).filter((value) => value && !value.includes(' + ')))
	const snapshotObserved = observedVariableNames(snapshot?.values)
	const coreObserved = observedVariableNames(coreInitial)
	const unmappedSnapshotVariables = snapshotObserved.filter((name) => !rowVariables.has(name)).sort()
	const unmappedCoreVariables = coreObserved.filter((name) => !rowVariables.has(name)).sort()
	const unclassifiedRows = rows.filter((row) => !row.classification || row.classification === CLASSIFICATION.UNKNOWN).map((row) => row.id)
	const feedbackDefinitions = r9Coverage?.byDefinition instanceof Map ? r9Coverage.byDefinition.size : 0
	const feedbackProbes = Number(r9Coverage?.total || 0)
	const complete =
		unmappedSnapshotVariables.length === 0 &&
		unmappedCoreVariables.length === 0 &&
		unclassifiedRows.length === 0 &&
		feedbackProbes > 0

	return {
		complete,
		inventoryRows: rows.length,
		classifiedRows: rows.length - unclassifiedRows.length,
		snapshotObserved: snapshotObserved.length,
		snapshotMapped: snapshotObserved.length - unmappedSnapshotVariables.length,
		coreObserved: coreObserved.length,
		coreMapped: coreObserved.length - unmappedCoreVariables.length,
		feedbackProbes,
		feedbackDefinitions,
		unclassifiedCount: unclassifiedRows.length,
		unmappedSnapshotVariables,
		unmappedCoreVariables,
		unclassifiedRows,
	}
}

function publicEvidenceAudit(audit) {
	if (!audit) return null
	return {
		complete: audit.complete,
		inventoryRows: audit.inventoryRows,
		classifiedRows: audit.classifiedRows,
		snapshotObserved: audit.snapshotObserved,
		snapshotMapped: audit.snapshotMapped,
		coreObserved: audit.coreObserved,
		coreMapped: audit.coreMapped,
		feedbackProbes: audit.feedbackProbes,
		feedbackDefinitions: audit.feedbackDefinitions,
		unclassifiedCount: audit.unclassifiedCount,
	}
}

module.exports = {
	CLASSIFICATION,
	classifyRow,
	applyEvidenceClassifications,
	auditEvidenceCoverage,
	publicEvidenceAudit,
}

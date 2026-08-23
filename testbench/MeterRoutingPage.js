'use strict'

const fs = require('node:fs')
const path = require('node:path')
const { generatedDir } = require('./FullTestBenchBase')
const { actionEntity, buildButton } = require('./FullTestBenchBuild')
const { laneBase } = require('./FullTestBenchAudit')

const METER_DRIVE_GAIN_DB = -20
const METER_ROUTING_PAGE = path.join(generatedDir, 'METER_ROUTING_EXTENDED.companionconfig')
const METER_ROUTING_BASE_RESTORE_PAGE = path.join(generatedDir, 'METER_ROUTING_BASE_RESTORE.companionconfig')

function laneId(lane) {
	return `${lane.mix.replace(/\s+/g, '').toLowerCase()}-${lane.side[0]}`
}

function appendBatch(built, batch) {
	if (!batch.specs.length) return false
	if (built.locations[batch.id]) throw new Error(`Duplicate meter-routing batch ${batch.id}.`)
	const maxColumn = Number(built.file?.page?.gridSize?.maxColumn ?? 45)
	const index = built.batches.length
	const row = Math.floor(index / (maxColumn + 1))
	const column = index % (maxColumn + 1)
	const actions = batch.specs.map((item, actionIndex) =>
		actionEntity(item.definitionId, item.options, `meter-routing/${built.signature}/${batch.id}/${actionIndex}`),
	)
	built.file.page.controls[String(row)] ??= {}
	built.file.page.controls[String(row)][String(column)] = buildButton(
		batch.label,
		batch.id,
		actions,
		built.signature,
	)
	built.locations[batch.id] = { row, column, actions: batch.specs }
	built.batches.push(batch)
	built.file.page.gridSize.maxRow = Math.max(Number(built.file.page.gridSize.maxRow || 0), row)
	return true
}

function augmentMeterRoutingHarness(built, snapshot, profile, outputEligibility, driveSource) {
	if (!driveSource || String(driveSource) === '0') {
		throw new Error('Meter routing requires a non-zero existing Playback source.')
	}
	const eligibility = new Map((outputEligibility || []).map((row) => [row.output, row.availability]))
	const value = (name) => snapshot.values?.[name] || { exists: false, value: '' }

	const laneBatches = []
	for (const lane of snapshot.shape.lanes || []) {
		const base = laneBase(lane)
		const specs = []
		for (let slot = 1; slot <= 24; slot++) {
			if (!value(`${base}_slot_${slot}_gain`).exists) continue
			specs.push({
				definitionId: 'mix_gain_set',
				options: { mix: lane.mix, side: lane.side, slot, level: METER_DRIVE_GAIN_DB },
			})
		}
		const id = `meter-route-${laneId(lane)}-gain-drive`
		if (
			appendBatch(built, {
				id,
				label: `${lane.mix} ${lane.side}\nMETER GAIN ${METER_DRIVE_GAIN_DB}`,
				specs,
			})
		) {
			laneBatches.push(id)
		}
	}

	const pairBatches = []
	for (const [left, right] of profile.outputPairs || []) {
		if (!snapshot.shape.outputs.includes(left) || !snapshot.shape.outputs.includes(right)) continue
		const leftAvailability = eligibility.get(left)
		const rightAvailability = eligibility.get(right)
		if (
			['UNAVAILABLE', 'UNKNOWN'].includes(leftAvailability) ||
			['UNAVAILABLE', 'UNKNOWN'].includes(rightAvailability)
		) {
			continue
		}
		if (!value(`output_${left + 1}_source`).exists || !value(`output_${right + 1}_source`).exists) continue
		const id = `meter-route-pair-${left + 1}-${right + 1}-source-drive`
		const specs = [
			{
				definitionId: 'output_pair_source',
				options: { output: String(left), source: String(driveSource) },
			},
		]
		if (appendBatch(built, { id, label: `PAIR ${left + 1}-${right + 1}\nMETER DRIVE`, specs })) {
			pairBatches.push({ id, left, right })
		}
	}

	return { built, laneBatches, pairBatches, driveSource: String(driveSource) }
}

function writeMeterRoutingPages(baseBuilt, augmentedBuilt) {
	fs.mkdirSync(generatedDir, { recursive: true })
	fs.writeFileSync(METER_ROUTING_PAGE, `${JSON.stringify(augmentedBuilt.file, null, '\t')}\n`, 'utf8')
	fs.writeFileSync(
		METER_ROUTING_BASE_RESTORE_PAGE,
		`${JSON.stringify(baseBuilt.file, null, '\t')}\n`,
		'utf8',
	)
	return {
		routing: METER_ROUTING_PAGE,
		baseRestore: METER_ROUTING_BASE_RESTORE_PAGE,
	}
}

module.exports = {
	METER_DRIVE_GAIN_DB,
	METER_ROUTING_PAGE,
	METER_ROUTING_BASE_RESTORE_PAGE,
	laneId,
	appendBatch,
	augmentMeterRoutingHarness,
	writeMeterRoutingPages,
}

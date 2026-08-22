'use strict'

function addV6InventoryRows(inventory, snapshot, profile) {
	const existing = new Set(inventory.rows.map((row) => row.id))
	for (const [left, right] of profile.outputPairs || []) {
		if (!snapshot.shape.outputs.includes(left) || !snapshot.shape.outputs.includes(right)) continue
		const id = `output-pair:${left + 1}-${right + 1}:topology`
		if (existing.has(id)) continue
		const leftSource = snapshot.values[`output_${left + 1}_source`]
		const rightSource = snapshot.values[`output_${right + 1}_source`]
		const capability = Boolean(leftSource?.exists && rightSource?.exists)
		inventory.rows.push({
			id,
			family: 'output_pair_topology',
			variable: `output_${left + 1}_source + output_${right + 1}_source`,
			availability: 'PAIR',
			r9ProbeCount: 0,
			state: '',
			stateKnown: Boolean(leftSource?.value !== '' && rightSource?.value !== ''),
			capability,
			risk: 'routing-observation',
			dependency: 'explicit-all-output-isolation + exact-pair-restore',
			status: capability ? 'DISCOVERED' : 'SKIP_NO_CAPABILITY',
			detail: '',
		})
	}

	const addManual = (id, family, detail) => {
		if (existing.has(id)) return
		inventory.rows.push({
			id,
			family,
			variable: '',
			availability: 'MANUAL',
			r9ProbeCount: 0,
			state: '',
			stateKnown: false,
			capability: true,
			risk: 'manual-read-observation',
			dependency: 'explicit-user-interaction',
			status: 'MANUAL_PENDING',
			detail,
		})
	}
	addManual(
		'manual:feedback-meter-dynamics',
		'feedback_manual_meter',
		'Manual signal/silence window is required to observe both threshold states on meter feedbacks where practical.',
	)
	addManual(
		'manual:monitor-gain-readback',
		'monitor_gain_1677_readback',
		'Monitor gain item 1677 is read-only; validation requires the user to move the physical Monitor control while TestBench observes server state.',
	)
}

module.exports = { addV6InventoryRows }

'use strict'

function isPairOwnedRuntimeResult(result) {
	if (!result || result.restored !== true) return false
	return (
		(result.routeOutcome === 'REQUESTED_ORIGINAL' && result.noneOutcome === 'ZERO_ORIGINAL') ||
		(result.routeOutcome === 'REQUESTED_ZERO' && result.noneOutcome === 'ZERO_ZERO')
	)
}

function derivePairOwnership(pairTopology = []) {
	const ownership = new Map()
	for (const result of pairTopology) {
		if (!isPairOwnedRuntimeResult(result)) continue
		const left = Number(result.left) - 1
		const right = Number(result.right) - 1
		if (!Number.isInteger(left) || !Number.isInteger(right) || left < 0 || right < 0) continue
		ownership.set(left, {
			role: 'pair-owner-left',
			mate: right,
			evidence: 'runtime-topology',
		})
		ownership.set(right, {
			role: 'pair-owned-right',
			mate: left,
			evidence: 'runtime-topology',
		})
	}
	return ownership
}

function isPairOwnedRight(ownership, output) {
	return ownership?.get(output)?.role === 'pair-owned-right'
}

function topologyResultForPair(pairTopology = [], left, right) {
	return pairTopology.find((result) => result.left === left + 1 && result.right === right + 1) || null
}

module.exports = {
	isPairOwnedRuntimeResult,
	derivePairOwnership,
	isPairOwnedRight,
	topologyResultForPair,
}

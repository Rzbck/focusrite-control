const { canonicalBool, readVariableOptional } = require('./FullTestBenchBase')

const AVAILABILITY_REVISION = 'full-v3-output-availability-20260821'

async function captureOutputAvailability(baseUrl, label, shape) {
	const entries = await Promise.all(
		shape.outputs.map(async (output) => {
			const variable = `output_${output + 1}_available`
			const item = await readVariableOptional(baseUrl, label, variable, 3000)
			return [output, { variable, ...item }]
		})
	)
	return new Map(entries)
}

function classifyOutputAvailability(shape, availabilityMap) {
	const available = []
	const unavailable = []
	const unknown = []
	const noFlag = []
	for (const output of shape.outputs) {
		const item = availabilityMap.get(output) || { exists: false, value: '' }
		if (!item.exists) {
			noFlag.push(output)
			continue
		}
		const value = canonicalBool(item.value)
		if (value === 'true') available.push(output)
		else if (value === 'false') unavailable.push(output)
		else unknown.push(output)
	}
	return {
		available,
		unavailable,
		unknown,
		noFlag,
		eligible: [...available, ...noFlag].sort((a, b) => a - b),
	}
}

function buildOutputExecutionSnapshot(snapshot, classification) {
	const eligible = new Set(classification.eligible)
	const values = {}
	for (const [name, item] of Object.entries(snapshot.values || {})) {
		const match = name.match(/^output_(\d+)_/)
		if (!match || eligible.has(Number(match[1]) - 1)) values[name] = item
	}
	for (const output of snapshot.shape.outputs) {
		let status = 'unknown'
		if (classification.available.includes(output)) status = 'available'
		else if (classification.unavailable.includes(output)) status = 'unavailable'
		else if (classification.noFlag.includes(output)) status = 'no-availability-flag'
		values[`__tb_output_${output + 1}_availability`] = { exists: true, value: status }
	}
	return {
		shape: { ...snapshot.shape, outputs: [...classification.eligible] },
		values,
		outputAvailability: classification,
	}
}

function recordOutputAvailabilitySkips(classification, reporter) {
	for (const output of classification.unavailable) {
		reporter.add('outputs', `output_${output + 1}`, 'SKIP_UNAVAILABLE', 'Server-confirmed output availability=false; normal FULL does not write this output.')
	}
	for (const output of classification.unknown) {
		reporter.add('outputs', `output_${output + 1}`, 'SKIP_AVAILABILITY_UNKNOWN', 'Output availability exists but is not server-confirmed; normal FULL does not write this output.')
	}
}

module.exports = {
	AVAILABILITY_REVISION,
	captureOutputAvailability,
	classifyOutputAvailability,
	buildOutputExecutionSnapshot,
	recordOutputAvailabilitySkips,
}

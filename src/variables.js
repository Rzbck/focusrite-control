const { safeVariableId } = require('./utils')

function register(defs, id, name) {
	if (!id) return
	defs[safeVariableId(id)] = { name }
}

function buildVariableDefinitions(instance) {
	const defs = {
		connection_status: { name: 'Connection status' },
		server_host: { name: 'Focusrite Control Server host' },
		server_port: { name: 'Focusrite Control Server port' },
		client_control_id: { name: 'Focusrite Control Server client ID' },
		client_authorised: { name: 'Focusrite Control client authorised' },
		device_model: { name: 'Device model' },
		device_serial: { name: 'Device serial' },
		device_protocol: { name: 'Device protocol' },
		device_id: { name: 'Control Server device ID' },
		firmware_version: { name: 'Firmware version' },
		device_nickname: { name: 'Device nickname' },
	}
	const device = instance.device
	if (!device) return defs

	const mon = device.monitoring || {}
	for (const key of ['gain', 'dim', 'mute', 'altEnable', 'alt', 'talkback', 'preset']) {
		if (mon[key]) register(defs, `monitor_${key}`, `Monitor ${key}`)
	}

	for (const [index, source] of device.sources.entries()) {
		const n = index + 1
		register(defs, `source_${n}_name`, `Source ${n}: name`)
		register(defs, `source_${n}_type`, `Source ${n}: type`)
		register(defs, `source_${n}_root_id`, `Source ${n}: root ID`)
		if (source.pairSide) register(defs, `source_${n}_pair_side`, `Source ${n}: schema pair side`)
		if (source.pairId) register(defs, `source_${n}_pair_root_id`, `Source ${n}: schema pair root ID`)
		for (const key of ['available', 'meter', 'nickname']) {
			if (source[key]) register(defs, `source_${n}_${key}`, `${source.name}: ${key}`)
		}
	}

	for (const [index, input] of device.hardwareInputs.entries()) {
		const n = index + 1
		register(defs, `input_${n}_name`, `Input ${n} name`)
		for (const key of ['available', 'meter', 'nickname', 'air', 'pad', 'mode']) {
			if (input[key]) register(defs, `input_${n}_${key}`, `${input.name}: ${key}`)
		}
	}

	for (const output of device.outputs) {
		const n = output.index + 1
		register(defs, `output_${n}_name`, `Output ${n} name`)
		for (const key of ['available', 'meter', 'mute', 'source', 'stereo', 'nickname', 'gain', 'hardwareControl']) {
			if (output[key]) register(defs, `output_${n}_${key}`, `${output.name}: ${key}`)
		}
		if (output.source) register(defs, `output_${n}_source_name`, `${output.name}: source name`)
		if (instance.config.exposeMixerVariables && output.assignMix) {
			register(defs, `output_${n}_assign_mix_class`, `${output.name}: assign-mix research value class (read-only)`)
			register(defs, `output_${n}_assign_mix_provenance`, `${output.name}: assign-mix state provenance (read-only)`)
		}
	}

	for (const [index] of device.mixerSlots.entries()) {
		const n = index + 1
		register(defs, `mixer_slot_${n}_source`, `Mixer slot ${n}: source`)
		register(defs, `mixer_slot_${n}_source_name`, `Mixer slot ${n}: source name`)
		register(defs, `mixer_slot_${n}_stereo`, `Mixer slot ${n}: stereo`)
	}

	for (const lane of device.mixes) {
		const base = `mix_${safeVariableId(lane.label || lane.name).toLowerCase()}`
		if (lane.meter) register(defs, `${base}_meter`, `${lane.label}: meter`)
		if (lane.talkback) register(defs, `${base}_talkback`, `${lane.label}: talkback`)
		if (instance.config.exposeMixerVariables) {
			for (const input of lane.inputs) {
				const slot = input.index + 1
				for (const key of ['gain', 'pan', 'mute', 'solo']) {
					if (input[key]) register(defs, `${base}_slot_${slot}_${key}`, `${lane.label} slot ${slot}: ${key}`)
				}
				for (const key of ['gain', 'mute', 'solo']) {
					if (input[key]) {
						register(
							defs,
							`${base}_slot_${slot}_${key}_provenance`,
							`${lane.label} slot ${slot}: ${key} state provenance`,
						)
					}
				}
			}
		}
	}

	const settings = device.settings || {}
	for (const key of [
		'devicePreset',
		'clockLocked',
		'clockSource',
		'sampleRate',
		'clockMaster',
		'bufferSize',
		'spdifMode',
		'phantomPersistence',
		'talkbackInputSource',
		'talkbackSourceAttenuation',
		'talkbackAvailable',
	]) {
		if (settings[key]) register(defs, `device_${key}`, `Device ${key}`)
	}
	return defs
}

function findSourceName(instance, rawId) {
	if (rawId === undefined || rawId === null || rawId === '') return ''
	if (String(rawId) === '0') return 'None / Unassigned'
	const id = String(rawId)
	const source = instance.device?.sources?.find((s) => String(s.id) === id)
	if (source) return source.name
	const mix = instance.device?.mixes?.find((m) => String(m.id) === id)
	if (mix) return mix.label || mix.name
	return id
}

function buildVariableValues(instance) {
	const client = instance.client
	let connectionStatus = 'Disconnected'
	if (client?.connected) {
		if (client.authorised === false) connectionStatus = 'Connected / approval required'
		else if (client.authorised === true && client.ready) connectionStatus = 'Connected / authorised'
		else if (client.ready) connectionStatus = 'Connected / waiting for approval'
		else connectionStatus = 'Connected / syncing'
	}

	const values = {
		connection_status: connectionStatus,
		server_host: client?.server?.host || '',
		server_port: client?.server?.port || '',
		client_control_id: client?.serverClientId || '',
		client_authorised: client?.authorised === true ? 'true' : client?.authorised === false ? 'false' : '',
		device_model: instance.device?.model || '',
		device_serial: instance.device?.serial || '',
		device_protocol: instance.device?.protocol || '',
		device_id: instance.device?.id || '',
		firmware_version: instance.client?.getValue(instance.device?.descriptors?.has('8') ? '8' : '') || '',
		device_nickname: instance.device?.nickname ? (instance.client?.getValue(instance.device.nickname) ?? '') : '',
	}
	const device = instance.device
	if (!device) return values
	const get = (id) => (id ? (instance.client?.getValue(id) ?? '') : '')
	const provenance = (id) => (id ? (instance.client?.getValueProvenance?.(id) ?? '') : '')
	const assignMixClasses = new Map()
	let nextAssignMixClass = 1
	const assignMixClass = (id) => {
		const raw = get(id)
		if (raw === '') return ''
		if (!assignMixClasses.has(raw)) {
			assignMixClasses.set(raw, `V${nextAssignMixClass}`)
			nextAssignMixClass += 1
		}
		return assignMixClasses.get(raw)
	}

	const mon = device.monitoring || {}
	for (const key of ['gain', 'dim', 'mute', 'altEnable', 'alt', 'talkback', 'preset']) {
		if (mon[key]) values[`monitor_${key}`] = get(mon[key])
	}

	for (const [index, source] of device.sources.entries()) {
		const n = index + 1
		values[`source_${n}_name`] = source.name
		values[`source_${n}_type`] = source.type
		values[`source_${n}_root_id`] = source.id
		if (source.pairSide) values[`source_${n}_pair_side`] = source.pairSide
		if (source.pairId) values[`source_${n}_pair_root_id`] = source.pairId
		for (const key of ['available', 'meter', 'nickname']) {
			if (source[key]) values[`source_${n}_${key}`] = get(source[key])
		}
	}

	for (const [index, input] of device.hardwareInputs.entries()) {
		const n = index + 1
		values[`input_${n}_name`] = input.name
		for (const key of ['available', 'meter', 'nickname', 'air', 'pad', 'mode']) {
			if (input[key]) values[`input_${n}_${key}`] = get(input[key])
		}
	}

	for (const output of device.outputs) {
		const n = output.index + 1
		values[`output_${n}_name`] = output.name
		for (const key of ['available', 'meter', 'mute', 'source', 'stereo', 'nickname', 'gain', 'hardwareControl']) {
			if (output[key]) values[`output_${n}_${key}`] = get(output[key])
		}
		if (output.source) values[`output_${n}_source_name`] = findSourceName(instance, get(output.source))
		if (instance.config.exposeMixerVariables && output.assignMix) {
			values[`output_${n}_assign_mix_class`] = assignMixClass(output.assignMix)
			values[`output_${n}_assign_mix_provenance`] = provenance(output.assignMix)
		}
	}

	for (const [index, slot] of device.mixerSlots.entries()) {
		const n = index + 1
		const raw = get(slot.source)
		values[`mixer_slot_${n}_source`] = raw
		values[`mixer_slot_${n}_source_name`] = findSourceName(instance, raw)
		values[`mixer_slot_${n}_stereo`] = get(slot.stereo)
	}

	for (const lane of device.mixes) {
		const base = `mix_${safeVariableId(lane.label || lane.name).toLowerCase()}`
		if (lane.meter) values[`${base}_meter`] = get(lane.meter)
		if (lane.talkback) values[`${base}_talkback`] = get(lane.talkback)
		if (instance.config.exposeMixerVariables) {
			for (const input of lane.inputs) {
				const slot = input.index + 1
				for (const key of ['gain', 'pan', 'mute', 'solo']) {
					if (input[key]) values[`${base}_slot_${slot}_${key}`] = get(input[key])
				}
				for (const key of ['gain', 'mute', 'solo']) {
					if (input[key]) values[`${base}_slot_${slot}_${key}_provenance`] = provenance(input[key])
				}
			}
		}
	}

	const settings = device.settings || {}
	for (const key of [
		'devicePreset',
		'clockLocked',
		'clockSource',
		'sampleRate',
		'clockMaster',
		'bufferSize',
		'spdifMode',
		'phantomPersistence',
		'talkbackInputSource',
		'talkbackSourceAttenuation',
		'talkbackAvailable',
	]) {
		if (settings[key]) values[`device_${key}`] = get(settings[key])
	}
	return values
}

module.exports = { buildVariableDefinitions, buildVariableValues, findSourceName }

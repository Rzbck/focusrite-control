const { parseAttrs, xmlDecode } = require('./utils')

function firstMatch(text, rx, group = 1) {
	const match = text?.match(rx)
	return match ? match[group] : ''
}

function enumValues(text = '') {
	const values = []
	const rx = /<enum\b([^>]*)\/?>/g
	let match
	while ((match = rx.exec(text)) !== null) {
		const attrs = parseAttrs(match[1])
		if (attrs.value !== undefined) values.push(attrs.value)
	}
	return values
}

function controlId(content, tag) {
	const rx = new RegExp(`<${tag}(?=\\s|/|>)([^>]*)\\/?>`, 'i')
	const match = content?.match(rx)
	if (!match) return null
	return parseAttrs(match[1]).id || null
}

function controlWithEnums(content, tag) {
	const rx = new RegExp(`<${tag}(?=\\s|>)([^>]*)>([\\s\\S]*?)<\\/${tag}>`, 'i')
	const match = content?.match(rx)
	if (!match) {
		const id = controlId(content, tag)
		return id ? { id, enums: [] } : null
	}
	const attrs = parseAttrs(match[1])
	return attrs.id ? { id: attrs.id, enums: enumValues(match[2]) } : null
}

function blocks(content = '', tag) {
	const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
	const rx = new RegExp(`<${escaped}\\b([^>]*)>([\\s\\S]*?)<\\/${escaped}>`, 'gi')
	const result = []
	let match
	while ((match = rx.exec(content)) !== null) {
		result.push({ attrs: parseAttrs(match[1]), content: match[2], raw: match[0] })
	}
	return result
}

function registerDescriptor(device, id, descriptor = {}) {
	if (!id) return
	const existing = device.descriptors.get(String(id)) || { id: String(id) }
	device.descriptors.set(String(id), { ...existing, ...descriptor, id: String(id) })
}

function registerAllIds(device, xml) {
	const rx = /<([A-Za-z0-9_-]+)\b([^>]*)>/g
	let match
	while ((match = rx.exec(xml)) !== null) {
		const attrs = parseAttrs(match[2])
		if (!attrs.id || !/^\d+$/.test(attrs.id)) continue
		registerDescriptor(device, attrs.id, {
			tag: match[1],
			name: attrs.name || match[1],
			min: attrs.min,
			max: attrs.max,
		})
		// Preserve values included by Control Server in device-arrival as
		// server-confirmed state. Never invent a default when value is absent.
		if (attrs.value !== undefined) device.initialState.set(String(attrs.id), String(attrs.value))
	}
}

function parseSources(device, xml) {
	const section = firstMatch(xml, /<\/mixer>\s*<inputs>([\s\S]*?)<\/inputs>\s*<outputs>/i)
	if (!section) return

	const tagOrder = ['analogue', 'spdif-rca', 'adat', 'playback']
	let sourceIndex = 0
	let previousPair = null
	for (const tag of tagOrder) {
		for (const block of blocks(section, tag)) {
			const a = block.attrs
			if (!a.name) continue
			const source = {
				index: sourceIndex++,
				id: a.id,
				type: tag,
				name: a.name,
				stereoName: a['stereo-name'] || '',
				hidden: a.hidden === 'true',
				supportsTalkback: a['supports-talkback'] === 'true',
				port: a.port || null,
				available: controlId(block.content, 'available'),
				meter: controlId(block.content, 'meter'),
				nickname: controlId(block.content, 'nickname'),
				air: controlId(block.content, 'air'),
				pad: controlId(block.content, 'pad'),
			}
			const mode = controlWithEnums(block.content, 'mode')
			if (mode) {
				source.mode = mode.id
				source.modeValues = mode.enums
			}

			if (source.stereoName) {
				source.pairLabel = source.stereoName
				source.pairSide = 'L'
				previousPair = source
			} else if (previousPair && previousPair.type === source.type) {
				source.pairLabel = previousPair.pairLabel
				source.pairSide = 'R'
				previousPair.pairId = source.id
				source.pairId = previousPair.id
				previousPair = null
			} else {
				previousPair = null
			}

			device.sources.push(source)
			if (source.type === 'analogue' && /^Analogue \d+$/i.test(source.name) && !source.hidden) {
				device.hardwareInputs.push(source)
			}
			for (const [key, value] of Object.entries(source)) {
				if (!value || !['available', 'meter', 'nickname', 'air', 'pad', 'mode'].includes(key)) continue
				registerDescriptor(device, value, {
					name: `${source.name} ${key}`,
					category: 'input',
					control: key,
					ownerId: source.id,
				})
			}
		}
	}
}

function parseOutputs(device, xml) {
	const section = firstMatch(xml, /<outputs>([\s\S]*?)<\/outputs>\s*<record-outputs/i)
	if (!section) return
	const tagOrder = ['analogue', 'spdif-rca', 'adat', 'loopback']
	let index = 0
	let previousPair = null
	for (const tag of tagOrder) {
		for (const block of blocks(section, tag)) {
			const a = block.attrs
			if (!a.name) continue
			const output = {
				index: index++,
				type: tag,
				name: a.name,
				stereoName: a['stereo-name'] || '',
				headphone: a.headphone || null,
				monitor: a.monitor === 'true',
				available: controlId(block.content, 'available'),
				meter: controlId(block.content, 'meter'),
				assignMix: controlId(block.content, 'assign-mix'),
				assignTalkbackMix: controlId(block.content, 'assign-talkback-mix'),
				mute: controlId(block.content, 'mute'),
				source: controlId(block.content, 'source'),
				stereo: controlId(block.content, 'stereo'),
				nickname: controlId(block.content, 'nickname'),
				hardwareControl: controlId(block.content, 'hardware-control'),
				gain: controlId(block.content, 'gain'),
			}
			if (output.stereoName) {
				output.pairLabel = output.stereoName
				output.pairSide = 'L'
				previousPair = output
			} else if (previousPair && previousPair.type === output.type) {
				output.pairLabel = previousPair.pairLabel
				output.pairSide = 'R'
				output.pairIndex = previousPair.index
				previousPair.pairIndex = output.index
				previousPair = null
			} else {
				previousPair = null
			}
			device.outputs.push(output)
			for (const [key, value] of Object.entries(output)) {
				if (
					!value ||
					!['available', 'meter', 'mute', 'source', 'stereo', 'nickname', 'hardwareControl', 'gain'].includes(key)
				)
					continue
				registerDescriptor(device, value, {
					name: `${output.name} ${key}`,
					category: 'output',
					control: key,
					ownerIndex: output.index,
				})
			}
		}
	}
}

function parseMixer(device, xml) {
	const mixer = firstMatch(xml, /<mixer>([\s\S]*?)<\/mixer>/i)
	if (!mixer) return

	const inputDefs = firstMatch(mixer, /<inputs>([\s\S]*?)<\/inputs>/i)
	for (const [index, block] of blocks(inputDefs, 'input').entries()) {
		const source = controlId(block.content, 'source')
		const stereo = controlId(block.content, 'stereo')
		const slot = { index, source, stereo }
		device.mixerSlots.push(slot)
		registerDescriptor(device, source, {
			name: `Mixer slot ${index + 1} source`,
			category: 'mixer-slot',
			control: 'source',
			ownerIndex: index,
		})
		registerDescriptor(device, stereo, {
			name: `Mixer slot ${index + 1} stereo`,
			category: 'mixer-slot',
			control: 'stereo',
			ownerIndex: index,
		})
	}

	const mixesSection = firstMatch(mixer, /<mixes>([\s\S]*?)<\/mixes>/i)
	let previousLane = null
	for (const block of blocks(mixesSection, 'mix')) {
		const a = block.attrs
		const lane = {
			id: a.id,
			name: a.name || `Mix ${device.mixes.length + 1}`,
			stereoName: a['stereo-name'] || '',
			talkback: controlId(block.content, 'talkback'),
			meter: controlId(block.content, 'meter'),
			inputs: [],
		}
		if (lane.stereoName) {
			lane.side = 'L'
			lane.label = `${lane.name} L`
			previousLane = lane
		} else if (previousLane && previousLane.name === lane.name) {
			lane.side = 'R'
			lane.label = `${lane.name} R`
			lane.pairId = previousLane.id
			previousLane.pairId = lane.id
			previousLane = null
		} else {
			lane.side = ''
			lane.label = lane.name
			previousLane = null
		}

		for (const [index, inputBlock] of blocks(block.content, 'input').entries()) {
			const input = {
				index,
				gain: controlId(inputBlock.content, 'gain'),
				pan: controlId(inputBlock.content, 'pan'),
				mute: controlId(inputBlock.content, 'mute'),
				solo: controlId(inputBlock.content, 'solo'),
			}
			lane.inputs.push(input)
			for (const [key, value] of Object.entries(input)) {
				if (!value || !['gain', 'pan', 'mute', 'solo'].includes(key)) continue
				registerDescriptor(device, value, {
					name: `${lane.label} slot ${index + 1} ${key}`,
					category: 'mix',
					control: key,
					mixId: lane.id,
					ownerIndex: index,
				})
			}
		}
		registerDescriptor(device, lane.talkback, {
			name: `${lane.label} talkback`,
			category: 'mix',
			control: 'talkback',
			mixId: lane.id,
		})
		registerDescriptor(device, lane.meter, {
			name: `${lane.label} meter`,
			category: 'mix',
			control: 'meter',
			mixId: lane.id,
		})
		device.mixes.push(lane)
	}
}

function parseMonitoring(device, xml) {
	const section = firstMatch(xml, /<monitoring>([\s\S]*?)<\/monitoring>/i)
	if (!section) return

	const groupMatch = section.match(/<hardware-controls\b[^>]*exclusive="[^"]*"[^>]*>([\s\S]*?)<\/hardware-controls>/i)
	const group = groupMatch ? groupMatch[1] : ''
	device.monitoring = {
		gain: controlId(group, 'gain'),
		dim: controlId(group, 'dim'),
		mute: controlId(group, 'mute'),
		altEnable: controlId(group, 'alt-enable'),
		alt: controlId(group, 'alt'),
		talkback: controlId(section, 'talkback'),
		preset: null,
		presetValues: [],
	}

	const preset = controlWithEnums(section, 'preset')
	if (preset) {
		device.monitoring.preset = preset.id
		device.monitoring.presetValues = preset.enums
	}

	for (const [key, id] of Object.entries(device.monitoring)) {
		if (!id || Array.isArray(id) || key === 'presetValues') continue
		registerDescriptor(device, id, { name: `Monitor ${key}`, category: 'monitor', control: key })
	}
}

function parseDeviceSettings(device, xml) {
	const rootPreset = firstMatch(xml, /<device\s+[\s\S]*?<preset\b([^>]*)>([\s\S]*?)<\/preset>\s*<firmware>/i, 0)
	if (rootPreset) {
		const id = firstMatch(rootPreset, /<preset\b([^>]*)>/i)
		const attrs = parseAttrs(id)
		device.settings.devicePreset = attrs.id || null
		device.settings.devicePresetValues = enumValues(rootPreset)
		registerDescriptor(device, device.settings.devicePreset, {
			name: 'Device preset',
			category: 'settings',
			control: 'devicePreset',
		})
	}

	const clocking = firstMatch(xml, /<clocking>([\s\S]*?)<\/clocking>/i)
	const clockSource = controlWithEnums(clocking, 'clock-source')
	const sampleRate = controlWithEnums(clocking, 'sample-rate')
	device.settings.clockLocked = controlId(clocking, 'locked')
	device.settings.clockSource = clockSource?.id || null
	device.settings.clockSourceValues = clockSource?.enums || []
	device.settings.sampleRate = sampleRate?.id || null
	device.settings.sampleRateValues = sampleRate?.enums || []
	device.settings.clockMaster = controlId(clocking, 'clock-master')

	const settings = firstMatch(xml, /<settings>([\s\S]*?)<\/settings>/i)
	device.settings.bufferSize = controlId(settings, 'buffer-size')
	const spdif = controlWithEnums(settings, 'mode')
	device.settings.spdifMode = spdif?.id || null
	device.settings.spdifModeValues = spdif?.enums || []
	device.settings.phantomPersistence = controlId(settings, 'phantom-persistence')
	device.settings.talkbackInputSource = controlId(settings, 'talkback-input-source')
	device.settings.talkbackSourceAttenuation = controlId(settings, 'source-attenuation')
	device.settings.talkbackAvailable = controlId(settings, 'talkback-available')

	const quickStart = firstMatch(xml, /<quick-start\b[^>]*>([\s\S]*?)<\/quick-start>/i)
	device.settings.msdMode = controlId(quickStart, 'msd-mode')

	for (const key of [
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
		'msdMode',
	]) {
		const id = device.settings[key]
		registerDescriptor(device, id, { name: key, category: 'settings', control: key })
	}
}

function buildWritableIds(device) {
	const ids = new Set()
	const add = (id) => id && ids.add(String(id))

	for (const input of device.hardwareInputs) {
		add(input.air)
		add(input.pad)
		add(input.mode)
		add(input.nickname)
	}
	for (const output of device.outputs) {
		add(output.mute)
		add(output.source)
		add(output.stereo)
		add(output.nickname)
		add(output.gain)
	}
	for (const slot of device.mixerSlots) {
		add(slot.source)
		add(slot.stereo)
	}
	for (const lane of device.mixes) {
		add(lane.talkback)
		for (const input of lane.inputs) {
			add(input.gain)
			add(input.pan)
			add(input.mute)
			add(input.solo)
		}
	}
	add(device.nickname)
	for (const key of ['dim', 'mute', 'altEnable', 'alt', 'talkback', 'preset']) add(device.monitoring[key])
	for (const key of [
		'devicePreset',
		'clockSource',
		'sampleRate',
		'spdifMode',
		'phantomPersistence',
		'talkbackInputSource',
	]) {
		add(device.settings[key])
	}

	// Intentionally NOT writable through the advanced action:
	// meters, availability flags, firmware/reset/snapshot commands, buffer size,
	// Monitor gain 1677, talkback source attenuation (range not verified), clock status/master.
	device.writableIds = ids
}

function buildMeterIds(device) {
	const ids = new Set()
	for (const source of device.sources) if (source.meter) ids.add(String(source.meter))
	for (const output of device.outputs) if (output.meter) ids.add(String(output.meter))
	for (const mix of device.mixes) if (mix.meter) ids.add(String(mix.meter))
	device.meterIds = ids
}

function parseDeviceArrival(xml) {
	const deviceMatch = xml.match(/<device\s+([^>]*)>([\s\S]*?)<\/device>/i)
	if (!deviceMatch) return null
	const attrs = parseAttrs(deviceMatch[1])
	const deviceXml = deviceMatch[0]
	const device = {
		id: attrs.id,
		protocol: attrs.protocol || '',
		model: attrs.model || '',
		className: attrs.class || '',
		serial: attrs['serial-number'] || attrs.serial || '',
		version: attrs.version || '',
		nickname: null,
		descriptors: new Map(),
		initialState: new Map(),
		sources: [],
		hardwareInputs: [],
		outputs: [],
		mixerSlots: [],
		mixes: [],
		monitoring: {},
		settings: {},
		writableIds: new Set(),
		meterIds: new Set(),
		rawXml: deviceXml,
	}
	registerAllIds(device, deviceXml)
	parseSources(device, deviceXml)
	parseOutputs(device, deviceXml)
	parseMixer(device, deviceXml)
	parseMonitoring(device, deviceXml)
	parseDeviceSettings(device, deviceXml)
	device.nickname = controlId(deviceXml, 'nickname')
	buildWritableIds(device)
	buildMeterIds(device)
	return device
}

function parseSetMessage(xml) {
	const setMatch = xml.match(/<set\b([^>]*)>([\s\S]*?)<\/set>/i)
	if (!setMatch) return null
	const attrs = parseAttrs(setMatch[1])
	const items = []
	const rx = /<item\b([^>]*)\/?>/gi
	let match
	while ((match = rx.exec(setMatch[2])) !== null) {
		const a = parseAttrs(match[1])
		if (a.id !== undefined) items.push({ id: a.id, value: xmlDecode(a.value ?? '') })
	}
	return { deviceId: attrs.devid, items }
}

function parseServerAnnouncement(xml) {
	if (!/<server-announcement\b/i.test(xml)) return null
	const attrs = parseAttrs(firstMatch(xml, /<server-announcement\b([^>]*)\/?>/i))
	const port = Number(attrs.port)
	return Number.isInteger(port) && port > 0 && port <= 65535 ? { port, attrs } : null
}

module.exports = {
	parseDeviceArrival,
	parseSetMessage,
	parseServerAnnouncement,
	enumValues,
	parseAttrs,
}

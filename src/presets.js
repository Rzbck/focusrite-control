const { combineRgb } = require('@companion-module/base')

const WHITE = combineRgb(255, 255, 255)
const BLACK = combineRgb(0, 0, 0)
const RED = combineRgb(210, 0, 0)
const GREEN = combineRgb(0, 160, 0)
const AMBER = combineRgb(210, 140, 0)
const BLUE = combineRgb(0, 90, 210)
const DARK = combineRgb(20, 20, 20)

function simplePreset(name, text, actionId, options, feedbacks = []) {
	return {
		type: 'simple',
		name,
		style: { text, size: '14', color: WHITE, bgcolor: DARK },
		steps: [{ down: [{ actionId, options }], up: [] }],
		feedbacks,
	}
}

function feedback(feedbackId, options, bgcolor, color = WHITE) {
	return { feedbackId, options, style: { bgcolor, color } }
}

function getPresets(instance) {
	const presets = {}
	const structure = []
	const device = instance.device

	const monitorIds = []
	if (device?.monitoring?.mute) {
		presets.monitor_mute = simplePreset(
			'Monitor Mute',
			'MUTE\nMON',
			'monitor_mute',
			{ state: 'toggle' },
			[feedback('monitor_mute', {}, RED)],
		)
		monitorIds.push('monitor_mute')
	}
	if (device?.monitoring?.dim) {
		presets.monitor_dim = simplePreset('Monitor Dim', 'DIM', 'monitor_dim', { state: 'toggle' }, [
			feedback('monitor_dim', {}, AMBER, BLACK),
		])
		monitorIds.push('monitor_dim')
	}
	if (device?.monitoring?.talkback) {
		presets.monitor_talkback_toggle = simplePreset(
			'Talkback Toggle',
			'TALK',
			'monitor_talkback',
			{ state: 'toggle' },
			[feedback('monitor_talkback', {}, GREEN)],
		)
		presets.monitor_talkback_ptt = {
			type: 'simple',
			name: 'Talkback Push-to-talk',
			style: { text: 'TALK\nPTT', size: '14', color: WHITE, bgcolor: DARK },
			steps: [
				{
					down: [{ actionId: 'monitor_talkback', options: { state: 'on' } }],
					up: [{ actionId: 'monitor_talkback', options: { state: 'off' } }],
				},
			],
			feedbacks: [feedback('monitor_talkback', {}, GREEN)],
		}
		monitorIds.push('monitor_talkback_toggle', 'monitor_talkback_ptt')
	}
	if (device?.monitoring?.alt) {
		presets.monitor_alt = simplePreset('Alt Speakers', 'ALT', 'monitor_alt', { state: 'toggle' }, [
			feedback('monitor_alt', {}, BLUE),
		])
		monitorIds.push('monitor_alt')
	}
	if (monitorIds.length) {
		structure.push({
			id: 'monitor',
			name: 'Monitor',
			definitions: [{ id: 'monitor-controls', type: 'simple', name: 'Monitor controls', presets: monitorIds }],
		})
	}

	const airIds = []
	const padIds = []
	const modeIds = []
	for (const [index, input] of device?.hardwareInputs?.entries?.() || []) {
		const ch = index + 1
		if (input.air) {
			const id = `air_${ch}`
			presets[id] = simplePreset(`Air ${ch}`, `AIR\n${ch}`, 'input_air', { input: String(index), state: 'toggle' }, [
				feedback('input_air', { input: String(index) }, AMBER, BLACK),
			])
			airIds.push(id)
		}
		if (input.pad) {
			const id = `pad_${ch}`
			presets[id] = simplePreset(`Pad ${ch}`, `PAD\n${ch}`, 'input_pad', { input: String(index), state: 'toggle' }, [
				feedback('input_pad', { input: String(index) }, BLUE),
			])
			padIds.push(id)
		}
		if (input.mode) {
			const id = `mode_${ch}`
			presets[id] = simplePreset(`Cycle mode ${ch}`, `MODE\n${ch}`, 'input_mode_cycle', { input: String(index) })
			modeIds.push(id)
		}
	}
	if (airIds.length || padIds.length || modeIds.length) {
		const definitions = []
		if (airIds.length) definitions.push({ id: 'input-air', type: 'simple', name: 'Air', presets: airIds })
		if (padIds.length) definitions.push({ id: 'input-pad', type: 'simple', name: 'Pad', presets: padIds })
		if (modeIds.length) definitions.push({ id: 'input-mode', type: 'simple', name: 'Line / Instrument mode', presets: modeIds })
		structure.push({ id: 'inputs', name: 'Inputs', definitions })
	}

	const outputMuteIds = []
	for (const output of device?.outputs || []) {
		if (!output.mute) continue
		const id = `output_mute_${output.index + 1}`
		presets[id] = simplePreset(
			`Mute ${output.name}`,
			`MUTE\n${output.name.replace('Monitor Output ', 'MON ').replace('Line Output ', 'OUT ').replace('S/PDIF Output ', 'SPDIF ').replace('ADAT Output ', 'ADAT ').replace('Loopback ', 'LB ')}`,
			'output_mute',
			{ output: String(output.index), scope: 'single', state: 'toggle' },
			[feedback('output_mute', { output: String(output.index) }, RED)],
		)
		outputMuteIds.push(id)
	}
	if (outputMuteIds.length) {
		structure.push({
			id: 'outputs',
			name: 'Outputs',
			definitions: [{ id: 'output-mutes', type: 'simple', name: 'Output mutes', presets: outputMuteIds }],
		})
	}

	const mixMuteIds = []
	const mixSoloIds = []
	for (const mixName of [...new Set((device?.mixes || []).map((mix) => mix.name))]) {
		for (let slot = 1; slot <= 8; slot++) {
			const safeMix = mixName.replace(/\s+/g, '_').toLowerCase()
			const muteId = `mix_${safeMix}_slot_${slot}_mute`
			const soloId = `mix_${safeMix}_slot_${slot}_solo`
			presets[muteId] = simplePreset(
				`${mixName} slot ${slot} mute`,
				`${mixName}\n${slot} MUTE`,
				'mix_mute',
				{ mix: mixName, side: 'both', slot, state: 'toggle' },
			)
			presets[soloId] = simplePreset(
				`${mixName} slot ${slot} solo`,
				`${mixName}\n${slot} SOLO`,
				'mix_solo',
				{ mix: mixName, side: 'both', slot, state: 'toggle' },
			)
			mixMuteIds.push(muteId)
			mixSoloIds.push(soloId)
		}
	}
	if (mixMuteIds.length) {
		structure.push({
			id: 'mixer',
			name: 'Mixer',
			definitions: [
				{ id: 'mix-mutes', type: 'simple', name: 'Mix slot mutes (slots 1-8)', presets: mixMuteIds },
				{ id: 'mix-solos', type: 'simple', name: 'Mix slot solos (slots 1-8)', presets: mixSoloIds },
			],
		})
	}

	return { structure, presets }
}

module.exports = { getPresets }

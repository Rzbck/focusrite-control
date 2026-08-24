const { TARGET_MODEL } = require('./readback-probe-lib')

function canonicalBool(value) {
	const normalized = String(value ?? '')
		.trim()
		.toLowerCase()
	if (normalized === 'true' || normalized === '1') return true
	if (normalized === 'false' || normalized === '0') return false
	return null
}

function createStatePresenceCollector(device) {
	if (!device || device.model !== TARGET_MODEL) {
		throw new Error(`Unsupported Focusrite model. Expected exactly '${TARGET_MODEL}'.`)
	}
	const collector = {
		deviceId: String(device.id),
		seen: new Map(),
		source: new Map(),
		setPackets: 0,
		setItems: 0,
	}
	for (const [id, value] of device.initialState || []) {
		const key = String(id)
		collector.seen.set(key, String(value))
		collector.source.set(key, 'ARRIVAL')
	}
	return collector
}

function applySetPresence(collector, setMessage) {
	if (!collector || !setMessage) return false
	if (String(setMessage.deviceId) !== String(collector.deviceId)) return false
	collector.setPackets += 1
	for (const item of setMessage.items || []) {
		const id = String(item.id)
		collector.setItems += 1
		collector.seen.set(id, String(item.value))
		collector.source.set(id, 'SET')
	}
	return true
}

function choosePlaybackCandidate(candidates) {
	const usable = candidates.filter(
		(candidate) =>
			candidate && candidate.raw && String(candidate.raw) !== '0' && /playback/i.test(String(candidate.name || '')),
	)
	usable.sort((a, b) => Number(Boolean(b.stereo)) - Number(Boolean(a.stereo)) || Number(a.slot) - Number(b.slot))
	return usable[0] || null
}

function detectPlaybackSlot(device, collector) {
	const sourceById = new Map((device.sources || []).map((source) => [String(source.id), source]))
	const candidates = []
	for (const slot of device.mixerSlots || []) {
		if (!slot.source) continue
		const raw = collector.seen.get(String(slot.source))
		if (raw === undefined || raw === null || String(raw).trim() === '') continue
		const source = sourceById.get(String(raw))
		if (!source) continue
		candidates.push({
			slot: Number(slot.index) + 1,
			raw: String(raw),
			name: String(source.name || ''),
			stereo: slot.stereo ? canonicalBool(collector.seen.get(String(slot.stereo))) === true : false,
		})
	}
	return choosePlaybackCandidate(candidates)
}

function presenceClass(collector, itemId) {
	if (!itemId) return 'MISSING'
	return collector.source.get(String(itemId)) || 'MISSING'
}

function laneSide(lane) {
	if (lane.side === 'L') return 'left'
	if (lane.side === 'R') return 'right'
	return String(lane.side || '')
}

function buildMixPresenceRows(device, collector, playbackSlot) {
	const index = Number(playbackSlot) - 1
	if (!Number.isInteger(index) || index < 0 || index >= 24) {
		throw new Error(`Invalid detected Playback slot ${playbackSlot}.`)
	}
	const rows = []
	for (const lane of device.mixes || []) {
		const input = lane.inputs?.[index]
		if (!input?.gain || !input?.mute || !input?.solo) {
			throw new Error(`Schema missing gain/mute/solo for ${lane.label || lane.name} slot ${playbackSlot}.`)
		}
		const gain = presenceClass(collector, input.gain)
		const mute = presenceClass(collector, input.mute)
		const solo = presenceClass(collector, input.solo)
		rows.push({
			mix: String(lane.name || ''),
			side: laneSide(lane),
			gain,
			mute,
			solo,
			exactPresence: gain !== 'MISSING' && mute !== 'MISSING' && solo !== 'MISSING',
		})
	}
	if (rows.length !== 12) throw new Error(`Unexpected mix lane count ${rows.length}; expected 12.`)
	return rows
}

function summarizeMixPresence(rows) {
	return {
		total: rows.length,
		exactPresence: rows.filter((row) => row.exactPresence).length,
		missingAny: rows.filter((row) => !row.exactPresence).length,
	}
}

module.exports = {
	canonicalBool,
	createStatePresenceCollector,
	applySetPresence,
	choosePlaybackCandidate,
	detectPlaybackSlot,
	presenceClass,
	buildMixPresenceRows,
	summarizeMixPresence,
}

const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')
const buildSynthetic18i20Schema = require('../test-support/synthetic-18i20')
const { parseDeviceArrival, parseSetMessage } = require('../tools/readback-probe-lib')
const {
	createStatePresenceCollector,
	applySetPresence,
	detectPlaybackSlot,
	buildMixPresenceRows,
	summarizeMixPresence,
} = require('../tools/mix-presence-probe-lib')

const repoRoot = path.resolve(__dirname, '..')

test('direct mix presence probe detects Playback dynamically and reports presence classes without values', () => {
	const device = parseDeviceArrival(buildSynthetic18i20Schema())
	const collector = createStatePresenceCollector(device)
	const playback = device.sources.find((source) => source.type === 'playback' && /Playback 1/i.test(source.name))
	assert.ok(playback)

	const slot = device.mixerSlots[2]
	const left = device.mixes.find((lane) => lane.name === 'Mix A' && lane.side === 'L')
	const right = device.mixes.find((lane) => lane.name === 'Mix A' && lane.side === 'R')
	assert.ok(slot?.source)
	assert.ok(slot?.stereo)
	assert.ok(left?.inputs?.[2])
	assert.ok(right?.inputs?.[2])

	applySetPresence(
		collector,
		parseSetMessage(
			`<set devid="${device.id}">` +
				`<item id="${slot.source}" value="${playback.id}"/>` +
				`<item id="${slot.stereo}" value="true"/>` +
				`<item id="${left.inputs[2].gain}" value="-24"/>` +
				`<item id="${left.inputs[2].mute}" value="false"/>` +
				`<item id="${left.inputs[2].solo}" value="true"/>` +
				`<item id="${right.inputs[2].gain}" value="-20"/>` +
				`</set>`,
		),
	)

	const selected = detectPlaybackSlot(device, collector)
	assert.equal(selected.slot, 3)
	assert.match(selected.name, /Playback 1/i)
	assert.equal(selected.stereo, true)

	const rows = buildMixPresenceRows(device, collector, selected.slot)
	const leftRow = rows.find((row) => row.mix === 'Mix A' && row.side === 'left')
	const rightRow = rows.find((row) => row.mix === 'Mix A' && row.side === 'right')
	assert.deepEqual(leftRow, {
		mix: 'Mix A',
		side: 'left',
		gain: 'SET',
		mute: 'SET',
		solo: 'SET',
		exactPresence: true,
	})
	assert.deepEqual(rightRow, {
		mix: 'Mix A',
		side: 'right',
		gain: 'SET',
		mute: 'MISSING',
		solo: 'MISSING',
		exactPresence: false,
	})
	assert.deepEqual(summarizeMixPresence(rows), { total: 12, exactPresence: 1, missingAny: 11 })
	assert.ok(
		rows.every(
			(row) =>
				['ARRIVAL', 'SET', 'MISSING'].includes(row.gain) &&
				['ARRIVAL', 'SET', 'MISSING'].includes(row.mute) &&
				['ARRIVAL', 'SET', 'MISSING'].includes(row.solo),
		),
	)
})

test('direct mix presence probe distinguishes device-arrival from later set state', () => {
	const device = parseDeviceArrival(buildSynthetic18i20Schema())
	const left = device.mixes.find((lane) => lane.name === 'Mix B' && lane.side === 'L')
	assert.ok(left?.inputs?.[2])
	device.initialState.set(String(left.inputs[2].gain), '-31.5')
	const collector = createStatePresenceCollector(device)
	const source = collector.source.get(String(left.inputs[2].gain))
	assert.equal(source, 'ARRIVAL')
})

test('direct mix presence probe source keeps the historical transmit allowlist and no write API', () => {
	const probe = fs.readFileSync(path.join(repoRoot, 'tools', 'readonly-mix-presence-probe.js'), 'utf8')
	const lib = fs.readFileSync(path.join(repoRoot, 'tools', 'readback-probe-lib.js'), 'utf8')

	assert.match(probe, /assertAllowedTcpXml\(xml\)/)
	assert.match(probe, /buildDeviceSubscribe\(this\.device\.id, true\)/)
	assert.doesNotMatch(probe, /\bsetValue\s*\(/)
	assert.doesNotMatch(probe, /socket\.write\([^)]*<set/i)
	assert.doesNotMatch(probe, /focusrite-control-readback-debug-v2/)
	assert.match(probe, /probe-results/)
	assert.match(probe, /randomUUID\(\)/)
	assert.match(lib, /ALLOWED_TCP_ROOTS = new Set\(\['client-details', 'device-subscribe', 'keep-alive'\]\)/)
	assert.match(lib, /hardware <set> writes are forbidden/i)
})

test('debug RUN is software-gate only and never auto-launches a real Focusrite probe', () => {
	const run = fs.readFileSync(path.join(repoRoot, 'RUN.bat'), 'utf8')

	assert.match(run, /SOFTWARE GATE ONLY/)
	assert.match(run, /corepack yarn test/)
	assert.match(run, /corepack yarn companion-module-build/)
	assert.doesNotMatch(run, /tools\\RUN_BRANCH\.bat/)
	assert.doesNotMatch(run, /readonly-state-probe\.js/)
	assert.doesNotMatch(run, /readonly-mix-presence-probe\.js/)
})

test('debug UPDATE_AND_RUN snapshots UPDATE.bat before any branch switch', () => {
	const updateAndRun = fs.readFileSync(path.join(repoRoot, 'UPDATE_AND_RUN.bat'), 'utf8')

	assert.match(updateAndRun, /FOCUSRITE_CONTROL_UPDATE_STABLE_/)
	assert.match(updateAndRun, /copy \/Y "!REPO_DIR!UPDATE\.bat" "!TMP_UPDATE!"/)
	assert.match(updateAndRun, /call "!TMP_UPDATE!" --no-pause/)
	assert.match(updateAndRun, /del \/Q "!TMP_UPDATE!"/)
})

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

test('direct mix presence probe keeps the read-only allowlist and does not approval-gate subscription', () => {
	const probe = fs.readFileSync(path.join(repoRoot, 'tools', 'readonly-mix-presence-probe.js'), 'utf8')
	const lib = fs.readFileSync(path.join(repoRoot, 'tools', 'readback-probe-lib.js'), 'utf8')
	const launcher = fs.readFileSync(path.join(repoRoot, 'RUN_READONLY_MIX_PRESENCE.cmd'), 'utf8')

	assert.match(probe, /assertAllowedTcpXml\(xml\)/)
	assert.match(probe, /buildDeviceSubscribe\(this\.device\.id, true\)/)
	assert.match(probe, /session\.subscribe\(\)/)
	assert.doesNotMatch(probe, /\bsetValue\s*\(/)
	assert.doesNotMatch(probe, /socket\.write\([^)]*<set/i)
	assert.doesNotMatch(probe, /waitForApproval|Dedicated research client authorised|No device subscription was sent/i)
	assert.doesNotMatch(probe, /focusrite-control-readback-debug-v2/)
	assert.match(probe, /probe-results/)
	assert.match(probe, /randomUUID\(\)/)
	assert.match(lib, /ALLOWED_TCP_ROOTS = new Set\(\['client-details', 'device-subscribe', 'keep-alive'\]\)/)
	assert.match(lib, /hardware <set> writes are forbidden/i)

	const subscribeIndex = probe.indexOf('session.subscribe()')
	const observeIndex = probe.indexOf('Observing read-only server state')
	assert.ok(subscribeIndex >= 0 && observeIndex > subscribeIndex)
	assert.match(launcher, /Aucune approbation Remote Devices n est requise/i)
	assert.doesNotMatch(launcher, /APPROUVE ce client/i)
})

test('debug RUN validates only the direct read-only research path in an isolated worktree', () => {
	const run = fs.readFileSync(path.join(repoRoot, 'RUN.bat'), 'utf8')

	assert.match(run, /READ-ONLY RESEARCH GATE/)
	assert.match(run, /git worktree add --detach "!GATE_DIR!" HEAD/)
	assert.match(run, /--check tools\\readback-probe-lib\.js/)
	assert.match(run, /--check tools\\mix-presence-probe-lib\.js/)
	assert.match(run, /--check tools\\readonly-mix-presence-probe\.js/)
	assert.match(run, /--test test\\readback-probe\.test\.js/)
	assert.match(run, /--test test\\mix-presence-probe\.test\.js/)
	assert.match(run, /git worktree remove --force "!GATE_DIR!"/)
	assert.doesNotMatch(run, /corepack yarn install/)
	assert.doesNotMatch(run, /corepack yarn lint/)
	assert.doesNotMatch(run, /companion-module-build/)
	const probeReferences = run
		.split(/\r?\n/)
		.filter((line) => /readonly-mix-presence-probe\.js/i.test(line))
		.map((line) => line.trim())
	assert.deepEqual(probeReferences, ['"!NODE_EXE!" --check tools\\readonly-mix-presence-probe.js'])
})

test('debug branch ignores known cross-branch and Yarn-generated workspace residue', () => {
	const gitignore = fs.readFileSync(path.join(repoRoot, '.gitignore'), 'utf8')

	for (const expected of ['Desktop.ini', 'yarn.lock', '.yarn/', 'testbench/']) {
		assert.match(gitignore, new RegExp(`^${expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm'))
	}
})

test('debug UPDATE_AND_RUN snapshots UPDATE.bat and passes the real repo path to its worker', () => {
	const updateAndRun = fs.readFileSync(path.join(repoRoot, 'UPDATE_AND_RUN.bat'), 'utf8')

	assert.match(updateAndRun, /FOCUSRITE_CONTROL_UPDATE_STABLE_/)
	assert.match(updateAndRun, /copy \/Y "!REPO_DIR!UPDATE\.bat" "!TMP_UPDATE!"/)
	assert.match(updateAndRun, /call "!TMP_UPDATE!" --worker "!REPO_DIR!" --no-pause "!UPDATE_LOG!"/)
	assert.doesNotMatch(updateAndRun, /call "!TMP_UPDATE!" --no-pause/)
	assert.match(updateAndRun, /cd \/d "!REPO_DIR!"/)
	assert.match(updateAndRun, /del \/Q "!TMP_UPDATE!"/)
})

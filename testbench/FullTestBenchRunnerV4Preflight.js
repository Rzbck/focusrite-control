'use strict'

const fs = require('node:fs')
const {
	EXPECTED_MODULE_VERSION,
	safePlanPath,
	line,
	canonicalBool,
	findCompanion,
	get,
	readVariable,
	readVariableOptional,
	exportButtons,
} = require('./FullTestBenchBase')
const { auditR9, discoverShapeFromFeedbacks, captureFullSnapshot } = require('./FullTestBenchAudit')
const { chooseTestSourcesV2 } = require('./FullTestBenchPageV2')
const { captureOutputAvailability } = require('./FullTestBenchOutputAvailability')
const {
	profileForModel,
	assertHardwareWriteProfile,
	buildCapabilityInventory,
	CAMPAIGN_REVISION,
} = require('./FullTestBenchCapabilityV4')
const { captureCoreVariables } = require('./FullTestBenchCoreV4')
const { buildExtendedPageV4, writeGeneratedExtendedV4, auditExtendedPageV4 } = require('./FullTestBenchPageV4')
const { augmentPairSourceHarness } = require('./FullTestBenchPageV4Pairs')
const { addPairInventoryRows } = require('./FullTestBenchPairsV4')
const { addV6InventoryRows } = require('./FullTestBenchInventoryV6')

function addStaticRows(inventory) {
	const add = (id, family, status, detail, risk = 'excluded') =>
		inventory.rows.push({
			id,
			family,
			variable: '',
			availability: 'N/A',
			r9ProbeCount: 0,
			state: '',
			stateKnown: false,
			capability: false,
			risk,
			dependency: '',
			status,
			detail,
		})
	add('action:device-preset', 'device_preset', 'MANUAL_PENDING', 'Excluded from normal FULL because it can overwrite routing.')
	add('action:clock-source', 'clock_source', 'MANUAL_PENDING', 'Excluded from normal FULL because it can alter clocking.')
	add('action:sample-rate', 'sample_rate', 'MANUAL_PENDING', 'Excluded from normal FULL because it can interrupt audio.')
	add('action:spdif-mode', 'spdif_mode', 'MANUAL_PENDING', 'Excluded from normal FULL because it can alter digital I/O mode.')
	add('forbidden:monitor-gain-1677', 'monitor_gain_1677', 'BLOCKED_FORBIDDEN', 'Read-only; no TestBench write path exists.')
	add('forbidden:advanced-raw', 'advanced_raw_set', 'BLOCKED_FORBIDDEN', 'Unknown/unsafe raw writes are never used.')
	add('forbidden:firmware-reset-snapshot', 'firmware_reset_snapshot', 'BLOCKED_FORBIDDEN', 'Firmware/reset/restore/snapshot writes are never used.')
	add('unsupported:input-preamp-gain', 'input_preamp_gain', 'UNSUPPORTED', 'No validated input preamp-gain write path is claimed.')
	add('unsupported:input-hardware-mute', 'input_hardware_mute', 'UNSUPPORTED', 'No direct per-input hardware mute capability is claimed.')
	add('unsupported:per-channel-phantom', 'per_channel_phantom', 'UNSUPPORTED', 'No per-channel phantom write capability is claimed.')
	add('unsupported:mic-kill', 'mic_kill', 'UNSUPPORTED', 'No validated Mic Kill capability is claimed.')
	add('connection:reconnect', 'reconnect', 'DISCOVERED', 'Reconnect action will be tested at campaign end.', 'safe')
}

async function prepareLab(reporter) {
	const safePlan = JSON.parse(fs.readFileSync(safePlanPath, 'utf8'))
	const baseUrl = await findCompanion()
	const connectionsPayload = JSON.parse(await get(baseUrl, '/api/connections'))
	const connections = Array.isArray(connectionsPayload) ? connectionsPayload : connectionsPayload.connections || []
	const exported = await exportButtons(baseUrl)
	const r9 = auditR9(exported, safePlan, connections)
	const label = String(r9.connection.label)
	line('PASS', 'r9 page audit', '42 SAFE setters + 829 feedback probes + 31 feedback definitions')
	line('PASS', 'Module version', EXPECTED_MODULE_VERSION)

	const model = await readVariable(baseUrl, label, 'device_model')
	const authorised = canonicalBool(await readVariable(baseUrl, label, 'client_authorised'))
	const connectionStatus = await readVariable(baseUrl, label, 'connection_status')
	if (authorised !== 'true' || !/authorised/i.test(connectionStatus)) {
		throw new Error('Module client authorization preflight failed.')
	}
	const profile = assertHardwareWriteProfile(profileForModel(model))
	line('PASS', 'Preflight', `hardware-tested write profile + module client authorised :: ${profile.model}`)

	const shape = discoverShapeFromFeedbacks(r9.probes)
	const wanted = profile.supportedShape
	if (
		!wanted ||
		shape.inputs.length !== wanted.inputs ||
		shape.outputs.length !== wanted.outputs ||
		shape.mixerSlots.length !== wanted.mixerSlots ||
		shape.lanes.length !== wanted.mixLanes
	) {
		throw new Error(
			`Hardware profile mismatch for ${profile.model}: ${shape.inputs.length}/${shape.outputs.length}/${shape.mixerSlots.length}/${shape.lanes.length}.`,
		)
	}
	line(
		'PASS',
		'Live shape',
		`${wanted.inputs} inputs / ${wanted.outputs} outputs / ${wanted.mixerSlots} mixer slots / ${wanted.mixLanes} lanes`,
	)

	const mixerProbe = await readVariableOptional(baseUrl, label, 'mix_mix_a_l_slot_1_gain', 3000)
	if (!mixerProbe.exists) return { prep: 'mixer-variables', baseUrl, label, r9, safePlan }

	line('INFO', 'Capability snapshot', 'capturing server-confirmed variables and output availability before first hardware write')
	const snapshot = await captureFullSnapshot(baseUrl, label, shape)
	const coreInitial = await captureCoreVariables(baseUrl, label, safePlan)
	const availabilityMap = await captureOutputAvailability(baseUrl, label, shape)
	const inventory = buildCapabilityInventory({
		model,
		shape,
		snapshot,
		coreInitial,
		r9Probes: r9.probes,
		availabilityMap,
	})
	addPairInventoryRows(inventory, snapshot, profile)
	addV6InventoryRows(inventory, snapshot, profile)
	addStaticRows(inventory)
	const outputEligibility = inventory.outputEligibility
	const counts = outputEligibility.reduce((acc, row) => {
		acc[row.availability] = (acc[row.availability] || 0) + 1
		return acc
	}, {})
	line(
		'INFO',
		'Output capability',
		`AVAILABLE=${counts.AVAILABLE || 0} UNAVAILABLE=${counts.UNAVAILABLE || 0} UNKNOWN=${counts.UNKNOWN || 0} NO_FLAG=${counts.NO_FLAG || 0}`,
	)

	const testSources = await chooseTestSourcesV2(baseUrl, label, snapshot, shape)
	let built = buildExtendedPageV4(snapshot, testSources)
	built.testSources = testSources
	built = augmentPairSourceHarness(built, snapshot, profile)
	const ext = auditExtendedPageV4(exported, built, connections)
	if (!ext) {
		writeGeneratedExtendedV4(built)
		reporter.add(
			'prepare',
			'v4-harness',
			'PREP_REQUIRED',
			`Generated isolated capability harness ${built.signature}; zero hardware writes.`,
		)
		return {
			prep: 'harness',
			baseUrl,
			label,
			r9,
			safePlan,
			profile,
			shape,
			snapshot,
			coreInitial,
			inventory,
			outputEligibility,
			built,
			model,
		}
	}
	if (ext.connection.id !== r9.connection.id && String(ext.connection.label) !== String(r9.connection.label)) {
		throw new Error('r9 and V4 capability-lab pages do not resolve to the same live Focusrite connection.')
	}
	line('PASS', 'Capability Lab page 2', `${built.batches.length} audited isolated/batch controls / snapshot ${built.signature}`)
	return {
		prep: null,
		baseUrl,
		label,
		r9,
		safePlan,
		profile,
		shape,
		snapshot,
		coreInitial,
		inventory,
		outputEligibility,
		built,
		ext,
		model,
		revision: CAMPAIGN_REVISION,
	}
}

module.exports = { prepareLab, addStaticRows }

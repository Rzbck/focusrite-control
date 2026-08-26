const { InstanceBase, Regex, InstanceStatus } = require('@companion-module/base')
const { randomUUID } = require('crypto')
const { FocusriteClient } = require('./focusrite-client')
const { updateActions } = require('./actions')
const { updateFeedbacks } = require('./feedbacks')
const { buildVariableDefinitions, buildVariableValues } = require('./variables')
const { getPresets } = require('./presets')
const { installDefinitionPolicy } = require('./definition-policy')

const TARGET_MODEL = 'Scarlett 18i20 (3rd Gen)'

class FocusriteScarlett18i20Instance extends InstanceBase {
	constructor(internal) {
		super(internal)
		installDefinitionPolicy(this)
		this.client = null
		this.device = null
		this.stateFlushTimer = null
		this.meterFlushTimer = null
		this.pendingNonMeter = false
		this.pendingMeter = false
	}

	async init(config) {
		this.config = { ...config }
		if (!this.config.clientId) {
			this.config.clientId = randomUUID()
			this.saveConfig(this.config)
		}
		this.updateVariableDefinitions()
		this.updateActions()
		this.updateFeedbacks()
		this.updatePresets()
		void this.connect()
	}

	getConfigFields() {
		return [
			{
				type: 'static-text',
				id: 'info',
				width: 12,
				label: 'Focusrite Scarlett 18i20 (3rd Gen)',
				value:
					'Connects to the Focusrite Control Server installed with Focusrite Control. Auto discovery is recommended because the server TCP port can be dynamic. This module does not replace or modify the Focusrite Windows audio driver.',
			},
			{
				type: 'dropdown',
				id: 'connectionMode',
				label: 'Connection mode',
				width: 6,
				choices: [
					{ id: 'auto', label: 'Auto-discover Focusrite Control Server' },
					{ id: 'manual', label: 'Manual host and port' },
				],
				default: 'auto',
			},
			{
				type: 'textinput',
				id: 'discoveryAddress',
				label: 'Discovery broadcast address',
				width: 6,
				default: '255.255.255.255',
				regex: Regex.IP,
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'Manual server host',
				width: 8,
				default: '127.0.0.1',
			},
			{
				type: 'number',
				id: 'port',
				label: 'Manual server port (required in Manual mode)',
				width: 4,
				min: 1,
				max: 65535,
			},
			{
				type: 'textinput',
				id: 'clientName',
				label: 'Client name shown to Focusrite Control',
				width: 8,
				default: 'Companion Scarlett 18i20',
			},
			{
				type: 'number',
				id: 'meterHz',
				label: 'Meter variable/feedback refresh (Hz)',
				width: 4,
				default: 5,
				min: 1,
				max: 20,
			},
			{
				type: 'checkbox',
				id: 'exposeMixerVariables',
				label: 'Expose mixer diagnostic variables (read-only)',
				width: 6,
				default: false,
			},
			{
				type: 'checkbox',
				id: 'debug',
				label: 'Verbose protocol logging',
				width: 6,
				default: false,
			},
		]
	}

	async configUpdated(config) {
		const reconnect =
			this.config.connectionMode !== config.connectionMode ||
			this.config.discoveryAddress !== config.discoveryAddress ||
			this.config.host !== config.host ||
			Number(this.config.port) !== Number(config.port) ||
			this.config.clientName !== config.clientName

		const definitionsChanged = Boolean(this.config.exposeMixerVariables) !== Boolean(config.exposeMixerVariables)

		this.config = { ...config, clientId: config.clientId || this.config.clientId }
		if (definitionsChanged) this.rebuildDefinitions()
		if (reconnect) void this.reconnectNow()
	}

	createClient() {
		return new FocusriteClient({
			mode: this.config.connectionMode || 'auto',
			host: this.config.host || '127.0.0.1',
			port: Number(this.config.port || 0),
			discoveryAddress: this.config.discoveryAddress || '255.255.255.255',
			clientName: this.config.clientName || 'Companion Scarlett 18i20',
			clientId: this.config.clientId,
			debug: this.config.debug,
			targetModel: TARGET_MODEL,
		})
	}

	async connect() {
		if (this.client) this.client.stop()
		this.device = null
		this.client = this.createClient()
		this.attachClientEvents()
		this.updateStatus(InstanceStatus.Connecting)
		this.setVariableValues({ connection_status: 'Connecting' })
		try {
			await this.client.start()
		} catch (error) {
			this.log('error', `Connection failed: ${error.message}`)
			this.updateStatus(InstanceStatus.ConnectionFailure, error.message)
		}
	}

	attachClientEvents() {
		const client = this.client
		client.on('connecting', () => {
			this.updateStatus(InstanceStatus.Connecting)
			this.setVariableValues({ connection_status: 'Connecting' })
		})
		client.on('connected', (server) => {
			this.log('info', `Connected to Focusrite Control Server at ${server.host}:${server.port}`)
			this.updateStatus(InstanceStatus.Connecting, 'Waiting for Scarlett 18i20...')
			this.setVariableValues({
				connection_status: 'Connected / waiting for device',
				server_host: server.host,
				server_port: server.port,
			})
		})
		client.on('client-id', (id) => {
			if (this.config.debug) this.log('debug', `Focusrite Control assigned client id ${id}`)
		})
		client.on('approval', ({ authorised, id }) => {
			if (authorised) {
				this.log('info', `Focusrite Control authorised Companion client ${id}`)
				if (this.device && client.ready) this.updateStatus(InstanceStatus.Ok)
			} else {
				this.log('warn', `Focusrite Control has not authorised Companion client ${id}; approve it in Focusrite Control`)
				this.updateStatus(InstanceStatus.Connecting, 'Approve Companion in Focusrite Control')
			}
			this.scheduleNonMeterFlush()
		})
		client.on('write-blocked', ({ itemId, reason }) => {
			this.log(
				'warn',
				`Write to Focusrite item ${itemId} blocked (${reason}). Approve the Companion client in Focusrite Control first.`,
			)
		})
		client.on('device-ignored', (device) =>
			this.log('warn', `Ignoring unsupported Focusrite device: ${device.model || 'unknown model'}`),
		)
		client.on('device-arrived', (device) => {
			if (device.model !== TARGET_MODEL) {
				this.log('warn', `Ignoring unsupported Focusrite device: ${device.model || 'unknown model'}`)
				return
			}
			this.device = device
			this.log(
				'info',
				`Found ${device.model}: ${device.hardwareInputs.length} analogue inputs, ${device.outputs.length} outputs, ${device.mixes.length} mix lanes`,
			)
			this.rebuildDefinitions()
			this.updateStatus(InstanceStatus.Connecting, 'Synchronising device state...')
		})
		client.on('ready', () => {
			if (this.device?.model === TARGET_MODEL) {
				if (client.authorised === true) {
					this.updateStatus(InstanceStatus.Ok)
				} else {
					this.updateStatus(InstanceStatus.Connecting, 'Approve Companion in Focusrite Control')
				}
				this.scheduleNonMeterFlush()
			}
		})
		client.on('state', (set) => {
			if (!this.device || String(set.deviceId) !== String(this.device.id)) return
			let hasMeter = false
			let hasOther = false
			for (const item of set.items) {
				if (this.device.meterIds.has(String(item.id))) hasMeter = true
				else hasOther = true
			}
			if (hasMeter) this.scheduleMeterFlush()
			if (hasOther) this.scheduleNonMeterFlush()
		})
		client.on('device-removed', () => {
			this.device = null
			this.updateStatus(InstanceStatus.Disconnected, 'Scarlett removed')
			this.rebuildDefinitions()
		})
		client.on('disconnected', () => {
			this.updateStatus(InstanceStatus.Disconnected)
			this.setVariableValues({ connection_status: 'Disconnected' })
			this.checkFeedbacks('connected')
		})
		client.on('reconnecting', (delay) => {
			this.updateStatus(InstanceStatus.Connecting, `Reconnect in ${Math.round(delay / 1000)}s`)
		})
		client.on('debug', (message) => this.log('debug', message))
		client.on('diagnostic', (message) => this.log('info', `[DISCOVERY] ${message}`))
		client.on('error', (error) => this.log('warn', `Focusrite connection: ${error.message}`))
		client.on('unhandled', (xml) => {
			if (this.config.debug) this.log('debug', `Unhandled Focusrite XML: ${xml.slice(0, 300)}`)
		})
	}

	rebuildDefinitions() {
		this.updateActions()
		this.updateFeedbacks()
		this.updateVariableDefinitions()
		this.updatePresets()
		this.scheduleNonMeterFlush()
	}

	updateActions() {
		updateActions(this)
	}

	updateFeedbacks() {
		updateFeedbacks(this)
	}

	updateVariableDefinitions() {
		this.setVariableDefinitions(buildVariableDefinitions(this))
	}

	updatePresets() {
		const result = getPresets(this)
		this.setPresetDefinitions(result.structure, result.presets)
	}

	scheduleNonMeterFlush() {
		this.pendingNonMeter = true
		if (this.stateFlushTimer) return
		this.stateFlushTimer = setTimeout(() => {
			this.stateFlushTimer = null
			if (!this.pendingNonMeter) return
			this.pendingNonMeter = false
			super.setVariableValues(buildVariableValues(this))
			this.checkAllFeedbacks()
		}, 60)
	}

	scheduleMeterFlush() {
		this.pendingMeter = true
		if (this.meterFlushTimer) return
		const hz = Math.max(1, Math.min(20, Number(this.config.meterHz || 5))
		this.meterFlushTimer = setTimeout(
			() => {
				this.meterFlushTimer = null
				if (!this.pendingMeter) return
				this.pendingMeter = false
				super.setVariableValues(buildVariableValues(this))
				this.checkFeedbacks('input_meter', 'output_meter', 'mix_meter')
			},
			Math.round(1000 / hz),
		)
	}

	setItem(itemId, value) {
		if (!this.client?.connected || !this.device) {
			this.log('warn', 'Cannot write: Scarlett is not connected')
			return false
		}
		const id = String(itemId)
		if (!this.device.writableIds.has(id)) {
			this.log('error', `Blocked write to item ${id}: not in the verified writable control set`)
			return false
		}
		// State/feedback is updated only when Focusrite Control Server echoes the real device value.
		// This prevents the UI from claiming a hardware control changed when the server rejected the write.
		return this.client.setValue(this.device.id, id, value)
	}

	async reconnectNow() {
		this.log('info', 'Rediscovering Focusrite Control Server...')
		this.updateStatus(InstanceStatus.Connecting)
		try {
			if (this.client) await this.client.reconnectNow()
			else await this.connect()
		} catch (error) {
			this.updateStatus(InstanceStatus.ConnectionFailure, error.message)
			this.log('error', `Reconnect failed: ${error.message}`)
		}
	}

	async destroy() {
		if (this.stateFlushTimer) clearTimeout(this.stateFlushTimer)
		if (this.meterFlushTimer) clearTimeout(this.meterFlushTimer)
		this.stateFlushTimer = null
		this.meterFlushTimer = null
		if (this.client) this.client.stop()
		this.client = null
	}
}

module.exports = FocusriteScarlett18i20Instance

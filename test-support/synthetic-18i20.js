function control(tag, id, extra = '') {
	return `<${tag} id="${id}"${extra}/>`
}

function analogueInput(channel) {
	const root = 1255 + (channel - 1) * 7
	const stereoName = channel % 2 === 1 ? `Analogue ${channel}-${channel + 1}` : ''
	const mode = channel <= 2 ? `<mode id="${root + 4}"><enum value="Line"/><enum value="Inst"/></mode>` : ''
	return `<analogue id="${root}" name="Analogue ${channel}" stereo-name="${stereoName}" hidden="false" supports-talkback="true">${control('nickname', root + 1)}${control('available', root + 2)}${control('meter', root + 3)}${mode}${control('air', root + 4 + (channel <= 2 ? 1 : 0))}${control('pad', root + 5 + (channel <= 2 ? 1 : 0))}</analogue>`
}

function genericSource(tag, index, idBase, namePrefix) {
	const stereoName = index % 2 === 1 ? `${namePrefix} ${index}-${index + 1}` : ''
	return `<${tag} id="${idBase}" name="${namePrefix} ${index}" stereo-name="${stereoName}" hidden="false">${control('nickname', idBase + 1)}${control('available', idBase + 2)}${control('meter', idBase + 3)}</${tag}>`
}

function output(tag, index, idBase, namePrefix) {
	const stereoName = index % 2 === 1 ? `${namePrefix}s ${index}-${index + 1}` : ''
	const gain = tag === 'analogue' ? control('gain', idBase + 9) : ''
	return `<${tag} name="${namePrefix} ${index}" stereo-name="${stereoName}">${control('available', idBase)}${control('meter', idBase + 1)}${control('assign-mix', idBase + 2)}${control('assign-talkback-mix', idBase + 3)}${control('mute', idBase + 4)}${control('source', idBase + 5)}${control('stereo', idBase + 6)}${control('nickname', idBase + 7)}${gain}</${tag}>`
}

function mixLane(name, side, laneIndex, idBase) {
	const stereoName = side === 'L' ? name : ''
	let inputs = ''
	for (let slot = 0; slot < 24; slot++) {
		const base = idBase + 2 + slot * 4
		inputs += `<input>${control('gain', base)}${control('pan', base + 1)}${control('mute', base + 2)}${control('solo', base + 3)}</input>`
	}
	return `<mix id="${idBase}" name="${name}" stereo-name="${stereoName}">${control('meter', idBase + 98)}${control('talkback', idBase + 1)}${inputs}</mix>`
}

function buildSynthetic18i20Schema() {
	let mixerInputs = ''
	for (let slot = 0; slot < 24; slot++) {
		const base = 18 + slot * 2
		mixerInputs += `<input>${control('source', base)}${control('stereo', base + 1)}</input>`
	}

	let mixes = ''
	const names = ['Mix A', 'Mix B', 'Mix C', 'Mix D', 'Mix E', 'Mix F']
	for (let pair = 0; pair < names.length; pair++) {
		const leftBase = 2000 + pair * 400
		mixes += mixLane(names[pair], 'L', pair * 2, leftBase)
		mixes += mixLane(names[pair], 'R', pair * 2 + 1, leftBase + 200)
	}

	let sources = ''
	for (let ch = 1; ch <= 8; ch++) sources += analogueInput(ch)
	for (let ch = 1; ch <= 2; ch++) sources += genericSource('spdif-rca', ch, 14000 + ch * 10, 'S/PDIF Input')
	for (let ch = 1; ch <= 16; ch++) sources += genericSource('adat', ch, 15000 + ch * 10, 'ADAT Input')
	for (let ch = 1; ch <= 17; ch++) sources += genericSource('playback', ch, 16000 + ch * 10, 'Playback')

	let outputs = ''
	for (let ch = 1; ch <= 10; ch++)
		outputs += output('analogue', ch, 1449 + (ch - 1) * 10, ch <= 2 ? 'Monitor Output' : 'Line Output')
	for (let ch = 1; ch <= 2; ch++) outputs += output('spdif-rca', ch, 18000 + ch * 10, 'S/PDIF Output')
	for (let ch = 1; ch <= 12; ch++) outputs += output('adat', ch, 19000 + ch * 10, 'ADAT Output')
	for (let ch = 1; ch <= 2; ch++) outputs += output('loopback', ch, 20000 + ch * 10, 'Loopback')

	return `<device-arrival><device id="2" protocol="USB" model="Scarlett 18i20 (3rd Gen)" class="Scarlett" serial-number="SYNTHETIC-TEST" version="2">
		<nickname id="2"/><seal-broken id="3"/><snapshot id="4"/><save-snapshot id="5"/><reset-device id="7"/><preset id="6"><enum value="Direct Routing"/><enum value="Empty"/></preset>
		<firmware><version id="8"/><needs-update id="9"/><firmware-progress id="10"/><update-firmware id="11"/><restore-factory id="12"/></firmware>
		<mixer><available id="1254"/><inputs>${mixerInputs}</inputs><mixes>${mixes}</mixes></mixer>
		<inputs>${sources}</inputs>
		<outputs>${outputs}</outputs><record-outputs/>
		<monitoring><hardware-controls><hardware-controls exclusive="true" min-gain="-128" max-gain="0"><gain id="1677"/><dim id="1678"/><mute id="1679"/><alt-enable id="1680"/><alt id="1681"/></hardware-controls><talkback id="1682"/></hardware-controls><preset id="1683"><enum value="1-2"/><enum value="1-4"/><enum value="All"/><enum value="None"/></preset></monitoring>
		<clocking><locked id="1684"/><clock-source id="1685"><enum value="Internal"/><enum value="S/PDIF"/><enum value="ADAT"/></clock-source><sample-rate id="1686"><enum value="44.1 kHz"/><enum value="48 kHz"/><enum value="96 kHz"/></sample-rate><clock-master id="1687"/></clocking>
		<settings><buffer-size id="1688"></buffer-size><spdif-mode><mode id="1689"><enum value="S/PDIF RCA"/><enum value="Dual ADAT"/></mode></spdif-mode><phantom-persistence id="1690"/><talkback><talkback-input-source id="1691"/><source-attenuation id="1692"/><talkback-available id="1693"/></talkback></settings>
		<state></state>
	</device></device-arrival>`
}

module.exports = buildSynthetic18i20Schema

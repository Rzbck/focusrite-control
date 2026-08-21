'use strict'
const { canonicalBool } = require('./FullTestBenchBase')
const { exactCheck, boolCheck } = require('./FullTestBenchCorePhases')
const { STATUS } = require('./FullTestBenchCapabilityV4')
const { isolatedCycle } = require('./FullTestBenchV4Common')
async function testMonitoringMetadata({ baseUrl, label, pageNumber, built, snapshot, update, globalSafety }) {
  if (snapshot.values.device_phantomPersistence?.exists) {
    const restoreBool = canonicalBool(snapshot.values.device_phantomPersistence.value) || 'false'
    await isolatedCycle({
      baseUrl, label, pageNumber, built, rowId: 'setting:phantom-persistence', update, phase: 'settings',
      steps: [
        { batch: 'phantom-persistence-off', check: boolCheck('device_phantomPersistence', 'false') },
        { batch: 'phantom-persistence-on', check: boolCheck('device_phantomPersistence', 'true') },
        { batch: 'phantom-persistence-off', check: boolCheck('device_phantomPersistence', 'false') },
      ],
      restore: { batch: 'phantom-persistence-restore', check: boolCheck('device_phantomPersistence', restoreBool) },
    })
  }
  if (snapshot.values.device_nickname?.exists) {
    await isolatedCycle({
      baseUrl, label, pageNumber, built, rowId: 'device:nickname', update, phase: 'metadata',
      steps: [
        { batch: 'device-nick-temp', check: exactCheck('device_nickname', 'TB_18I20_TEST') },
        { batch: 'v2-device-nick-alt', check: exactCheck('device_nickname', 'TB_18I20_TEST_2') },
      ],
      restore: { batch: 'device-nick-restore', check: exactCheck('device_nickname', snapshot.values.device_nickname.value) },
    })
  }
  for (const [rowId, variable, offBatch, onBatch, restoreBatch] of [
    ['monitor:alt-enable', 'monitor_altEnable', 'monitor-alt-enable-off', 'monitor-alt-enable-on', 'monitor-alt-enable-restore'],
    ['monitor:alt', 'monitor_alt', 'monitor-alt-off', 'monitor-alt-on', 'monitor-alt-restore'],
  ]) {
    if (!snapshot.values[variable]?.exists) continue
    if (!globalSafety) {
      update(rowId, STATUS.BLOCKED_BY_SAFETY, 'Monitor routing test blocked because global output safety is incomplete.', 'monitor-settings')
      continue
    }
    const restoreBool = canonicalBool(snapshot.values[variable].value) || 'false'
    await isolatedCycle({
      baseUrl, label, pageNumber, built, rowId, update, phase: 'monitor-settings',
      steps: [
        { batch: offBatch, check: boolCheck(variable, 'false') },
        { batch: onBatch, check: boolCheck(variable, 'true') },
        { batch: offBatch, check: boolCheck(variable, 'false') },
      ],
      restore: { batch: restoreBatch, check: boolCheck(variable, restoreBool) },
    })
  }
  if (snapshot.values.monitor_preset?.exists) {
    if (!globalSafety) update('monitor:preset', STATUS.BLOCKED_BY_SAFETY, 'Monitor preset test blocked because global output safety is incomplete.', 'monitor-settings')
    else {
      const baseline = 'None'
      const alt = require('./FullTestBenchBase').MONITOR_PRESET_VALUES.find((value) => value !== baseline)
      await isolatedCycle({
        baseUrl, label, pageNumber, built, rowId: 'monitor:preset', update, phase: 'monitor-settings',
        steps: [
          { batch: 'v2-monitor-preset-baseline', check: exactCheck('monitor_preset', baseline) },
          { batch: 'v2-monitor-preset-alt', check: exactCheck('monitor_preset', alt) },
          { batch: 'v2-monitor-preset-baseline', check: exactCheck('monitor_preset', baseline) },
        ],
        restore: { batch: 'monitor-preset-restore', check: exactCheck('monitor_preset', snapshot.values.monitor_preset.value || baseline) },
      })
    }
  }
  if (snapshot.values.device_talkbackInputSource?.exists) {
    if (!globalSafety) update('setting:talkback-source', STATUS.BLOCKED_BY_SAFETY, 'Talkback source test blocked because global output safety is incomplete.', 'monitor-settings')
    else {
      const baseline = 'Scarlett Internal Mic'
      const alt = require('./FullTestBenchBase').TALKBACK_SOURCE_CANDIDATES.find((value) => value !== baseline)
      await isolatedCycle({
        baseUrl, label, pageNumber, built, rowId: 'setting:talkback-source', update, phase: 'monitor-settings',
        steps: [
          { batch: 'v2-talkback-source-baseline', check: exactCheck('device_talkbackInputSource', baseline) },
          { batch: 'v2-talkback-source-alt', check: exactCheck('device_talkbackInputSource', alt) },
          { batch: 'v2-talkback-source-baseline', check: exactCheck('device_talkbackInputSource', baseline) },
        ],
        restore: { batch: 'talkback-source-restore', check: exactCheck('device_talkbackInputSource', snapshot.values.device_talkbackInputSource.value || baseline) },
      })
    }
  }
}

module.exports = { testMonitoringMetadata }

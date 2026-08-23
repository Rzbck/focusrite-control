'use strict'

const {
  EXPECTED_MODULE,
  EXPECTED_MODULE_VERSION,
  EXT_MARKER,
  EXT_INSTANCE_ID,
  FILE_VERSION,
  COMPANION_BUILD,
  generatedDir,
  generatedPagePath,
  generatedManifestPath,
  EXTENDED_ALLOWED,
  DISRUPTIVE_DEFINITIONS,
  FORBIDDEN_DEFINITIONS,
  hashObject,
  stableStringify,
  unwrapOptions,
  resolveLiveConnection,
} = require('./FullTestBenchBase')
const { publicSnapshot, actionEntity, buildButton } = require('./FullTestBenchBuild')
const { buildExtendedPageV2 } = require('./FullTestBenchPageV2')
const { CAMPAIGN_REVISION, canonicalBool } = require('./FullTestBenchCapabilityV4')
const { OUTPUT_GAIN_PROBE } = require('./FullTestBenchProbePolicyV8')
const fs = require('node:fs')

function exprSafeBool(value, fallback) {
  const parsed = canonicalBool(value)
  return parsed === null ? fallback : parsed
}

function spec(definitionId, options) {
  if (!EXTENDED_ALLOWED.has(definitionId)) throw new Error(`V4 generator refused non-approved action ${definitionId}.`)
  if (FORBIDDEN_DEFINITIONS.has(definitionId) || DISRUPTIVE_DEFINITIONS.has(definitionId)) {
    throw new Error(`V4 generator refused unsafe action ${definitionId}.`)
  }
  return { definitionId, options }
}

function addBatch(batches, id, label, specs) {
  if (specs.length) batches.push({ id, label, specs })
}

function buildIsolatedBatches(snapshot, testSources) {
  const batches = []
  const value = (name) => snapshot.values?.[name] || { exists: false, value: '' }

  for (const i of snapshot.shape.inputs || []) {
    const nick = value(`input_${i + 1}_nickname`)
    if (!nick.exists) continue
    const input = String(i)
    addBatch(batches, `v4-input-${i + 1}-nick-a`, `IN ${i + 1}\nNICK A`, [spec('input_nickname', { input, name: `V4_IN_${String(i + 1).padStart(2, '0')}_A` })])
    addBatch(batches, `v4-input-${i + 1}-nick-b`, `IN ${i + 1}\nNICK B`, [spec('input_nickname', { input, name: `V4_IN_${String(i + 1).padStart(2, '0')}_B` })])
    addBatch(batches, `v4-input-${i + 1}-nick-restore`, `IN ${i + 1}\nNICK REST`, [spec('input_nickname', { input, name: nick.value })])
  }

  for (const o of snapshot.shape.outputs || []) {
    const idx = String(o)
    const n = o + 1
    const source = value(`output_${n}_source`)
    if (source.exists) {
      addBatch(batches, `v4-output-${n}-source-none`, `OUT ${n}\nSRC NONE`, [spec('output_source', { output: idx, source: '0' })])
      addBatch(batches, `v4-output-${n}-source-test`, `OUT ${n}\nSRC TEST`, [spec('output_source', { output: idx, source: testSources.primary })])
      addBatch(batches, `v4-output-${n}-source-restore`, `OUT ${n}\nSRC REST`, [spec('output_source', { output: idx, source: source.value !== '' ? source.value : '0' })])
    }
    const gain = value(`output_${n}_gain`)
    if (gain.exists) {
      addBatch(batches, `v4-output-${n}-gain-low`, `OUT ${n}\nGAIN ${OUTPUT_GAIN_PROBE.low}`, [
        spec('output_gain_set', { output: idx, level: OUTPUT_GAIN_PROBE.low }),
      ])
      addBatch(batches, `v4-output-${n}-gain-prime`, `OUT ${n}\nGAIN ${OUTPUT_GAIN_PROBE.high}`, [
        spec('output_gain_set', { output: idx, level: OUTPUT_GAIN_PROBE.high }),
      ])
      addBatch(batches, `v4-output-${n}-gain-adjust`, `OUT ${n}\nGAIN +1`, [spec('output_gain_adjust', { output: idx, step: 1 })])
      addBatch(batches, `v4-output-${n}-gain-restore`, `OUT ${n}\nGAIN REST`, [
        spec('output_gain_set', {
          output: idx,
          level: gain.value !== '' && Number.isFinite(Number(gain.value)) ? Number(gain.value) : OUTPUT_GAIN_PROBE.low,
        }),
      ])
    }
    const stereo = value(`output_${n}_stereo`)
    if (stereo.exists) {
      addBatch(batches, `v4-output-${n}-stereo-off`, `OUT ${n}\nST OFF`, [spec('output_stereo', { output: idx, state: 'off' })])
      addBatch(batches, `v4-output-${n}-stereo-on`, `OUT ${n}\nST ON`, [spec('output_stereo', { output: idx, state: 'on' })])
      addBatch(batches, `v4-output-${n}-stereo-restore`, `OUT ${n}\nST REST`, [spec('output_stereo', { output: idx, state: exprSafeBool(stereo.value, false) ? 'on' : 'off' })])
    }
    const nick = value(`output_${n}_nickname`)
    if (nick.exists) {
      addBatch(batches, `v4-output-${n}-nick-a`, `OUT ${n}\nNICK A`, [spec('output_nickname', { output: idx, name: `V4_OUT_${String(n).padStart(2, '0')}_A` })])
      addBatch(batches, `v4-output-${n}-nick-b`, `OUT ${n}\nNICK B`, [spec('output_nickname', { output: idx, name: `V4_OUT_${String(n).padStart(2, '0')}_B` })])
      addBatch(batches, `v4-output-${n}-nick-restore`, `OUT ${n}\nNICK REST`, [spec('output_nickname', { output: idx, name: nick.value })])
    }
  }

  for (const slot of snapshot.shape.mixerSlots || []) {
    const source = value(`mixer_slot_${slot}_source`)
    if (source.exists) {
      addBatch(batches, `v4-mixer-slot-${slot}-source-a`, `MS ${slot}\nSRC A`, [spec('mixer_slot_source', { slot, source: testSources.primary })])
      addBatch(batches, `v4-mixer-slot-${slot}-source-b`, `MS ${slot}\nSRC B`, [spec('mixer_slot_source', { slot, source: testSources.secondary })])
      addBatch(batches, `v4-mixer-slot-${slot}-source-restore`, `MS ${slot}\nSRC REST`, [spec('mixer_slot_source', { slot, source: source.value !== '' ? source.value : testSources.primary })])
    }
    const stereo = value(`mixer_slot_${slot}_stereo`)
    if (stereo.exists) {
      addBatch(batches, `v4-mixer-slot-${slot}-stereo-off`, `MS ${slot}\nST OFF`, [spec('mixer_slot_stereo', { slot, state: 'off' })])
      addBatch(batches, `v4-mixer-slot-${slot}-stereo-on`, `MS ${slot}\nST ON`, [spec('mixer_slot_stereo', { slot, state: 'on' })])
      addBatch(batches, `v4-mixer-slot-${slot}-stereo-restore`, `MS ${slot}\nST REST`, [spec('mixer_slot_stereo', { slot, state: exprSafeBool(stereo.value, false) ? 'on' : 'off' })])
    }
  }

  return batches
}

function computeHarnessSignature(snapshot, testSources, batches) {
  return hashObject({
    revision: CAMPAIGN_REVISION,
    snapshot: publicSnapshot(snapshot, testSources.primary),
    testSources,
    batches,
  })
}

function buildExtendedPageV4(snapshot, testSources) {
  const base = buildExtendedPageV2(snapshot, testSources)
  const isolated = buildIsolatedBatches(snapshot, testSources)
  const batches = [...base.batches, ...isolated]
  const seen = new Set()
  for (const batch of batches) {
    if (seen.has(batch.id)) throw new Error(`Duplicate V4 batch id ${batch.id}.`)
    seen.add(batch.id)
  }
  const signature = computeHarnessSignature(snapshot, testSources, batches)
  const controls = {}
  const locations = {}
  const maxColumn = 45
  for (let index = 0; index < batches.length; index++) {
    const row = Math.floor(index / (maxColumn + 1))
    const column = index % (maxColumn + 1)
    const batch = batches[index]
    const actions = batch.specs.map((item, actionIndex) => actionEntity(item.definitionId, item.options, `${CAMPAIGN_REVISION}/${signature}/${batch.id}/${actionIndex}`))
    controls[String(row)] ??= {}
    controls[String(row)][String(column)] = buildButton(batch.label, batch.id, actions, signature)
    locations[batch.id] = { row, column, actions: batch.specs }
  }
  const maxRow = Math.max(0, Math.ceil(batches.length / (maxColumn + 1)) - 1)
  const pageName = `Focusrite 18i20 TB CAP LAB [${EXT_MARKER}:${signature}]`
  const file = {
    version: FILE_VERSION,
    type: 'page',
    companionBuild: COMPANION_BUILD,
    page: { name: pageName, controls, gridSize: { minColumn: 0, maxColumn, minRow: 0, maxRow } },
    instances: { [EXT_INSTANCE_ID]: { label: 'FOCUSRITE TESTBENCH TARGET', moduleId: EXPECTED_MODULE, lastUpgradeIndex: 0 } },
    connectionCollections: [], oldPageNumber: 1, imageLibrary: [], imageLibraryCollections: [],
  }
  return { signature, batches, locations, pageName, file, testSources, campaignRevision: CAMPAIGN_REVISION }
}

function writeGeneratedExtendedV4(built) {
  fs.mkdirSync(generatedDir, { recursive: true })
  fs.writeFileSync(generatedPagePath, `${JSON.stringify(built.file, null, '\t')}\n`, 'utf8')
  fs.writeFileSync(generatedManifestPath, `${JSON.stringify({ schemaVersion: 4, campaignRevision: CAMPAIGN_REVISION, signature: built.signature, pageName: built.pageName, batchCount: built.batches.length }, null, 2)}\n`, 'utf8')
}

function auditExtendedPageV4(exported, built, connections) {
  const matches = Object.entries(exported.pages || {}).filter(([, page]) => page?.name === built.pageName)
  if (!matches.length) return null
  if (matches.length !== 1) throw new Error('Expected exactly one V4 capability-lab Extended page for the current snapshot.')
  const [pageNumber, page] = matches[0]
  const refs = new Set()
  for (const [batchId, expected] of Object.entries(built.locations)) {
    const control = page.controls?.[String(expected.row)]?.[String(expected.column)]
    if (!control) throw new Error(`V4 harness control missing for ${batchId}.`)
    const down = control.steps?.['0']?.action_sets?.down
    if (!Array.isArray(down) || down.length !== expected.actions.length) throw new Error(`V4 harness action count mismatch for ${batchId}.`)
    for (let i = 0; i < down.length; i++) {
      const action = down[i]
      if (FORBIDDEN_DEFINITIONS.has(action.definitionId) || DISRUPTIVE_DEFINITIONS.has(action.definitionId)) throw new Error(`Unsafe action ${action.definitionId} in V4 harness.`)
      const wanted = expected.actions[i]
      if (action.definitionId !== wanted.definitionId || stableStringify(unwrapOptions(action.options)) !== stableStringify(wanted.options)) throw new Error(`V4 harness action mismatch for ${batchId} action ${i + 1}.`)
      refs.add(action.connectionId)
    }
  }
  if (refs.size !== 1) throw new Error('V4 harness must reference exactly one Focusrite instance.')
  const instance = exported.instances?.[[...refs][0]]
  if (!instance || instance.moduleId !== EXPECTED_MODULE) throw new Error('V4 harness is not mapped to the Focusrite module.')
  if (String(instance.moduleVersionId || '') !== EXPECTED_MODULE_VERSION) throw new Error(`V4 harness module version mismatch: ${instance.moduleVersionId || 'unknown'}.`)
  return { pageNumber: Number(pageNumber), connection: resolveLiveConnection(connections, instance) }
}

module.exports = {
  buildIsolatedBatches,
  computeHarnessSignature,
  buildExtendedPageV4,
  writeGeneratedExtendedV4,
  auditExtendedPageV4,
}

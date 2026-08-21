'use strict'

const { actionEntity, buildButton } = require('./FullTestBenchBuild')
const { CAMPAIGN_REVISION } = require('./FullTestBenchCapabilityV4')

function augmentPairSourceHarness(built, snapshot, profile) {
  const maxColumn = Number(built.file?.page?.gridSize?.maxColumn ?? 45)
  for (const [left, right] of profile.outputPairs) {
    if (!snapshot.shape.outputs.includes(left) || !snapshot.shape.outputs.includes(right)) continue
    const leftSource = snapshot.values[`output_${left + 1}_source`]
    const rightSource = snapshot.values[`output_${right + 1}_source`]
    if (!leftSource?.exists || !rightSource?.exists) continue
    for (const [suffix, source, label] of [
      ['test', built.testSources.primary, `PAIR ${left + 1}-${right + 1}\nSRC TEST`],
      ['none', '0', `PAIR ${left + 1}-${right + 1}\nSRC NONE`],
    ]) {
      const id = `v4-pair-${left + 1}-${right + 1}-source-${suffix}`
      if (built.locations[id]) continue
      const spec = { definitionId: 'output_pair_source', options: { output: String(left), source } }
      const index = built.batches.length
      const row = Math.floor(index / (maxColumn + 1))
      const column = index % (maxColumn + 1)
      const action = actionEntity(spec.definitionId, spec.options, `${CAMPAIGN_REVISION}/${built.signature}/${id}/0`)
      built.file.page.controls[String(row)] ??= {}
      built.file.page.controls[String(row)][String(column)] = buildButton(label, id, [action], built.signature)
      built.locations[id] = { row, column, actions: [spec] }
      built.batches.push({ id, label, specs: [spec] })
      built.file.page.gridSize.maxRow = Math.max(Number(built.file.page.gridSize.maxRow || 0), row)
    }
  }
  return built
}

module.exports = { augmentPairSourceHarness }

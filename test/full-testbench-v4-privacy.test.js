const test = require('node:test')
const assert = require('node:assert/strict')
const { buildShareablePayload, redactShareableDetail } = require('../testbench/FullTestBenchReportV4')

test('V4 shareable report redacts nickname state and nickname failure detail', () => {
  const secret = 'Scarlett18i20-PRIVATE-SERIAL-LIKE'
  const payload = buildShareablePayload({
    rows: [{
      id: 'device:nickname',
      family: 'device_nickname',
      variable: 'device_nickname',
      availability: 'N/A',
      r9ProbeCount: 0,
      state: secret,
      stateKnown: true,
      capability: true,
      risk: 'safe',
      dependency: '',
      status: 'FAIL_NO_EFFECT',
      detail: `expected test nickname, observed ${secret}`,
    }],
    meta: {
      model: 'Scarlett 18i20 (3rd Gen)',
      revision: 'privacy-self-test',
      signature: 'synthetic',
      privatePath: 'C:/Users/private/diagnostic.json',
    },
  })
  const serialized = JSON.stringify(payload)
  assert.equal(serialized.includes(secret), false)
  assert.equal(serialized.includes('privatePath'), false)
  assert.equal(serialized.includes('C:/Users/private'), false)
  assert.equal(Object.hasOwn(payload.capabilities[0], 'state'), false)
  assert.match(payload.capabilities[0].detail, /redacted/)
})

test('V4 shareable detail removes Windows diagnostic paths outside nickname rows', () => {
  const detail = redactShareableDetail({
    id: 'output:1:source',
    family: 'output_source',
    detail: 'diagnostic failed at C:\\Users\\private\\capture.xml; restore confirmed',
  })
  assert.equal(detail.includes('C:\\Users\\private'), false)
  assert.match(detail, /<path-redacted>/)
})

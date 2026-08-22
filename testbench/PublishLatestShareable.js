'use strict'

const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const root = path.join(__dirname, '..')
const latestPath = path.join(__dirname, 'results', 'LATEST_SHAREABLE.json')
const publicDir = path.join(root, 'docs', 'hardware-results')
const publicPath = path.join(publicDir, 'LATEST_SHAREABLE.json')

const CAPABILITY_KEYS = new Set([
  'id', 'family', 'availability', 'r9ProbeCount', 'stateKnown', 'capability', 'risk', 'dependency', 'status', 'detail',
])
const META_KEYS = new Set([
  'completed', 'hardwareWrites', 'reason', 'revision', 'signature', 'model', 'r9Probes', 'r9Definitions',
  'globalSignalPathSafety', 'signalPathSafety',
])
const FORBIDDEN_KEY = /^(?:state|variable|serial|serialNumber|hostname|clientKey|serverPort|connectionId|clientId|deviceId|rawXml|rawXML|path)$/i

function validateShareable(payload, rawText = JSON.stringify(payload)) {
  const errors = []
  if (!payload || payload.reportClass !== 'shareable-sanitized') errors.push('reportClass must be shareable-sanitized')
  if (payload?.meta?.completed !== true) errors.push('only completed campaigns may be published')

  for (const key of Object.keys(payload?.meta || {})) if (!META_KEYS.has(key)) errors.push(`unexpected meta key: ${key}`)
  for (const row of payload?.capabilities || []) {
    for (const key of Object.keys(row || {})) if (!CAPABILITY_KEYS.has(key)) errors.push(`unexpected capability key: ${key}`)
  }

  const walk = (value, key = '') => {
    if (FORBIDDEN_KEY.test(key)) errors.push(`forbidden key: ${key}`)
    if (Array.isArray(value)) return value.forEach((item) => walk(item, ''))
    if (value && typeof value === 'object') return Object.entries(value).forEach(([childKey, child]) => walk(child, childKey))
  }
  walk(payload)

  const deny = [
    /\b[A-Za-z]:[\\/](?!<path-redacted>)[^\s"']+/,
    /\/(?:Users|home)\/[^\s"']+/,
    /<set\b/i,
    /<device\b/i,
    /\b(?:client[_ -]?key|server[_ -]?port)\s*[=:]\s*[^\s,;}]+/i,
    /\b(?:client|device|connection)[-_ ]?id\s*[=:]\s*[^\s,;}]+/i,
  ]
  for (const pattern of deny) if (pattern.test(rawText)) errors.push(`content matched forbidden privacy pattern: ${pattern}`)

  return [...new Set(errors)]
}

function runGit(args) {
  return spawnSync('git', args, { cwd: root, encoding: 'utf8', windowsHide: true })
}

function publishLatestShareable() {
  if (!fs.existsSync(latestPath)) {
    console.log('PUBLISH SKIP - no LATEST_SHAREABLE.json exists.')
    return { published: false, skipped: true }
  }
  const raw = fs.readFileSync(latestPath, 'utf8')
  let payload
  try {
    payload = JSON.parse(raw)
  } catch (error) {
    throw new Error(`Privacy gate refused invalid JSON: ${error.message}`)
  }
  if (payload?.reportClass === 'shareable-sanitized' && payload?.meta?.completed !== true) {
    console.log('PUBLISH SKIP - report is sanitized but the campaign is not completed (PREP/fatal report).')
    return { published: false, skipped: true }
  }
  const errors = validateShareable(payload, raw)
  if (errors.length) throw new Error(`Privacy gate refused publication: ${errors.join('; ')}`)

  fs.mkdirSync(publicDir, { recursive: true })
  fs.writeFileSync(publicPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

  let result = runGit(['add', '--', path.relative(root, publicPath)])
  if (result.status !== 0) throw new Error(`git add failed: ${(result.stderr || result.stdout || '').trim()}`)
  result = runGit(['diff', '--cached', '--quiet', '--', path.relative(root, publicPath)])
  if (result.status === 0) {
    console.log('PUBLISH OK - sanitized GitHub report already matches the latest completed campaign.')
    return { published: false, skipped: true }
  }
  if (result.status !== 1) throw new Error(`git diff failed: ${(result.stderr || result.stdout || '').trim()}`)

  result = runGit(['commit', '-m', 'testbench: publish latest sanitized hardware report', '--', path.relative(root, publicPath)])
  if (result.status !== 0) throw new Error(`git commit failed: ${(result.stderr || result.stdout || '').trim()}`)
  result = runGit(['push', 'origin', 'HEAD'])
  if (result.status !== 0) throw new Error(`git push failed safely (no force used): ${(result.stderr || result.stdout || '').trim()}`)

  console.log('PUBLISH OK - sanitized completed hardware report pushed to GitHub.')
  return { published: true, skipped: false }
}

function main() {
  try {
    publishLatestShareable()
  } catch (error) {
    console.error(`PUBLISH FAIL - ${error.message}`)
    process.exitCode = 7
  }
}

if (require.main === module) main()

module.exports = { validateShareable, publishLatestShareable, latestPath, publicPath }

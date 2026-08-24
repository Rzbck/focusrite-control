'use strict'

const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const repoRoot = path.join(__dirname, '..')
const bootstrap = fs.readFileSync(path.join(repoRoot, 'scripts', 'ensure-node22.ps1'), 'utf8')
const runner = fs.readFileSync(path.join(repoRoot, 'RUN.bat'), 'utf8')

test('portable Node bootstrap does not require newer PowerShell hash or ZIP cmdlets', () => {
	assert.doesNotMatch(bootstrap, /Get-FileHash/)
	assert.match(bootstrap, /System\.Security\.Cryptography\.SHA256/) 
	assert.match(bootstrap, /System\.IO\.File.*OpenRead/)
	assert.match(bootstrap, /Get-Command Expand-Archive -ErrorAction SilentlyContinue/)
	assert.match(bootstrap, /System\.IO\.Compression\.ZipFile.*ExtractToDirectory/)
})

test('RUN still invokes the checked-in portable Node bootstrap when Node 22.20+ is absent', () => {
	assert.match(runner, /scripts\\ensure-node22\.ps1/)
	assert.match(runner, /Node 22\.20\+ avec Corepack non disponible/)
})

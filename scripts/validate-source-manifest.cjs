const fs = require('node:fs/promises')
const path = require('node:path')

;(async () => {
	const { validateManifest } = await import('@companion-module/base/manifest')
	const manifestPath = path.resolve(__dirname, '..', 'companion', 'manifest.json')
	const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'))

	validateManifest(manifest, false)

	if (manifest.type !== 'connection') throw new Error(`Expected connection manifest, got ${manifest.type}`)
	if (manifest.id !== 'focusrite-scarlett-18i20') throw new Error(`Unexpected id: ${manifest.id}`)
	if (manifest.runtime?.type !== 'node22') throw new Error(`Expected node22 runtime, got ${manifest.runtime?.type}`)

	console.log('Source manifest validation: OK')
})()

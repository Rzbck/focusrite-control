$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $RepoRoot

$RequiredBranch = 'rc/v0.1.13-state-contract'
$StatusDir = Join-Path $RepoRoot '.local-logs'
$StatusFile = Join-Path $StatusDir 'RC_STATE_CONTRACT_STATUS.txt'
$AllowList = @(
    '.yarnrc.yml',
    'AI_PROJECT_RULES.md',
    'companion/manifest.json',
    'package.json',
    'src/actions.js',
    'src/device-parser.js',
    'src/feedbacks.js',
    'src/main.js',
    'src/presets.js',
    'src/variables.js',
    'test-support/synthetic-18i20.js',
    'test/cold-start-contract.test.js',
    'test/full-schema.test.js',
    'test/protocol.test.js',
    'test/rc-validation-status.test.js',
    'test/state-safety.test.js',
    'tools/publish-sanitized-rc-validation.js',
    'tools/rc-validation-status-lib.js'
)

function Invoke-External {
    param(
        [Parameter(Mandatory = $true)][string]$File,
        [Parameter()][string[]]$Arguments = @()
    )
    & $File @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$File failed with exit code $LASTEXITCODE"
    }
}

function Write-ValidationStatus {
    param(
        [Parameter(Mandatory = $true)][string]$Outcome,
        [Parameter(Mandatory = $true)][string]$Stage,
        [Parameter(Mandatory = $true)][string]$Code
    )
    New-Item -ItemType Directory -Force -Path $StatusDir | Out-Null
    @(
        "outcome=$Outcome",
        "stage=$Stage",
        "code=$Code"
    ) | Set-Content -Path $StatusFile -Encoding ascii
}

function Publish-StatusBestEffort {
    try {
        Invoke-External -File 'node' -Arguments @('tools/publish-sanitized-rc-validation.js')
    }
    catch {
        Write-Host "[RC STATUS] Publication impossible: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host '[RC STATUS] Aucun log brut n a ete envoye.' -ForegroundColor Yellow
    }
}

function Restore-PrettierChanges {
    $changed = @(git diff --name-only --)
    if ($LASTEXITCODE -ne 0) { return }
    if ($changed.Count -gt 0) {
        & git restore --worktree -- $changed
    }
}

$Stage = 'preflight'
$Code = 'unexpected'
$FormatApplied = $false

try {
    Write-Host '=============================================================='
    Write-Host ' FOCUSRITE CONTROL - RC REPAIR + FULL VALIDATION'
    Write-Host '=============================================================='
    Write-Host 'Aucun test hardware/write n est lance par ce runner.'
    Write-Host 'Le formatage est applique localement, puis pousse uniquement si tous les tests passent.'
    Write-Host ''

    $branch = (& git branch --show-current).Trim()
    if ($LASTEXITCODE -ne 0 -or $branch -ne $RequiredBranch) {
        throw "Wrong branch: $branch"
    }

    $trackedDirty = @(& git status --porcelain --untracked-files=no)
    if ($LASTEXITCODE -ne 0) { throw 'git status failed' }
    if ($trackedDirty.Count -gt 0) {
        throw 'Tracked local changes are already present; updater safety stash should run first.'
    }

    $portableNode = Join-Path $RepoRoot '.build-tools\node22'
    $portableNodeExe = Join-Path $portableNode 'node.exe'
    if (Test-Path $portableNodeExe) {
        $candidate = (& $portableNodeExe -p 'process.versions.node').Trim()
        if ($LASTEXITCODE -eq 0) {
            $candidateVersion = [version]$candidate
            if ($candidateVersion.Major -eq 22 -and $candidateVersion.Minor -ge 20) {
                $env:Path = "$portableNode;$env:Path"
            }
        }
    }

    $nodeVersionText = (& node -p 'process.versions.node').Trim()
    if ($LASTEXITCODE -ne 0) {
        $Code = 'node-unavailable'
        throw 'Node unavailable'
    }
    $nodeVersion = [version]$nodeVersionText
    if ($nodeVersion.Major -ne 22 -or $nodeVersion.Minor -lt 20) {
        $Code = 'node-unavailable'
        throw "Node 22.20+ required; found $nodeVersionText"
    }
    Write-Host "Node : $nodeVersionText"
    Write-Host "Branche : $RequiredBranch"
    Write-Host ''

    & corepack enable | Out-Null
    if ($LASTEXITCODE -ne 0) {
        $Code = 'corepack-unavailable'
        throw 'Corepack unavailable'
    }

    $Stage = 'dependencies'
    $Code = 'install-failed'
    Write-Host '[1/7] Dependances...'
    if (Test-Path (Join-Path $RepoRoot 'yarn.lock')) {
        Invoke-External -File 'yarn' -Arguments @('install', '--immutable')
    }
    else {
        Invoke-External -File 'yarn' -Arguments @('install')
    }

    $Stage = 'format'
    $Code = 'format-failed'
    Write-Host '[2/7] Correction du format Prettier...'
    Invoke-External -File 'yarn' -Arguments @('format')
    $FormatApplied = $true

    $changed = @(& git diff --name-only --)
    if ($LASTEXITCODE -ne 0) { throw 'git diff failed' }
    $unexpected = @($changed | Where-Object { $AllowList -notcontains ($_ -replace '\\', '/') })
    if ($unexpected.Count -gt 0) {
        throw "Prettier modified unexpected tracked file(s): $($unexpected -join ', ')"
    }

    Invoke-External -File 'git' -Arguments @('diff', '--check')
    Invoke-External -File 'yarn' -Arguments @('check-format')

    $Stage = 'lint'
    $Code = 'lint-failed'
    Write-Host '[3/7] ESLint...'
    Invoke-External -File 'yarn' -Arguments @('lint')

    $Stage = 'manifest'
    $Code = 'manifest-failed'
    Write-Host '[4/7] Manifest...'
    Invoke-External -File 'yarn' -Arguments @('check')

    $Stage = 'tests'
    $Code = 'tests-failed'
    Write-Host '[5/7] Tests...'
    Invoke-External -File 'yarn' -Arguments @('test')

    $Stage = 'build'
    $Code = 'build-failed'
    Write-Host '[6/7] Companion package...'
    Invoke-External -File 'yarn' -Arguments @('companion-module-build')

    Write-Host '[7/7] Publication du correctif de formatage si necessaire...'
    $changed = @(& git diff --name-only --)
    if ($LASTEXITCODE -ne 0) { throw 'git diff failed after validation' }
    if ($changed.Count -gt 0) {
        Invoke-External -File 'git' -Arguments (@('add', '--') + $AllowList)
        Invoke-External -File 'git' -Arguments @('diff', '--cached', '--check')
        Invoke-External -File 'git' -Arguments @(
            '-c', 'user.name=Focusrite RC Formatter',
            '-c', 'user.email=focusrite-rc@users.noreply.github.com',
            'commit', '-m', 'style: apply Bitfocus Prettier formatting'
        )
        Invoke-External -File 'git' -Arguments @('push', 'origin', "HEAD:refs/heads/$RequiredBranch")
    }
    else {
        Write-Host 'Formatage deja propre; aucun commit necessaire.'
    }

    Write-ValidationStatus -Outcome 'SUCCESS' -Stage 'complete' -Code 'ok'
    Publish-StatusBestEffort

    Write-Host ''
    Write-Host '=============================================================='
    Write-Host 'RC VALIDATION OK - format/lint/manifest/tests/build passes'
    Write-Host 'Aucun hardware write n a ete effectue.'
    Write-Host '==============================================================' -ForegroundColor Green
    exit 0
}
catch {
    if ($FormatApplied) {
        Restore-PrettierChanges
    }
    Write-ValidationStatus -Outcome 'FAILED' -Stage $Stage -Code $Code
    Publish-StatusBestEffort

    Write-Host ''
    Write-Host '=============================================================='
    Write-Host "RC VALIDATION FAILED - stage=$Stage code=$Code" -ForegroundColor Red
    Write-Host "Erreur locale: $($_.Exception.Message)"
    Write-Host 'Aucune promotion automatique et aucun hardware write.'
    Write-Host '=============================================================='
    exit 1
}

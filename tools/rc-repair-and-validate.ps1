$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $RepoRoot

$RequiredBranch = 'rc/v0.1.13-state-contract'
$ValidatorCommit = '4fcf95fa32c0970de1889282162eb91b9f61cb8f'
$StatusDir = Join-Path $RepoRoot '.local-logs'
$StatusFile = Join-Path $StatusDir 'RC_STATE_CONTRACT_STATUS.txt'
$TempRoot = Join-Path $env:TEMP ("FOCUSRITE_RC_WORKTREE_{0}" -f ([guid]::NewGuid().ToString('N')))
$WorktreeAdded = $false

$FormatAllowList = @(
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

$ExpectedTrackedChanges = @($FormatAllowList + @('RUN.bat', 'tools/rc-repair-and-validate.ps1'))

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
        Set-Location $RepoRoot
        Invoke-External -File 'node' -Arguments @('tools/publish-sanitized-rc-validation.js')
    }
    catch {
        Write-Host "[RC STATUS] Publication impossible: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host '[RC STATUS] Aucun log brut n a ete envoye.' -ForegroundColor Yellow
    }
}

function Remove-TemporaryWorktree {
    if ($WorktreeAdded) {
        Set-Location $RepoRoot
        & git worktree remove --force $TempRoot 2>$null
        & git worktree prune 2>$null
    }
    if (Test-Path $TempRoot) {
        Remove-Item -LiteralPath $TempRoot -Recurse -Force -ErrorAction SilentlyContinue
    }
}

$Stage = 'preflight'
$Code = 'unexpected'

try {
    Write-Host '=============================================================='
    Write-Host ' FOCUSRITE CONTROL - ISOLATED RC REPAIR + FULL VALIDATION'
    Write-Host '=============================================================='
    Write-Host 'Aucun test hardware/write n est lance par ce runner.'
    Write-Host 'Ton dossier local n est ni formate, ni committe, ni pousse.'
    Write-Host 'Le travail se fait dans une copie Git temporaire propre.'
    Write-Host ''

    $branch = (& git branch --show-current).Trim()
    if ($LASTEXITCODE -ne 0 -or $branch -ne $RequiredBranch) {
        throw "Wrong branch: $branch"
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

    $Code = 'corepack-unavailable'
    if (-not (Get-Command corepack -ErrorAction SilentlyContinue)) {
        throw 'Corepack unavailable'
    }
    & corepack enable | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw 'Corepack unavailable'
    }
    $Code = 'unexpected'

    Write-Host "Node : $nodeVersionText"
    Write-Host "Branche : $RequiredBranch"
    Write-Host ''

    Write-Host '[1/9] Synchronisation de la branche distante...'
    Invoke-External -File 'git' -Arguments @('fetch', 'origin', $RequiredBranch)
    $SourceCommit = (& git rev-parse "origin/$RequiredBranch").Trim()
    if ($LASTEXITCODE -ne 0 -or $SourceCommit -notmatch '^[0-9a-f]{40}$') {
        throw 'Remote RC commit could not be resolved'
    }

    Write-Host '[2/9] Creation de la copie temporaire propre...'
    Invoke-External -File 'git' -Arguments @('worktree', 'add', '--detach', $TempRoot, $SourceCommit)
    $WorktreeAdded = $true
    Set-Location $TempRoot

    $Stage = 'dependencies'
    $Code = 'install-failed'
    Write-Host '[3/9] Dependances...'
    if (Test-Path (Join-Path $TempRoot 'yarn.lock')) {
        Invoke-External -File 'yarn' -Arguments @('install', '--immutable')
    }
    else {
        Invoke-External -File 'yarn' -Arguments @('install')
    }

    $Stage = 'format'
    $Code = 'format-failed'
    Write-Host '[4/9] Correction du format Prettier dans la copie temporaire...'
    Invoke-External -File 'yarn' -Arguments @('format')

    $formatChanged = @(& git diff --name-only --)
    if ($LASTEXITCODE -ne 0) { throw 'git diff failed after Prettier' }
    $formatUnexpected = @($formatChanged | Where-Object { $FormatAllowList -notcontains ($_ -replace '\\', '/') })
    if ($formatUnexpected.Count -gt 0) {
        throw "Prettier modified unexpected file(s): $($formatUnexpected -join ', ')"
    }
    if ($formatChanged.Count -eq 0) {
        throw 'Prettier produced no change although the remote format gate is known to fail'
    }

    Write-Host '[5/9] Restauration du runner de validation normal...'
    Invoke-External -File 'git' -Arguments @('restore', "--source=$ValidatorCommit", '--worktree', '--', 'RUN.bat')
    if (Test-Path (Join-Path $TempRoot 'tools\rc-repair-and-validate.ps1')) {
        Remove-Item -LiteralPath (Join-Path $TempRoot 'tools\rc-repair-and-validate.ps1') -Force
    }

    $changed = @(& git diff --name-only --)
    if ($LASTEXITCODE -ne 0) { throw 'git diff failed before validation' }
    $unexpected = @($changed | Where-Object { $ExpectedTrackedChanges -notcontains ($_ -replace '\\', '/') })
    if ($unexpected.Count -gt 0) {
        throw "Unexpected tracked change(s): $($unexpected -join ', ')"
    }

    Invoke-External -File 'git' -Arguments @('diff', '--check')
    Invoke-External -File 'yarn' -Arguments @('check-format')

    $Stage = 'lint'
    $Code = 'lint-failed'
    Write-Host '[6/9] ESLint...'
    Invoke-External -File 'yarn' -Arguments @('lint')

    $Stage = 'manifest'
    $Code = 'manifest-failed'
    Write-Host '[7/9] Manifest + tests...'
    Invoke-External -File 'yarn' -Arguments @('check')

    $Stage = 'tests'
    $Code = 'tests-failed'
    Invoke-External -File 'yarn' -Arguments @('test')

    $Stage = 'build'
    $Code = 'build-failed'
    Write-Host '[8/9] Companion package...'
    Invoke-External -File 'yarn' -Arguments @('companion-module-build')

    $Stage = 'preflight'
    $Code = 'unexpected'
    Write-Host '[9/9] Commit unique du formatage + retour au runner normal...'
    Invoke-External -File 'git' -Arguments (@('add', '-A', '--') + $ExpectedTrackedChanges)
    Invoke-External -File 'git' -Arguments @('diff', '--cached', '--check')

    $staged = @(& git diff --cached --name-only --)
    if ($LASTEXITCODE -ne 0 -or $staged.Count -eq 0) {
        throw 'No staged RC repair changes were produced'
    }
    $stagedUnexpected = @($staged | Where-Object { $ExpectedTrackedChanges -notcontains ($_ -replace '\\', '/') })
    if ($stagedUnexpected.Count -gt 0) {
        throw "Unexpected staged file(s): $($stagedUnexpected -join ', ')"
    }

    Invoke-External -File 'git' -Arguments @(
        '-c', 'user.name=Focusrite RC Formatter',
        '-c', 'user.email=focusrite-rc@users.noreply.github.com',
        'commit', '-m', 'rc: format sources and restore validation-only runner'
    )
    $RepairCommit = (& git rev-parse HEAD).Trim()

    $RemoteHead = ((& git ls-remote origin "refs/heads/$RequiredBranch") -split '\s+')[0]
    if ($LASTEXITCODE -ne 0 -or $RemoteHead -ne $SourceCommit) {
        throw 'Remote RC branch changed during validation; refusing to push'
    }

    Invoke-External -File 'git' -Arguments @(
        'push',
        "--force-with-lease=refs/heads/$RequiredBranch`:$SourceCommit",
        'origin',
        "HEAD:refs/heads/$RequiredBranch"
    )

    $Stage = 'complete'
    $Code = 'ok'
    Remove-TemporaryWorktree

    Write-Host ''
    Write-Host '=============================================================='
    Write-Host 'RC REPAIR OK - format/lint/manifest/tests/build passes' -ForegroundColor Green
    Write-Host "Commit publie : $RepairCommit"
    Write-Host 'Le depot distant utilise de nouveau le runner de validation normal.'
    Write-Host 'Aucun hardware write n a ete effectue.'
    Write-Host '=============================================================='
    exit 0
}
catch {
    Remove-TemporaryWorktree
    Write-ValidationStatus -Outcome 'FAILED' -Stage $Stage -Code $Code
    Publish-StatusBestEffort

    Write-Host ''
    Write-Host '=============================================================='
    Write-Host "RC REPAIR FAILED - stage=$Stage code=$Code" -ForegroundColor Red
    Write-Host "Erreur: $($_.Exception.Message)"
    Write-Host 'La branche GitHub RC n a pas ete modifiee par cette tentative.'
    Write-Host 'Aucun hardware write n a ete effectue.'
    Write-Host '=============================================================='
    exit 1
}

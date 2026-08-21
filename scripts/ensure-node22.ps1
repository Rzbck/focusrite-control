[CmdletBinding()]
param()

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'

$NodeVersion = '22.23.2'
$RepoRoot = Split-Path -Parent $PSScriptRoot
$BuildRoot = Join-Path $RepoRoot '.build-tools'
$TargetDir = Join-Path $BuildRoot 'node22'
$TargetExe = Join-Path $TargetDir 'node.exe'

function Test-CompatibleNode([string]$NodeExe) {
    if (-not (Test-Path -LiteralPath $NodeExe)) { return $false }
    & $NodeExe -e "const [major, minor] = process.versions.node.split('.').map(Number); process.exit(major === 22 && minor >= 20 ? 0 : 1)" 2>$null
    return ($LASTEXITCODE -eq 0)
}

if (Test-CompatibleNode $TargetExe) {
    exit 0
}

$arch = switch -Regex ($env:PROCESSOR_ARCHITECTURE) {
    '^(AMD64|x86_64)$' { 'x64'; break }
    '^ARM64$' { 'arm64'; break }
    default { throw "Unsupported Windows architecture: $env:PROCESSOR_ARCHITECTURE" }
}

$zipName = "node-v$NodeVersion-win-$arch.zip"
$releaseBase = "https://nodejs.org/dist/v$NodeVersion"
$workDir = Join-Path $env:TEMP ("focusrite-node22-" + [guid]::NewGuid().ToString('N'))
$zipPath = Join-Path $workDir $zipName
$sumsPath = Join-Path $workDir 'SHASUMS256.txt'

try {
    New-Item -ItemType Directory -Force -Path $workDir | Out-Null
    New-Item -ItemType Directory -Force -Path $BuildRoot | Out-Null

    Write-Host "Node 22.20+ absent. Preparation du Node portable v$NodeVersion..."
    Invoke-WebRequest -UseBasicParsing -Uri "$releaseBase/SHASUMS256.txt" -OutFile $sumsPath -TimeoutSec 60
    Invoke-WebRequest -UseBasicParsing -Uri "$releaseBase/$zipName" -OutFile $zipPath -TimeoutSec 180

    $sumLine = Get-Content -LiteralPath $sumsPath | Where-Object { $_ -match ("\s+" + [regex]::Escape($zipName) + '$') } | Select-Object -First 1
    if (-not $sumLine) { throw "Checksum entry not found for $zipName" }

    $expected = (($sumLine -split '\s+')[0]).ToLowerInvariant()
    $actual = (Get-FileHash -Algorithm SHA256 -LiteralPath $zipPath).Hash.ToLowerInvariant()
    if ($actual -ne $expected) { throw 'Node portable checksum verification failed.' }

    Expand-Archive -LiteralPath $zipPath -DestinationPath $workDir -Force
    $sourceDir = Join-Path $workDir "node-v$NodeVersion-win-$arch"
    if (-not (Test-Path -LiteralPath (Join-Path $sourceDir 'node.exe'))) {
        throw 'Downloaded Node archive did not contain node.exe.'
    }

    if (Test-Path -LiteralPath $TargetDir) {
        Remove-Item -LiteralPath $TargetDir -Recurse -Force
    }
    Move-Item -LiteralPath $sourceDir -Destination $TargetDir

    if (-not (Test-CompatibleNode $TargetExe)) { throw 'Portable Node validation failed after extraction.' }
    if (-not (Test-Path -LiteralPath (Join-Path $TargetDir 'corepack.cmd'))) { throw 'Portable Node does not contain Corepack.' }

    Write-Host "Node portable v$NodeVersion pret."
    exit 0
}
finally {
    if (Test-Path -LiteralPath $workDir) {
        Remove-Item -LiteralPath $workDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}

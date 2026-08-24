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

function Get-Sha256Hex([string]$Path) {
    $stream = $null
    $sha256 = $null
    try {
        $stream = [System.IO.File]::OpenRead($Path)
        $sha256 = [System.Security.Cryptography.SHA256]::Create()
        $bytes = $sha256.ComputeHash($stream)
        return ([System.BitConverter]::ToString($bytes)).Replace('-', '').ToLowerInvariant()
    }
    finally {
        if ($sha256 -ne $null) { $sha256.Dispose() }
        if ($stream -ne $null) { $stream.Dispose() }
    }
}

function Expand-ZipCompatible([string]$ZipPath, [string]$DestinationPath) {
    $expandArchive = Get-Command Expand-Archive -ErrorAction SilentlyContinue
    if ($expandArchive -ne $null) {
        Expand-Archive -LiteralPath $ZipPath -DestinationPath $DestinationPath -Force
        return
    }

    try {
        Add-Type -AssemblyName System.IO.Compression.FileSystem -ErrorAction Stop
        [System.IO.Compression.ZipFile]::ExtractToDirectory($ZipPath, $DestinationPath)
        return
    }
    catch {
        throw "No compatible ZIP extractor is available in this Windows PowerShell/.NET environment: $($_.Exception.Message)"
    }
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

    if ([System.Net.ServicePointManager]::SecurityProtocol.ToString() -notmatch 'Tls12') {
        try {
            [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        }
        catch {
            # Keep the platform default when TLS 1.2 cannot be selected explicitly.
        }
    }

    Invoke-WebRequest -UseBasicParsing -Uri "$releaseBase/SHASUMS256.txt" -OutFile $sumsPath -TimeoutSec 60
    Invoke-WebRequest -UseBasicParsing -Uri "$releaseBase/$zipName" -OutFile $zipPath -TimeoutSec 180

    $sumLine = Get-Content -LiteralPath $sumsPath | Where-Object { $_ -match ("\s+" + [regex]::Escape($zipName) + '$') } | Select-Object -First 1
    if (-not $sumLine) { throw "Checksum entry not found for $zipName" }

    $expected = (($sumLine -split '\s+')[0]).ToLowerInvariant()
    $actual = Get-Sha256Hex $zipPath
    if ($actual -ne $expected) { throw 'Node portable checksum verification failed.' }

    Expand-ZipCompatible $zipPath $workDir
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

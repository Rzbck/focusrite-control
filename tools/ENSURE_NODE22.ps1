$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$Root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$Tools = Join-Path $Root '.build-tools'
$NodeHome = Join-Path $Tools 'node22'
$Downloads = Join-Path $Tools 'downloads'
$NodeExe = Join-Path $NodeHome 'node.exe'

New-Item -ItemType Directory -Force -Path $Tools, $Downloads | Out-Null

function Test-CompatibleNode([string]$Exe) {
    if (-not (Test-Path -LiteralPath $Exe)) { return $false }
    try {
        & $Exe -e "const [a,b]=process.versions.node.split('.').map(Number); process.exit(a===22 && b>=20 ? 0 : 1)"
        return ($LASTEXITCODE -eq 0)
    } catch {
        return $false
    }
}

if (Test-CompatibleNode $NodeExe) {
    Write-Host ('[OK] Node portable deja present: ' + (& $NodeExe -v)) -ForegroundColor Green
    exit 0
}

$arch = switch ([System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture.ToString()) {
    'X64'   { 'x64' }
    'Arm64' { 'arm64' }
    default { throw 'Architecture Windows non supportee. Il faut x64 ou ARM64.' }
}

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$baseUrl = 'https://nodejs.org/dist/latest-v22.x'
$shaUrl = $baseUrl + '/SHASUMS256.txt'
Write-Host '[INFO] Lecture du manifeste officiel Node 22...' -ForegroundColor Cyan
$shaText = (Invoke-WebRequest -UseBasicParsing -Uri $shaUrl -TimeoutSec 30).Content

$pattern = '^(?<sha>[0-9a-fA-F]{64})\s+(?<file>node-v(?<ver>[0-9]+\.[0-9]+\.[0-9]+)-win-' + [regex]::Escape($arch) + '\.zip)$'
$latest = $null
foreach ($line in ($shaText -split "`r?`n")) {
    $match = [regex]::Match($line.Trim(), $pattern)
    if ($match.Success) {
        $latest = [pscustomobject]@{
            Sha = $match.Groups['sha'].Value.ToLowerInvariant()
            File = $match.Groups['file'].Value
            Version = $match.Groups['ver'].Value
        }
        break
    }
}
if (-not $latest) { throw ('ZIP Windows ' + $arch + ' introuvable dans SHASUMS256.txt.') }

$zipFile = Join-Path $Downloads $latest.File
$zipUrl = $baseUrl + '/' + $latest.File
Write-Host ('[INFO] Telechargement Node v' + $latest.Version + '...') -ForegroundColor Cyan
Invoke-WebRequest -UseBasicParsing -Uri $zipUrl -OutFile $zipFile -TimeoutSec 180

$actualSha = (Get-FileHash -Algorithm SHA256 -LiteralPath $zipFile).Hash.ToLowerInvariant()
if ($actualSha -ne $latest.Sha) {
    Remove-Item -Force $zipFile -ErrorAction SilentlyContinue
    throw 'SHA256 Node invalide. Telechargement refuse.'
}
Write-Host '[OK] SHA-256 Node valide.' -ForegroundColor Green

$staging = Join-Path $Tools ('node_extract_' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Force -Path $staging | Out-Null
try {
    Expand-Archive -LiteralPath $zipFile -DestinationPath $staging -Force
    $extracted = Get-ChildItem -LiteralPath $staging -Directory |
        Where-Object { $_.Name -like 'node-v*-win-*' } |
        Select-Object -First 1
    if (-not $extracted) { throw 'Le ZIP Node ne contient pas le dossier attendu.' }

    if (Test-Path -LiteralPath $NodeHome) { Remove-Item -Recurse -Force -LiteralPath $NodeHome }
    Move-Item -LiteralPath $extracted.FullName -Destination $NodeHome
} finally {
    Remove-Item -Recurse -Force -LiteralPath $staging -ErrorAction SilentlyContinue
}

if (-not (Test-CompatibleNode $NodeExe)) {
    throw 'Le Node portable final est incompatible. Il faut Node 22.20+.'
}
Write-Host ('[OK] Node portable pret: ' + (& $NodeExe -v)) -ForegroundColor Green
exit 0

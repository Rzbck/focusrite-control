param(
    [Parameter(Mandatory=$true)][string]$NodeExe,
    [int]$CaptureSeconds = 25,
    [switch]$Elevated
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 2.0

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$PrivateDir = Join-Path $RepoRoot '.local-captures'
$PrivateLogDir = Join-Path $RepoRoot '.local-logs'
$PrivateLog = Join-Path $PrivateLogDir 'PASSIVE_SESSION_latest.txt'
New-Item -ItemType Directory -Force -Path $PrivateDir, $PrivateLogDir | Out-Null

function Log([string]$Text) {
    Add-Content -LiteralPath $PrivateLog -Value $Text -Encoding UTF8
}

function Test-IsAdmin {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if ($NodeExe -eq 'node') {
    $resolvedNode = Get-Command node.exe -ErrorAction SilentlyContinue
    if ($resolvedNode -and $resolvedNode.Source) { $NodeExe = $resolvedNode.Source }
}

if (-not (Test-IsAdmin)) {
    if ($Elevated) { throw 'Administrator elevation failed.' }
    Write-Host '[INFO] Pktmon demande les droits administrateur. Une fenetre UAC va apparaitre.' -ForegroundColor Yellow
    $args = @(
        '-NoLogo', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ('"{0}"' -f $PSCommandPath),
        '-NodeExe', ('"{0}"' -f $NodeExe), '-CaptureSeconds', [string]$CaptureSeconds, '-Elevated'
    )
    $p = Start-Process -FilePath 'powershell.exe' -ArgumentList $args -Verb RunAs -Wait -PassThru
    exit $p.ExitCode
}

Set-Content -LiteralPath $PrivateLog -Value 'Focusrite passive official-client session capture' -Encoding UTF8
Log ('Started: ' + (Get-Date).ToString('s'))
Log 'Mode: passive pktmon capture; observer sends no Focusrite protocol traffic.'

if (-not (Get-Command pktmon.exe -ErrorAction SilentlyContinue)) {
    throw 'pktmon.exe is unavailable on this Windows installation.'
}
if (-not (Test-Path -LiteralPath $NodeExe)) {
    throw 'Node executable is unavailable after elevation.'
}
if ($CaptureSeconds -lt 15 -or $CaptureSeconds -gt 60) {
    throw 'CaptureSeconds must be between 15 and 60.'
}

function Get-FocusriteServerPort {
    $processes = @(Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -match '(?i)focusrite' })
    if ($processes.Count -eq 0) { return $null }
    $ids = @($processes | ForEach-Object { $_.Id })
    $listeners = @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $ids -contains $_.OwningProcess -and $_.LocalPort -gt 1024 })
    if ($listeners.Count -eq 0) { return $null }

    $candidates = foreach ($listener in $listeners) {
        $proc = $processes | Where-Object { $_.Id -eq $listener.OwningProcess } | Select-Object -First 1
        $score = 0
        if ($proc.ProcessName -match '(?i)server') { $score += 100 }
        try {
            if ($proc.MainModule.FileVersionInfo.FileDescription -match '(?i)server') { $score += 100 }
        } catch {}
        $established = @(Get-NetTCPConnection -State Established -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq $listener.LocalPort -or $_.RemotePort -eq $listener.LocalPort }).Count
        $score += [Math]::Min($established, 20)
        [pscustomobject]@{ Port = [int]$listener.LocalPort; Score = $score }
    }

    $best = @($candidates | Sort-Object -Property @{Expression='Score';Descending=$true}, @{Expression='Port';Descending=$true})
    if ($best.Count -eq 0) { return $null }
    if ($best.Count -gt 1 -and $best[0].Score -eq $best[1].Score -and $best[0].Score -eq 0) { return $null }
    return [int]$best[0].Port
}

$serverPort = Get-FocusriteServerPort
if (-not $serverPort) {
    throw 'Unable to identify the Focusrite Control Server listening port passively. Keep Focusrite Control open and retry.'
}
Log 'Focusrite Control Server listening port identified locally (value intentionally not published).'

$filterText = (& pktmon.exe filter list 2>&1 | Out-String)
if ($LASTEXITCODE -ne 0) { throw 'Unable to inspect existing Pktmon filters.' }
if ($filterText -match '(?m)^\s*\d+\s+') {
    throw 'Existing Pktmon filters are active. Passive observer refuses to overwrite another diagnostic session.'
}

$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$etl = Join-Path $PrivateDir ('official_session_' + $stamp + '.etl')
$pcap = Join-Path $PrivateDir ('official_session_' + $stamp + '.pcapng')
$captureStarted = $false
$filterAdded = $false
$portChanged = $false
$success = $false

try {
    & pktmon.exe filter add FocusritePassiveObserver -t TCP -p $serverPort | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Unable to add the temporary Focusrite TCP capture filter.' }
    $filterAdded = $true

    & pktmon.exe start --capture --pkt-size 0 --file-name $etl --file-size 128 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Pktmon capture could not start. Another Pktmon session may already be active.' }
    $captureStarted = $true

    Write-Host ''
    Write-Host '==============================================================' -ForegroundColor Cyan
    Write-Host ' CAPTURE PASSIVE OFFICIELLE FOCUSRITE EN COURS' -ForegroundColor Cyan
    Write-Host '==============================================================' -ForegroundColor Cyan
    Write-Host 'Aucun message Focusrite n est envoye par ce script.' -ForegroundColor Green
    Write-Host 'Maintenant : ferme uniquement la fenetre Focusrite Control,' -ForegroundColor Yellow
    Write-Host 'puis rouvre Focusrite Control normalement.' -ForegroundColor Yellow
    Write-Host 'Ne touche a aucun Air / Pad / Mute / Dim / Talkback.' -ForegroundColor Yellow
    Write-Host ('La capture s arrete automatiquement dans {0} secondes.' -f $CaptureSeconds) -ForegroundColor Yellow
    Write-Host ''

    for ($i = $CaptureSeconds; $i -gt 0; $i--) {
        Write-Host -NoNewline ("`rCapture restante : {0,2}s   " -f $i)
        Start-Sleep -Seconds 1
        $current = Get-FocusriteServerPort
        if ($current -and $current -ne $serverPort) { $portChanged = $true }
    }
    Write-Host ''

    & pktmon.exe stop | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Pktmon capture could not stop cleanly.' }
    $captureStarted = $false

    if (-not (Test-Path -LiteralPath $etl)) { throw 'Pktmon ETL capture file was not created.' }
    & pktmon.exe etl2pcap $etl --out $pcap | Out-Null
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $pcap)) {
        throw 'Pktmon ETL to PCAPNG conversion failed.'
    }

    & $NodeExe (Join-Path $PSScriptRoot 'parse-passive-session.js') --pcapng $pcap --server-port $serverPort --capture-seconds $CaptureSeconds --server-port-changed ([string]$portChanged).ToLowerInvariant()
    if ($LASTEXITCODE -ne 0) { throw 'Sanitized passive-session parser failed.' }
    Log 'Sanitized parser completed successfully.'
    $success = $true
}
finally {
    if ($captureStarted) {
        try { & pktmon.exe stop | Out-Null } catch {}
    }
    Remove-Item -LiteralPath $etl -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $pcap -Force -ErrorAction SilentlyContinue
    if ($filterAdded) {
        try { & pktmon.exe filter remove | Out-Null } catch {}
    }
    Log 'Cleanup complete: raw ETL/PCAPNG removed; temporary Pktmon filter removed.'
}

if (-not $success) { exit 1 }
Write-Host ''
Write-Host 'PASSIVE CAPTURE TERMINEE. Les captures brutes ont ete supprimees.' -ForegroundColor Green
exit 0

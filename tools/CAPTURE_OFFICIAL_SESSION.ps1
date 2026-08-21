param(
    [Parameter(Mandatory=$true)][string]$NodeExe,
    [int]$CaptureSeconds = 25,
    [switch]$Elevated
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 2.0

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$PrivateDir = Join-Path $RepoRoot '.local-captures'
$LogDir = Join-Path $RepoRoot '.local-logs'
$PrivateLog = Join-Path $LogDir 'PASSIVE_SESSION_latest.txt'
$StatusFile = Join-Path $LogDir 'PASSIVE_SESSION_STATUS.txt'
New-Item -ItemType Directory -Force -Path $PrivateDir, $LogDir | Out-Null

function Log([string]$Text) { Add-Content -LiteralPath $PrivateLog -Value $Text -Encoding UTF8 }
function Set-SafeStatus([string]$Outcome, [string]$Stage, [string]$Code) {
    $lines = [string[]]@(
        ('outcome=' + $Outcome),
        ('stage=' + $Stage),
        ('code=' + $Code)
    )
    [System.IO.File]::WriteAllLines($StatusFile, $lines, [System.Text.Encoding]::ASCII)
}
function Test-IsAdmin {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}
function Get-ProcessMetadata([int]$ProcessId) {
    try {
        $proc = Get-Process -Id $ProcessId -ErrorAction Stop
        $parts = @([string]$proc.ProcessName)
        try {
            $info = $proc.MainModule.FileVersionInfo
            foreach ($value in @($info.FileDescription, $info.ProductName, $info.CompanyName, $info.OriginalFilename)) {
                if ($value) { $parts += [string]$value }
            }
        } catch {}
        return ($parts -join ' ')
    } catch { return '' }
}
function Find-FocusriteServerPort {
    $listeners = @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -gt 1024 })
    $connections = @(Get-NetTCPConnection -ErrorAction SilentlyContinue)
    $candidates = @()
    foreach ($listener in $listeners) {
        $meta = Get-ProcessMetadata -ProcessId ([int]$listener.OwningProcess)
        $score = 0
        if ($meta -match '(?i)focusrite') { $score += 300 }
        if ($meta -match '(?i)control[\s_-]*server|controlserver') { $score += 220 }
        if ($meta -match '(?i)scarlett') { $score += 80 }
        if ($score -lt 220) { continue }
        $established = @($connections | Where-Object {
            $_.State -eq 'Established' -and ($_.LocalPort -eq $listener.LocalPort -or $_.RemotePort -eq $listener.LocalPort)
        }).Count
        $score += [Math]::Min($established * 5, 50)
        $candidates += [pscustomobject]@{ Port = [int]$listener.LocalPort; Score = $score }
    }
    $best = @($candidates | Sort-Object -Property @{Expression='Score';Descending=$true}, @{Expression='Port';Descending=$true})
    if ($best.Count -eq 0) { return [pscustomobject]@{ State='none'; Port=0 } }
    if ($best.Count -gt 1 -and $best[0].Score -eq $best[1].Score) { return [pscustomobject]@{ State='ambiguous'; Port=0 } }
    return [pscustomobject]@{ State='ok'; Port=[int]$best[0].Port }
}

if ($NodeExe -eq 'node') {
    $resolvedNode = Get-Command node.exe -ErrorAction SilentlyContinue
    if ($resolvedNode -and $resolvedNode.Source) { $NodeExe = $resolvedNode.Source }
}
if (-not (Test-Path -LiteralPath $PrivateLog)) {
    Set-Content -LiteralPath $PrivateLog -Value 'Focusrite passive official-client session capture' -Encoding UTF8
}
Set-SafeStatus 'FAILED' 'bootstrap' 'unexpected'
Log ('Bootstrap: ' + (Get-Date).ToString('s'))

if (-not (Test-IsAdmin)) {
    if ($Elevated) {
        Set-SafeStatus 'FAILED' 'elevation' 'elevation-failed'
        Log 'FAILED stage=elevation code=elevation-failed'
        exit 1
    }
    Write-Host '[INFO] Pktmon demande les droits administrateur. Une fenetre UAC va apparaitre.' -ForegroundColor Yellow
    $scriptArg = $PSCommandPath.Replace('"','""')
    $nodeArg = $NodeExe.Replace('"','""')
    $argLine = '-NoLogo -NoProfile -ExecutionPolicy Bypass -File "{0}" -NodeExe "{1}" -CaptureSeconds {2} -Elevated' -f $scriptArg, $nodeArg, $CaptureSeconds
    try {
        $child = Start-Process -FilePath 'powershell.exe' -ArgumentList $argLine -Verb RunAs -Wait -PassThru
        Log ('Elevated child exit code: ' + [string]$child.ExitCode)
        exit $child.ExitCode
    } catch {
        Set-SafeStatus 'FAILED' 'elevation' 'uac-cancelled'
        Log 'FAILED stage=elevation code=uac-cancelled'
        exit 1
    }
}

$Stage = 'preflight'
$Code = 'unexpected'
$captureStarted = $false
$filterAdded = $false
$portChanged = $false
$etl = $null
$pcap = $null
$serverPort = 0
$success = $false
$cleanupFailed = $false

try {
    Log ('Elevated worker started: ' + (Get-Date).ToString('s'))
    if (-not (Get-Command pktmon.exe -ErrorAction SilentlyContinue)) { $Code='pktmon-unavailable'; throw 'controlled' }
    if (-not (Test-Path -LiteralPath $NodeExe)) { $Code='node-unavailable'; throw 'controlled' }
    if ($CaptureSeconds -lt 15 -or $CaptureSeconds -gt 60) { $Code='invalid-duration'; throw 'controlled' }

    $Stage = 'detect-server-port'
    $server = Find-FocusriteServerPort
    if ($server.State -eq 'none') { $Code='no-server-listener'; throw 'controlled' }
    if ($server.State -eq 'ambiguous') { $Code='ambiguous-server-listener'; throw 'controlled' }
    $serverPort = [int]$server.Port
    Log 'Focusrite Control Server port identified locally; value intentionally not logged/published.'

    $Stage = 'inspect-filters'
    $filterText = (& pktmon.exe filter list 2>&1 | Out-String)
    if ($LASTEXITCODE -ne 0) { $Code='filter-inspect-failed'; throw 'controlled' }
    if ($filterText -match '(?m)^\s*\d+\s+') { $Code='filters-active'; throw 'controlled' }

    $stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
    $etl = Join-Path $PrivateDir ('official_session_' + $stamp + '.etl')
    $pcap = Join-Path $PrivateDir ('official_session_' + $stamp + '.pcapng')

    $Stage = 'add-filter'
    & pktmon.exe filter add FocusritePassiveObserver -t TCP -p $serverPort | Out-Null
    if ($LASTEXITCODE -ne 0) { $Code='filter-add-failed'; throw 'controlled' }
    $filterAdded = $true

    $Stage = 'capture-start'
    & pktmon.exe start --capture --pkt-size 0 --file-name $etl --file-size 128 | Out-Null
    if ($LASTEXITCODE -ne 0) { $Code='capture-start-failed'; throw 'controlled' }
    $captureStarted = $true

    $Stage = 'capture-window'
    Write-Host ''
    Write-Host '==============================================================' -ForegroundColor Cyan
    Write-Host ' CAPTURE PASSIVE OFFICIELLE FOCUSRITE EN COURS' -ForegroundColor Cyan
    Write-Host '==============================================================' -ForegroundColor Cyan
    Write-Host 'Ferme uniquement Focusrite Control puis rouvre-le normalement.' -ForegroundColor Yellow
    Write-Host 'Ne touche pas Air / Pad / Mute / Dim / Talkback.' -ForegroundColor Yellow
    for ($i=$CaptureSeconds; $i -gt 0; $i--) {
        Write-Host -NoNewline ("`rCapture restante : {0,2}s   " -f $i)
        Start-Sleep -Seconds 1
        $current = Find-FocusriteServerPort
        if ($current.State -eq 'ok' -and [int]$current.Port -ne $serverPort) { $portChanged = $true }
    }
    Write-Host ''

    $Stage = 'capture-stop'
    & pktmon.exe stop | Out-Null
    if ($LASTEXITCODE -ne 0) { $Code='capture-stop-failed'; throw 'controlled' }
    $captureStarted = $false
    if (-not (Test-Path -LiteralPath $etl)) { $Code='etl-missing'; throw 'controlled' }

    $Stage = 'convert'
    & pktmon.exe etl2pcap $etl --out $pcap | Out-Null
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $pcap)) { $Code='conversion-failed'; throw 'controlled' }

    $Stage = 'parse'
    & $NodeExe (Join-Path $PSScriptRoot 'parse-passive-session.js') --pcapng $pcap --server-port $serverPort --capture-seconds $CaptureSeconds --server-port-changed ([string]$portChanged).ToLowerInvariant()
    if ($LASTEXITCODE -ne 0) { $Code='parser-failed'; throw 'controlled' }
    $success = $true
} catch {
    Set-SafeStatus 'FAILED' $Stage $Code
    Log ('FAILED stage=' + $Stage + ' code=' + $Code)
    Write-Host ('ECHEC CAPTURE - stage={0} code={1}' -f $Stage, $Code) -ForegroundColor Red
} finally {
    if ($captureStarted) { try { & pktmon.exe stop | Out-Null } catch { $cleanupFailed=$true } }
    if ($etl) { Remove-Item -LiteralPath $etl -Force -ErrorAction SilentlyContinue }
    if ($pcap) { Remove-Item -LiteralPath $pcap -Force -ErrorAction SilentlyContinue }
    if ($filterAdded) {
        try {
            # Microsoft documents `pktmon filter remove` as removing all filters.
            # Safe here because the harness refuses to start when a pre-existing filter is detected.
            & pktmon.exe filter remove | Out-Null
            if ($LASTEXITCODE -ne 0) { $cleanupFailed=$true }
        } catch { $cleanupFailed=$true }
    }
    Log 'Cleanup attempted: raw ETL/PCAPNG removed; Pktmon filters cleaned after clean-filter preflight.'
}

if ($cleanupFailed) {
    Set-SafeStatus 'FAILED' 'cleanup' 'cleanup-failed'
    Log 'FAILED stage=cleanup code=cleanup-failed'
    exit 1
}
if (-not $success) { exit 1 }
Set-SafeStatus 'SUCCESS' 'complete' 'ok'
Log 'SUCCESS stage=complete code=ok'
Write-Host 'PASSIVE CAPTURE TERMINEE. Les captures brutes ont ete supprimees.' -ForegroundColor Green
exit 0

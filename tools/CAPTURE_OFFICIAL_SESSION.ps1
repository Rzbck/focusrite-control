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
$StatusFile = Join-Path $PrivateLogDir 'PASSIVE_SESSION_STATUS.txt'
New-Item -ItemType Directory -Force -Path $PrivateDir, $PrivateLogDir | Out-Null

function Log([string]$Text) {
    Add-Content -LiteralPath $PrivateLog -Value $Text -Encoding UTF8
}

function Set-SafeStatus([string]$Outcome, [string]$Stage, [string]$Code) {
    @(
        ('outcome=' + $Outcome),
        ('stage=' + $Stage),
        ('code=' + $Code)
    ) | Set-Content -LiteralPath $StatusFile -Encoding ASCII
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
    } catch {
        return ''
    }
}

function Find-FocusriteServerPort {
    $listeners = @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -gt 1024 })
    if ($listeners.Count -eq 0) {
        return [pscustomobject]@{ State = 'none'; Port = 0 }
    }
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
    if ($best.Count -eq 0) {
        return [pscustomobject]@{ State = 'none'; Port = 0 }
    }
    if ($best.Count -gt 1 -and $best[0].Score -eq $best[1].Score) {
        return [pscustomobject]@{ State = 'ambiguous'; Port = 0 }
    }
    return [pscustomobject]@{ State = 'ok'; Port = [int]$best[0].Port }
}

if ($NodeExe -eq 'node') {
    $resolvedNode = Get-Command node.exe -ErrorAction SilentlyContinue
    if ($resolvedNode -and $resolvedNode.Source) { $NodeExe = $resolvedNode.Source }
}

if (-not (Test-Path -LiteralPath $PrivateLog)) {
    Set-Content -LiteralPath $PrivateLog -Value 'Focusrite passive official-client session capture' -Encoding UTF8
}
Set-SafeStatus -Outcome 'FAILED' -Stage 'bootstrap' -Code 'unexpected'
Log ('Bootstrap: ' + (Get-Date).ToString('s'))

if (-not (Test-IsAdmin)) {
    if ($Elevated) {
        Set-SafeStatus -Outcome 'FAILED' -Stage 'elevation' -Code 'elevation-failed'
        exit 1
    }
    Write-Host '[INFO] Pktmon demande les droits administrateur. Une fenetre UAC va apparaitre.' -ForegroundColor Yellow
    $scriptArg = $PSCommandPath.Replace('"', '""')
    $nodeArg = $NodeExe.Replace('"', '""')
    $argLine = '-NoLogo -NoProfile -ExecutionPolicy Bypass -File "{0}" -NodeExe "{1}" -CaptureSeconds {2} -Elevated' -f $scriptArg, $nodeArg, $CaptureSeconds
    try {
        $p = Start-Process -FilePath 'powershell.exe' -ArgumentList $argLine -Verb RunAs -Wait -PassThru
        Log ('Elevated child exit code: ' + [string]$p.ExitCode)
        exit $p.ExitCode
    } catch {
        Set-SafeStatus -Outcome 'FAILED' -Stage 'elevation' -Code 'uac-cancelled'
        Log 'FAILED stage=elevation code=uac-cancelled'
        Write-Host 'ECHEC UAC/elevation. Aucun paquet n a ete capture.' -ForegroundColor Red
        exit 1
    }
}

$CurrentStage = 'preflight'
$FailureCode = 'unexpected'
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
    Log 'Mode: passive pktmon capture; observer sends no Focusrite protocol traffic.'

    $CurrentStage = 'preflight'
    if (-not (Get-Command pktmon.exe -ErrorAction SilentlyContinue)) {
        $FailureCode = 'pktmon-unavailable'; throw 'controlled'
    }
    if (-not (Test-Path -LiteralPath $NodeExe)) {
        $FailureCode = 'node-unavailable'; throw 'controlled'
    }
    if ($CaptureSeconds -lt 15 -or $CaptureSeconds -gt 60) {
        $FailureCode = 'invalid-duration'; throw 'controlled'
    }

    $CurrentStage = 'detect-server-port'
    $server = Find-FocusriteServerPort
    if ($server.State -eq 'none') {
        $FailureCode = 'no-server-listener'; throw 'controlled'
    }
    if ($server.State -eq 'ambiguous') {
        $FailureCode = 'ambiguous-server-listener'; throw 'controlled'
    }
    $serverPort = [int]$server.Port
    Log 'Focusrite Control Server listening port identified locally (value intentionally not logged/published).'

    $CurrentStage = 'inspect-filters'
    $filterText = (& pktmon.exe filter list 2>&1 | Out-String)
    if ($LASTEXITCODE -ne 0) {
        $FailureCode = 'filter-inspect-failed'; throw 'controlled'
    }
    if ($filterText -match '(?m)^\s*\d+\s+') {
        $FailureCode = 'filters-active'; throw 'controlled'
    }

    $stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
    $etl = Join-Path $PrivateDir ('official_session_' + $stamp + '.etl')
    $pcap = Join-Path $PrivateDir ('official_session_' + $stamp + '.pcapng')

    $CurrentStage = 'add-filter'
    & pktmon.exe filter add FocusritePassiveObserver -t TCP -p $serverPort | Out-Null
    if ($LASTEXITCODE -ne 0) {
        $FailureCode = 'filter-add-failed'; throw 'controlled'
    }
    $filterAdded = $true

    $CurrentStage = 'capture-start'
    & pktmon.exe start --capture --pkt-size 0 --file-name $etl --file-size 128 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        $FailureCode = 'capture-start-failed'; throw 'controlled'
    }
    $captureStarted = $true

    $CurrentStage = 'capture-window'
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
        $current = Find-FocusriteServerPort
        if ($current.State -eq 'ok' -and [int]$current.Port -ne $serverPort) { $portChanged = $true }
    }
    Write-Host ''

    $CurrentStage = 'capture-stop'
    & pktmon.exe stop | Out-Null
    if ($LASTEXITCODE -ne 0) {
        $FailureCode = 'capture-stop-failed'; throw 'controlled'
    }
    $captureStarted = $false

    if (-not (Test-Path -LiteralPath $etl)) {
        $FailureCode = 'etl-missing'; throw 'controlled'
    }

    $CurrentStage = 'convert'
    & pktmon.exe etl2pcap $etl --out $pcap | Out-Null
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $pcap)) {
        $FailureCode = 'conversion-failed'; throw 'controlled'
    }

    $CurrentStage = 'parse'
    & $NodeExe (Join-Path $PSScriptRoot 'parse-passive-session.js') --pcapng $pcap --server-port $serverPort --capture-seconds $CaptureSeconds --server-port-changed ([string]$portChanged).ToLowerInvariant()
    if ($LASTEXITCODE -ne 0) {
        $FailureCode = 'parser-failed'; throw 'controlled'
    }

    $success = $true
} catch {
    Set-SafeStatus -Outcome 'FAILED' -Stage $CurrentStage -Code $FailureCode
    Log ('FAILED stage=' + $CurrentStage + ' code=' + $FailureCode)
    Write-Host ''
    Write-Host ('ECHEC CAPTURE - stage={0} code={1}' -f $CurrentStage, $FailureCode) -ForegroundColor Red
} finally {
    $CurrentStage = 'cleanup'
    if ($captureStarted) {
        try { & pktmon.exe stop | Out-Null } catch { $cleanupFailed = $true }
    }
    if ($etl) { Remove-Item -LiteralPath $etl -Force -ErrorAction SilentlyContinue }
    if ($pcap) { Remove-Item -LiteralPath $pcap -Force -ErrorAction SilentlyContinue }
    if ($filterAdded) {
        try {
            & pktmon.exe filter remove FocusritePassiveObserver | Out-Null
            if ($LASTEXITCODE -ne 0) { $cleanupFailed = $true }
        } catch { $cleanupFailed = $true }
    }
    Log 'Cleanup attempted: raw ETL/PCAPNG removed; temporary named Pktmon filter removal attempted.'
}

if ($cleanupFailed) {
    Set-SafeStatus -Outcome 'FAILED' -Stage 'cleanup' -Code 'cleanup-failed'
    Log 'FAILED stage=cleanup code=cleanup-failed'
    Write-Host 'ECHEC NETTOYAGE PKTMON - verifier le statut publie avant de relancer.' -ForegroundColor Red
    exit 1
}
if (-not $success) { exit 1 }

Set-SafeStatus -Outcome 'SUCCESS' -Stage 'complete' -Code 'ok'
Log 'SUCCESS stage=complete code=ok'
Write-Host ''
Write-Host 'PASSIVE CAPTURE TERMINEE. Les captures brutes ont ete supprimees.' -ForegroundColor Green
exit 0

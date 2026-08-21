param(
    [Parameter(Mandatory=$true)][string]$NodeExe,
    [int]$ObserveSeconds = 20,
    [switch]$Elevated
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 2.0

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$LogDir = Join-Path $RepoRoot '.local-logs'
$PrivateLog = Join-Path $LogDir 'MEMORY_OBSERVER_latest.txt'
$StatusFile = Join-Path $LogDir 'MEMORY_OBSERVER_STATUS.txt'
$EvidenceFile = Join-Path $LogDir 'MEMORY_OBSERVER_EVIDENCE.json'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Write-AsciiFile([string]$Path, [string]$Text) {
    [System.IO.File]::WriteAllText($Path, $Text, [System.Text.Encoding]::ASCII)
}
function Set-SafeStatus([string]$Outcome, [string]$Stage, [string]$Code) {
    Write-AsciiFile $StatusFile ("outcome=$Outcome`r`nstage=$Stage`r`ncode=$Code`r`n")
}
function Log([string]$Text) { Add-Content -LiteralPath $PrivateLog -Value $Text -Encoding UTF8 }
function Test-IsAdmin {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}
function Get-OfficialClientCandidates {
    $items = @()
    foreach ($proc in @(Get-Process -ErrorAction SilentlyContinue)) {
        try {
            $parts = @([string]$proc.ProcessName)
            try {
                $info = $proc.MainModule.FileVersionInfo
                foreach ($value in @($info.FileDescription, $info.ProductName, $info.CompanyName, $info.OriginalFilename)) {
                    if ($value) { $parts += [string]$value }
                }
            } catch {}
            $meta = $parts -join ' '
            if ($meta -notmatch '(?i)focusrite') { continue }
            if ($meta -notmatch '(?i)control') { continue }
            if ($meta -match '(?i)server') { continue }
            $items += [pscustomobject]@{ Id = [int]$proc.Id }
        } catch {}
    }
    return @($items | Sort-Object Id -Unique | Select-Object -First 8)
}

if ($NodeExe -eq 'node') {
    $resolvedNode = Get-Command node.exe -ErrorAction SilentlyContinue
    if ($resolvedNode -and $resolvedNode.Source) { $NodeExe = $resolvedNode.Source }
}

if (-not (Test-IsAdmin)) {
    if ($Elevated) {
        Set-SafeStatus 'FAILED' 'elevation' 'elevation-failed'
        exit 1
    }
    Write-Host '[INFO] Lecture memoire du processus : demande UAC Windows.' -ForegroundColor Yellow
    $scriptArg = $PSCommandPath.Replace('"','""')
    $nodeArg = $NodeExe.Replace('"','""')
    $argLine = '-NoLogo -NoProfile -ExecutionPolicy Bypass -File "{0}" -NodeExe "{1}" -ObserveSeconds {2} -Elevated' -f $scriptArg, $nodeArg, $ObserveSeconds
    try {
        $child = Start-Process -FilePath 'powershell.exe' -ArgumentList $argLine -Verb RunAs -Wait -PassThru
        exit $child.ExitCode
    } catch {
        Set-SafeStatus 'FAILED' 'elevation' 'uac-cancelled'
        exit 1
    }
}

Set-Content -LiteralPath $PrivateLog -Value 'Focusrite official-client read-only memory observer' -Encoding UTF8
Remove-Item -LiteralPath $EvidenceFile -Force -ErrorAction SilentlyContinue
Set-SafeStatus 'FAILED' 'bootstrap' 'unexpected'
Log ('Started: ' + (Get-Date).ToString('s'))
Log 'Mode: OpenProcess + VirtualQueryEx + ReadProcessMemory only; no process write/injection.'

$Stage = 'preflight'
$Code = 'unexpected'
try {
    if ($ObserveSeconds -lt 10 -or $ObserveSeconds -gt 60) { $Code='invalid-duration'; throw 'controlled' }
    if (-not (Test-Path -LiteralPath $NodeExe)) { $Code='node-unavailable'; throw 'controlled' }

    $Stage = 'compile-scanner'
    $source = Join-Path $PSScriptRoot 'FocusriteMemoryObserver.cs'
    if (-not (Test-Path -LiteralPath $source)) { $Code='scanner-source-missing'; throw 'controlled' }
    Add-Type -Path $source -ErrorAction Stop

    $baseline = @(Get-OfficialClientCandidates)
    $baselineIds = @($baseline | ForEach-Object { $_.Id })
    $sawBaselineDisappear = $false
    $restartDetected = $false
    $current = $baseline

    $Stage = 'wait-restart'
    Write-Host ''
    Write-Host '==============================================================' -ForegroundColor Cyan
    Write-Host ' OBSERVATION MEMOIRE READ-ONLY DU CLIENT FOCUSRITE' -ForegroundColor Cyan
    Write-Host '==============================================================' -ForegroundColor Cyan
    Write-Host 'Ferme uniquement Focusrite Control puis rouvre-le normalement.' -ForegroundColor Yellow
    Write-Host 'Ne touche pas Air / Pad / Mute / Dim / Talkback.' -ForegroundColor Yellow
    Write-Host 'Aucun dump memoire ne sera cree. Aucun write/injection.' -ForegroundColor Green
    Write-Host ''

    for ($i=$ObserveSeconds; $i -gt 0; $i--) {
        Write-Host -NoNewline ("`rFenetre restante : {0,2}s   " -f $i)
        Start-Sleep -Seconds 1
        $now = @(Get-OfficialClientCandidates)
        $nowIds = @($now | ForEach-Object { $_.Id })
        if ($baselineIds.Count -gt 0 -and @($baselineIds | Where-Object { $nowIds -contains $_ }).Count -lt $baselineIds.Count) {
            $sawBaselineDisappear = $true
        }
        if ($sawBaselineDisappear -and @($nowIds | Where-Object { $baselineIds -notcontains $_ }).Count -gt 0) {
            $restartDetected = $true
            $current = $now
            Start-Sleep -Milliseconds 750
            break
        }
        $current = $now
    }
    Write-Host ''

    if ($current.Count -eq 0) {
        $current = @(Get-OfficialClientCandidates)
    }
    if ($current.Count -eq 0) { $Code='official-client-not-found'; throw 'controlled' }

    $Stage = 'scan-memory'
    $ids = [int[]]@($current | ForEach-Object { [int]$_.Id } | Select-Object -First 8)
    $scan = [FocusriteDiagnostics.MemoryObserver]::Scan($ids)
    if ($scan.ProcessesScanned -lt 1) { $Code='process-memory-unreadable'; throw 'controlled' }

    $Stage = 'write-sanitized-evidence'
    $evidence = [ordered]@{
        ProcessesAttempted = [int]$scan.ProcessesAttempted
        ProcessesScanned = [int]$scan.ProcessesScanned
        ScanLimitReached = [bool]$scan.ScanLimitReached
        RestartDetected = [bool]$restartDetected
        Frames = @($scan.Frames)
    }
    $json = $evidence | ConvertTo-Json -Depth 8 -Compress
    [System.IO.File]::WriteAllText($EvidenceFile, $json, (New-Object System.Text.UTF8Encoding($false)))

    Set-SafeStatus 'SUCCESS' 'complete' 'ok'
    Log 'SUCCESS stage=complete code=ok; only sanitized frame evidence written locally.'
    Write-Host 'OBSERVATION MEMOIRE TERMINEE. Aucune memoire brute n a ete ecrite sur disque.' -ForegroundColor Green
    exit 0
} catch {
    Set-SafeStatus 'FAILED' $Stage $Code
    Log ('FAILED stage=' + $Stage + ' code=' + $Code)
    Write-Host ('ECHEC OBSERVER - stage={0} code={1}' -f $Stage, $Code) -ForegroundColor Red
    Remove-Item -LiteralPath $EvidenceFile -Force -ErrorAction SilentlyContinue
    exit 1
}

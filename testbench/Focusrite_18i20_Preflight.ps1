[CmdletBinding()]
param(
    [string]$CompanionBaseUrl = 'http://127.0.0.1:8000',
    [string]$ConnectionLabel = ''
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'

$ExpectedModel = 'Scarlett 18i20 (3rd Gen)'
$ExpectedModuleId = 'focusrite-scarlett-18i20'

function Normalize-BaseUrl([string]$Url) {
    return $Url.TrimEnd('/')
}

function Escape-PathPart([string]$Value) {
    return [System.Uri]::EscapeDataString($Value)
}

function Write-Check([string]$Status, [string]$Name, [string]$Detail = '') {
    $line = ('{0,-5} {1}' -f $Status, $Name)
    if ($Detail) { $line += " :: $Detail" }
    switch ($Status) {
        'PASS' { Write-Host $line -ForegroundColor Green }
        'FAIL' { Write-Host $line -ForegroundColor Red }
        'INFO' { Write-Host $line -ForegroundColor Cyan }
        default { Write-Host $line }
    }
}

function Invoke-CompanionGet([string]$Path) {
    $url = "$(Normalize-BaseUrl $CompanionBaseUrl)$Path"
    try {
        return Invoke-RestMethod -Method Get -Uri $url -TimeoutSec 5
    }
    catch {
        $status = $null
        try { $status = [int]$_.Exception.Response.StatusCode } catch { $status = $null }
        if ($status -eq 403) {
            throw 'Companion HTTP API returned 403. Enable the HTTP API in Companion Settings, then rerun.'
        }
        throw "Companion API request failed: GET $Path :: $($_.Exception.Message)"
    }
}

function Get-Connections {
    $data = Invoke-CompanionGet '/api/connections'
    if ($null -eq $data) { return @() }
    if ($data.PSObject.Properties.Name -contains 'connections') {
        return @($data.connections)
    }
    return @($data)
}

function Read-ModuleVariable([string]$Label, [string]$Name) {
    $labelPart = Escape-PathPart $Label
    $namePart = Escape-PathPart $Name
    $url = "$(Normalize-BaseUrl $CompanionBaseUrl)/api/variable/$labelPart/$namePart/value"
    try {
        return ((Invoke-WebRequest -UseBasicParsing -Method Get -Uri $url -TimeoutSec 5).Content).Trim()
    }
    catch {
        $status = $null
        try { $status = [int]$_.Exception.Response.StatusCode } catch { $status = $null }
        if ($status -eq 404) { throw "Module variable not found: $Name" }
        if ($status -eq 403) { throw 'Companion HTTP API returned 403. Enable the HTTP API in Companion Settings, then rerun.' }
        throw "Variable read failed: $Name :: $($_.Exception.Message)"
    }
}

function Select-FocusriteConnection($Connections) {
    $candidates = @($Connections | Where-Object { [string]$_.moduleId -eq $ExpectedModuleId })
    if ($ConnectionLabel) {
        $candidates = @($candidates | Where-Object { [string]$_.label -eq $ConnectionLabel })
    }
    if ($candidates.Count -eq 0) { return $null }
    if ($candidates.Count -eq 1) { return $candidates[0] }

    $enabled = @($candidates | Where-Object { $_.enabled -eq $true })
    if ($enabled.Count -eq 1) { return $enabled[0] }
    throw 'Multiple matching Focusrite connections found. Disable duplicates or rerun with -ConnectionLabel.'
}

$failures = 0

Write-Host ''
Write-Host '=================================================================='
Write-Host ' FOCUSRITE 18i20 COMPANION TESTBENCH v0.2 - PREFLIGHT ONLY'
Write-Host '=================================================================='
Write-Host 'READ-ONLY: this preflight presses no buttons and sends no hardware writes.'
Write-Host 'Target: Scarlett 18i20 (3rd Gen) only.'
Write-Host ''

try {
    $connections = Get-Connections
    Write-Check 'PASS' 'Companion HTTP API reachable' ("Connections found: {0}" -f $connections.Count)
}
catch {
    Write-Check 'FAIL' 'Companion HTTP API reachable' $_.Exception.Message
    Write-Host ''
    Write-Host 'PREFLIGHT FAILED - no hardware write was attempted.'
    exit 2
}

try {
    $connection = Select-FocusriteConnection $connections
    if ($null -eq $connection) { throw 'No matching Focusrite Companion connection found.' }
    if ($connection.enabled -ne $true) { throw 'Focusrite Companion connection exists but is disabled.' }
    Write-Check 'PASS' 'Focusrite module connection found' ("moduleId={0}" -f [string]$connection.moduleId)
}
catch {
    Write-Check 'FAIL' 'Focusrite module connection found' $_.Exception.Message
    Write-Host ''
    Write-Host 'PREFLIGHT FAILED - no hardware write was attempted.'
    exit 2
}

$label = [string]$connection.label

try {
    $model = Read-ModuleVariable $label 'device_model'
    if ($model -ne $ExpectedModel) {
        throw "Expected '$ExpectedModel', got '$model'."
    }
    Write-Check 'PASS' 'Exact hardware model' $ExpectedModel
}
catch {
    $failures++
    Write-Check 'FAIL' 'Exact hardware model' $_.Exception.Message
}

try {
    $authorised = (Read-ModuleVariable $label 'client_authorised').ToLowerInvariant()
    if ($authorised -notin @('true', '1', 'on')) {
        throw "Focusrite Remote Devices approval is not confirmed (value='$authorised')."
    }
    Write-Check 'PASS' 'Focusrite client authorised' 'Remote Devices approval confirmed for this module client.'
}
catch {
    $failures++
    Write-Check 'FAIL' 'Focusrite client authorised' $_.Exception.Message
}

try {
    $status = Read-ModuleVariable $label 'connection_status'
    if ([string]::IsNullOrWhiteSpace($status)) { throw 'Connection status variable is blank.' }
    if ($status -notmatch '(?i)authorised') { throw "Module is not in an authorised state (value='$status')." }
    Write-Check 'PASS' 'Module connection status' $status
}
catch {
    $failures++
    Write-Check 'FAIL' 'Module connection status' $_.Exception.Message
}

Write-Host ''
Write-Host '=================================================================='
if ($failures -eq 0) {
    Write-Host 'PREFLIGHT PASS - ready for the SAFE automated hardware-test stage.' -ForegroundColor Green
    Write-Host 'No hardware setting was changed.'
    Write-Host '=================================================================='
    exit 0
}
else {
    Write-Host ("PREFLIGHT FAILED - {0} check(s) failed." -f $failures) -ForegroundColor Red
    Write-Host 'No hardware setting was changed.'
    Write-Host '=================================================================='
    exit 2
}

[CmdletBinding()]
param(
    [string]$CompanionBaseUrl = '',
    [string]$ConnectionLabel = ''
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'

$ExpectedModel = 'Scarlett 18i20 (3rd Gen)'
$ExpectedModuleId = 'focusrite-scarlett-18i20'
$ExpectedClientName = 'Companion Scarlett 18i20'

Add-Type -AssemblyName System.Net.Http

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

function Write-RemoteDevicesInstructions {
    Write-Host 'REMOTE DEVICES - OBLIGATOIRE AVANT TOUT TEST QUI ECRIT' -ForegroundColor Yellow
    Write-Host '  1. Garde et reutilise la connexion Focusrite Companion existante.'
    Write-Host '  2. Ouvre Focusrite Control > Device Settings > Remote Devices.'
    Write-Host ("  3. Verifie le client '{0}' et clique Approve si necessaire." -f $ExpectedClientName)
    Write-Host '  4. Ne supprime/recree pas la connexion Companion entre les builds/tests : une nouvelle identite client exige une nouvelle approbation.'
    Write-Host '  5. Un manque d approbation est un blocage de preflight, PAS un echec du controle materiel.'
    Write-Host ''
}

function Invoke-LocalHttp([string]$BaseUrl, [string]$Path, [string]$Method = 'GET', [int]$TimeoutMs = 2500) {
    $handler = New-Object System.Net.Http.HttpClientHandler
    $handler.UseProxy = $false
    $client = New-Object System.Net.Http.HttpClient($handler)
    $client.Timeout = [TimeSpan]::FromMilliseconds($TimeoutMs)
    $request = $null
    $response = $null

    try {
        $httpMethod = if ($Method -eq 'HEAD') { [System.Net.Http.HttpMethod]::Head } else { [System.Net.Http.HttpMethod]::Get }
        $request = New-Object System.Net.Http.HttpRequestMessage($httpMethod, "$(Normalize-BaseUrl $BaseUrl)$Path")
        $response = $client.SendAsync($request).GetAwaiter().GetResult()
        $text = ''
        if ($Method -ne 'HEAD') {
            $text = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
        }
        $xApp = ''
        try {
            $xApp = [string](($response.Headers.GetValues('X-App') | Select-Object -First 1))
        }
        catch {
            $xApp = ''
        }
        return [pscustomobject]@{
            StatusCode = [int]$response.StatusCode
            Text = $text
            XApp = $xApp
        }
    }
    finally {
        if ($response) { $response.Dispose() }
        if ($request) { $request.Dispose() }
        $client.Dispose()
        $handler.Dispose()
    }
}

function Test-CompanionEndpoint([string]$BaseUrl) {
    try {
        $probe = Invoke-LocalHttp -BaseUrl $BaseUrl -Path '/' -Method 'HEAD' -TimeoutMs 650
        return ($probe.XApp -eq 'Bitfocus Companion')
    }
    catch {
        return $false
    }
}

function Find-CompanionBaseUrl {
    if (-not [string]::IsNullOrWhiteSpace($CompanionBaseUrl)) {
        $explicit = Normalize-BaseUrl $CompanionBaseUrl
        if (-not (Test-CompanionEndpoint $explicit)) {
            throw 'The supplied Companion endpoint did not identify itself as Bitfocus Companion.'
        }
        return $explicit
    }

    $ports = @()
    try {
        $ports = @(
            [System.Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners() |
                ForEach-Object { $_.Port } |
                Where-Object { $_ -ge 1024 -and $_ -le 65535 } |
                Sort-Object -Unique
        )
    }
    catch {
        $ports = @()
    }

    $orderedPorts = @()
    if ($ports -contains 8000) { $orderedPorts += 8000 }
    $orderedPorts += @($ports | Where-Object { $_ -ne 8000 })

    foreach ($port in $orderedPorts) {
        $candidate = "http://127.0.0.1:$port"
        if (Test-CompanionEndpoint $candidate) {
            return $candidate
        }
    }

    throw 'No local Bitfocus Companion HTTP endpoint was detected. Keep Companion open and ensure its web interface is running.'
}

function Invoke-CompanionGet([string]$Path) {
    $response = Invoke-LocalHttp -BaseUrl $script:ResolvedCompanionBaseUrl -Path $Path -Method 'GET' -TimeoutMs 4000
    if ($response.StatusCode -eq 403) {
        throw 'Companion HTTP API returned 403. Enable the HTTP API in Companion Settings, then rerun.'
    }
    if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 300) {
        throw "Companion API returned HTTP $($response.StatusCode) for GET $Path"
    }
    return $response.Text
}

function Get-Connections {
    $text = Invoke-CompanionGet '/api/connections'
    if ([string]::IsNullOrWhiteSpace($text)) { return @() }
    $data = $text | ConvertFrom-Json
    if ($null -eq $data) { return @() }
    if ($data.PSObject.Properties.Name -contains 'connections') {
        return @($data.connections)
    }
    return @($data)
}

function Read-ModuleVariable([string]$Label, [string]$Name) {
    $labelPart = Escape-PathPart $Label
    $namePart = Escape-PathPart $Name
    return (Invoke-CompanionGet "/api/variable/$labelPart/$namePart/value").Trim()
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
Write-RemoteDevicesInstructions

try {
    $script:ResolvedCompanionBaseUrl = Find-CompanionBaseUrl
    Write-Check 'PASS' 'Companion local web service detected' 'Bitfocus Companion identified locally.'
}
catch {
    Write-Check 'FAIL' 'Companion local web service detected' $_.Exception.Message
    Write-Host ''
    Write-Host 'PREFLIGHT FAILED - no hardware write was attempted.'
    exit 2
}

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
    Write-Host 'Reuse the existing Focusrite Companion connection when possible; creating a fresh connection creates a fresh private client identity.' -ForegroundColor Yellow
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
    Write-Host ''
    Write-Host 'ACTION REQUIRED:' -ForegroundColor Yellow
    Write-Host '  Open Focusrite Control > Device Settings > Remote Devices.'
    Write-Host ("  Approve the existing client '{0}', then rerun this preflight." -f $ExpectedClientName)
    Write-Host '  Do not delete/recreate the Companion connection just to retry; that can create a new private client identity and require approval again.'
    Write-Host '  This authorization failure must not be counted as a hardware/control failure.'
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

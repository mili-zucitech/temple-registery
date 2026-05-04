$ErrorActionPreference = 'Stop'
Set-Location 'C:\Users\adityaranjan\zucitech\temple-registery'

function Api {
  param(
    [string]$Method,
    [string]$Uri,
    [Microsoft.PowerShell.Commands.WebRequestSession]$Session,
    [string]$Body = $null,
    [hashtable]$Headers = @{}
  )

  $params = @{
    Method = $Method
    Uri = $Uri
    WebSession = $Session
    ErrorAction = 'Stop'
    Headers = $Headers
    UseBasicParsing = $true
  }

  if (-not [string]::IsNullOrWhiteSpace($Body)) {
    $params.Body = $Body
    $params.ContentType = 'application/json'
  }

  Invoke-WebRequest @params
}

function Sql {
  param([string]$Query)

  $mysql = 'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe'
  if (-not (Test-Path $mysql)) { $mysql = 'mysql' }

  $env:MYSQL_PWD = '6sXYNlDhrX80xnDz'
  $dbHost = 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com'
  $dbPort = '4000'
  $dbUser = '3Nkwm2fKtuGqoiu.root'

  & $mysql --ssl-mode=REQUIRED --host=$dbHost --port=$dbPort --user=$dbUser --database=test -N -B -e $Query
}

$base = 'http://localhost:8080'
$health = Invoke-WebRequest -Uri "$base/actuator/health" -Method GET -ErrorAction Stop -UseBasicParsing
$healthJson = $health.Content | ConvertFrom-Json

$taSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$dcSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$taLoginBody = Get-Content 'backend/login_ta.json' -Raw
$dcLoginBody = Get-Content 'backend/login_dc.json' -Raw
$null = Api -Method POST -Uri "$base/api/v1/auth/login" -Session $taSession -Body $taLoginBody
$null = Api -Method POST -Uri "$base/api/v1/auth/login" -Session $dcSession -Body $dcLoginBody

$taTemple = Api -Method GET -Uri "$base/api/v1/ta/temple" -Session $taSession
$taTempleJson = $taTemple.Content | ConvertFrom-Json
$templeId = $taTempleJson.data.id
if (-not $templeId) { throw 'templeId missing' }

$declList = Api -Method GET -Uri "$base/api/v1/temples/$templeId/declarations?page=0&size=100" -Session $taSession
$declListJson = $declList.Content | ConvertFrom-Json
$existing = @()
if ($declListJson.data.content) {
  $existing = @($declListJson.data.content | ForEach-Object { $_.financialYear } | Where-Object { $_ })
}

$year = 2028
while ($true) {
  $fy = ('{0}-{1}' -f $year, (($year + 1) % 100).ToString('00'))
  if ($existing -notcontains $fy) { break }
  $year++
}

$dueDate = ('{0}-03-31' -f ($year + 1))
$createPayload = ([ordered]@{
  financialYear = $fy
  dueDate = $dueDate
  annualIncome = 0
  annualExpenditure = 0
  agriculturalLands = @()
  buildings = @()
  leasedProperties = @()
  otherLands = @()
  preciousMetals = @()
  artifacts = @()
  vehicles = @()
  equipment = @()
  financialAssets = @()
} | ConvertTo-Json -Depth 20)

$createDecl = Api -Method POST -Uri "$base/api/v1/temples/$templeId/declarations" -Session $taSession -Body $createPayload
$createDeclJson = $createDecl.Content | ConvertFrom-Json
$declarationId = $createDeclJson.data.id
if (-not $declarationId) { throw 'declarationId missing' }

$null = Api -Method POST -Uri "$base/api/v1/governance/declarations/$declarationId/submit" -Session $taSession -Body '{}'

$idempotencyKey = "p0-approve-$declarationId"
$requestId = "p0-rid-$declarationId"
$headers = @{
  'Idempotency-Key' = $idempotencyKey
  'X-Request-ID' = $requestId
}
$approve1 = Api -Method POST -Uri "$base/api/v1/governance/declarations/$declarationId/approve" -Session $dcSession -Body '{}' -Headers $headers
$approve2 = Api -Method POST -Uri "$base/api/v1/governance/declarations/$declarationId/approve" -Session $dcSession -Body '{}' -Headers $headers
$approve1Json = $approve1.Content | ConvertFrom-Json
$approve2Json = $approve2.Content | ConvertFrom-Json

$approve1DataJson = $approve1Json.data | ConvertTo-Json -Depth 20 -Compress
$approve2DataJson = $approve2Json.data | ConvertTo-Json -Depth 20 -Compress

$workflowInstanceQuery = "SELECT id FROM workflow_instances WHERE entity_type='DECLARATION' AND entity_id=$declarationId ORDER BY id DESC LIMIT 1;"
$workflowInstanceResult = Sql -Query $workflowInstanceQuery
$workflowInstanceId = if ($workflowInstanceResult) { ($workflowInstanceResult | Select-Object -First 1).ToString().Trim() } else { $null }

$idempotencyCountQuery = "SELECT COUNT(*) FROM workflow_idempotency_records WHERE idempotency_key='$idempotencyKey';"
$idempotencyCountResult = Sql -Query $idempotencyCountQuery

$approveCountQuery = "SELECT COUNT(*) FROM workflow_transitions WHERE workflow_instance_id=$workflowInstanceId AND action='APPROVE';"
$approveCountResult = Sql -Query $approveCountQuery

$result = [ordered]@{
  healthStatus = $(if ($healthJson.status) { $healthJson.status } elseif ($healthJson.data -and $healthJson.data.status) { $healthJson.data.status } else { $null })
  declarationId = $declarationId
  workflowInstanceId = $workflowInstanceId
  idempotencyKey = $idempotencyKey
  requestIdHeader = $requestId
  http = @{
    approve1Status = [int]$approve1.StatusCode
    approve2Status = [int]$approve2.StatusCode
    sameRawBody = ($approve1.Content -eq $approve2.Content)
    sameBusinessData = ($approve1DataJson -eq $approve2DataJson)
    sameAcknowledgementNumber = ($approve1Json.data.acknowledgementNumber -eq $approve2Json.data.acknowledgementNumber)
    acknowledgementNumber1 = $approve1Json.data.acknowledgementNumber
    acknowledgementNumber2 = $approve2Json.data.acknowledgementNumber
    sameRequestId = ($approve1Json.requestId -eq $approve2Json.requestId)
    requestId1 = $approve1Json.requestId
    requestId2 = $approve2Json.requestId
  }
  sql = @{
    idempotencyRowCount = [int]($idempotencyCountResult | Select-Object -First 1)
    approveTransitionCount = [int]($approveCountResult | Select-Object -First 1)
  }
}

$result | ConvertTo-Json -Depth 10 | Set-Content 'backend/p0_idempotency_proof.json' -Encoding UTF8
$result | ConvertTo-Json -Depth 10

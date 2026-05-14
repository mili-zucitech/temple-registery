$ErrorActionPreference = 'Stop'
$base = 'http://localhost:8080'

function Invoke-Api {
  param(
    [string]$Uri,
    [string]$Method,
    [Microsoft.PowerShell.Commands.WebRequestSession]$Session,
    [string]$Body,
    [hashtable]$Headers
  )

  $params = @{ Uri = $Uri; Method = $Method; WebSession = $Session; UseBasicParsing = $true; TimeoutSec = 30 }
  if ($Method -notin @('GET','HEAD') -and $Body -ne $null) { $params['ContentType'] = 'application/json'; $params['Body'] = $Body }
  if ($Headers) { $params['Headers'] = $Headers }

  try {
    $r = Invoke-WebRequest @params
    $content = $r.Content
    $json = $null
    if ($content) { try { $json = $content | ConvertFrom-Json } catch {} }
    [pscustomobject]@{ StatusCode = [int]$r.StatusCode; BodyRaw = $content; BodyJson = $json; Headers = $r.Headers }
  }
  catch {
    if ($_.Exception.Response) {
      $resp = $_.Exception.Response
      $sr = New-Object IO.StreamReader($resp.GetResponseStream())
      $content = $sr.ReadToEnd()
      $json = $null
      if ($content) { try { $json = $content | ConvertFrom-Json } catch {} }
      $headers = @{}
      try { foreach($k in $resp.Headers.AllKeys){ $headers[$k] = $resp.Headers[$k] } } catch {}
      [pscustomobject]@{ StatusCode = [int]$resp.StatusCode; BodyRaw = $content; BodyJson = $json; Headers = $headers }
    } else {
      throw
    }
  }
}

function Get-RequestId {
  param($resp)
  if ($resp.BodyJson -and $resp.BodyJson.requestId) { return [string]$resp.BodyJson.requestId }
  if ($resp.Headers) {
    foreach ($k in @('X-Request-Id','x-request-id','requestId')) {
      if ($resp.Headers[$k]) { return [string]$resp.Headers[$k] }
    }
  }
  return $null
}

function Get-Ack {
  param($resp)
  $b = $resp.BodyJson
  if (-not $b) { return $null }
  if ($b.acknowledgementNumber) { return [string]$b.acknowledgementNumber }
  if ($b.data -and $b.data.acknowledgementNumber) { return [string]$b.data.acknowledgementNumber }
  if ($b.content -and $b.content.acknowledgementNumber) { return [string]$b.content.acknowledgementNumber }
  return $null
}

$mysql = 'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe'
$dbHost = 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com'
$dbPort = '4000'
$dbUser = '3Nkwm2fKtuGqoiu.root'
$dbName = 'test'
$env:MYSQL_PWD = '6sXYNlDhrX80xnDz'

function Run-Sql {
  param([string]$Query)
  & $mysql --ssl-mode=REQUIRED --host=$dbHost --port=$dbPort --user=$dbUser --database=$dbName -B -e $Query
}

$taSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$dcSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession

$taLogin = Invoke-Api -Uri "$base/api/v1/auth/login" -Method 'POST' -Session $taSession -Body (Get-Content '.\backend\login_ta.json' -Raw)
$dcLogin = Invoke-Api -Uri "$base/api/v1/auth/login" -Method 'POST' -Session $dcSession -Body (Get-Content '.\backend\login_dc.json' -Raw)

$templeResp = Invoke-Api -Uri "$base/api/v1/ta/temple" -Method 'GET' -Session $taSession
$temple = $templeResp.BodyJson
$templeId = if ($temple.templeId) { $temple.templeId } elseif ($temple.id) { $temple.id } elseif ($temple.data -and $temple.data.templeId) { $temple.data.templeId } elseif ($temple.data -and $temple.data.id) { $temple.data.id } else { $null }
if (-not $templeId) { throw 'Unable to resolve TA temple id' }

$declarationId = $null
$financialYearUsed = $null
$createResp = $null
$year = (Get-Date).Year + 1
for ($i = 0; $i -lt 30 -and -not $declarationId; $i++) {
  $fyStart = $year + $i
  $fy = "$fyStart-$(([string]($fyStart + 1)).Substring(2,2))"
  $payload = @{ financialYear = $fy; dueDate = "$($fyStart+1)-03-31"; annualIncome = 1000; annualExpenditure = 900 } | ConvertTo-Json
  $candidate = Invoke-Api -Uri "$base/api/v1/temples/$templeId/declarations" -Method 'POST' -Session $taSession -Body $payload
  if ($candidate.StatusCode -ge 200 -and $candidate.StatusCode -lt 300) {
    $createResp = $candidate
    $financialYearUsed = $fy
    $j = $candidate.BodyJson
    $declarationId = if ($j.id) { $j.id } elseif ($j.declarationId) { $j.declarationId } elseif ($j.data -and $j.data.id) { $j.data.id } elseif ($j.data -and $j.data.declarationId) { $j.data.declarationId } else { $null }
  }
}
if (-not $declarationId) { throw 'Unable to create declaration for unique financial year' }

$submitResp = Invoke-Api -Uri "$base/api/v1/governance/declarations/$declarationId/submit" -Method 'POST' -Session $taSession -Body '{}'

$idemKey = [guid]::NewGuid().ToString()
$headers = @{ 'Idempotency-Key' = $idemKey }
$approve1 = Invoke-Api -Uri "$base/api/v1/governance/declarations/$declarationId/approve" -Method 'POST' -Session $dcSession -Body '{}' -Headers $headers
$approve2 = Invoke-Api -Uri "$base/api/v1/governance/declarations/$declarationId/approve" -Method 'POST' -Session $dcSession -Body '{}' -Headers $headers

$workflowId = ((Run-Sql "SELECT id FROM workflow_instances WHERE entity_type='DECLARATION' AND entity_id=$declarationId ORDER BY id DESC LIMIT 1;") | Select-Object -Last 1).ToString().Trim()
if (-not $workflowId) { throw 'workflow_instance_id not found' }

$qA = "SELECT COUNT(*) AS approve_count FROM workflow_transitions WHERE workflow_instance_id=$workflowId AND action='APPROVE';"
$qB = "SELECT id,action,idempotency_key,performed_at FROM workflow_transitions WHERE workflow_instance_id=$workflowId ORDER BY id;"
$qC = "SELECT id,idempotency_key,workflow_instance_id,action,result_status,created_at FROM workflow_idempotency_records WHERE workflow_instance_id=$workflowId ORDER BY id;"
$sqlA = Run-Sql $qA
$sqlB = Run-Sql $qB
$sqlC = Run-Sql $qC

$req1 = Get-RequestId $approve1
$req2 = Get-RequestId $approve2
$ack1 = Get-Ack $approve1
$ack2 = Get-Ack $approve2
$samePayload = ($approve1.BodyRaw -eq $approve2.BodyRaw)
$sameRequestId = ($req1 -and $req2 -and ($req1 -eq $req2))
$duplicateAssessment = if ($samePayload -and $sameRequestId) { 'duplicate returned cached result (same payload and same requestId)' } else { 'duplicate appears recomputed result (payload/requestId mismatch)' }

$result = [ordered]@{
  login = @{ taStatus = $taLogin.StatusCode; dcStatus = $dcLogin.StatusCode }
  templeId = $templeId
  declaration = @{ id = $declarationId; financialYear = $financialYearUsed; createStatus = $createResp.StatusCode; submitStatus = $submitResp.StatusCode }
  idempotencyKey = $idemKey
  approveCall1 = @{ statusCode = $approve1.StatusCode; body = $approve1.BodyRaw; requestId = $req1; acknowledgementNumber = $ack1 }
  approveCall2 = @{ statusCode = $approve2.StatusCode; body = $approve2.BodyRaw; requestId = $req2; acknowledgementNumber = $ack2 }
  workflowInstanceId = $workflowId
  sql = @{
    queryA = $qA
    resultA = $sqlA
    queryB = $qB
    resultB = $sqlB
    queryC = $qC
    resultC = $sqlC
  }
  duplicateAnalysis = @{ samePayload = $samePayload; sameRequestId = $sameRequestId; verdict = $duplicateAssessment }
}

$result | ConvertTo-Json -Depth 20 | Tee-Object -FilePath '.\idempotency_duplicate_check.json'


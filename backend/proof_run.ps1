Set-Location 'C:\Users\adityaranjan\zucitech\temple-registery'
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Invoke-Api {
    param(
        [Parameter(Mandatory=$true)][string]$Name,
        [Parameter(Mandatory=$true)][ValidateSet('Get','Post')][string]$Method,
        [Parameter(Mandatory=$true)][string]$Uri,
        [string]$Body,
        [string]$ContentType = 'application/json',
        [Microsoft.PowerShell.Commands.WebRequestSession]$WebSession
    )

    $result = [ordered]@{ name=$Name; method=$Method; uri=$Uri; ok=$false; statusCode=$null; requestId=$null; json=$null; raw=$null; error=$null }
    try {
        $params = @{ Method=$Method; Uri=$Uri; ContentType=$ContentType; ErrorAction='Stop'; WebSession=$WebSession }
        if ($Body) { $params.Body = $Body }
        $obj = Invoke-RestMethod @params
        $result.ok = $true
        $result.statusCode = 200
        $result.json = $obj
        $result.raw = ($obj | ConvertTo-Json -Depth 30)
        if ($obj.requestId) { $result.requestId = $obj.requestId }
    } catch {
        $result.error = $_.Exception.Message
        $resp = $_.Exception.Response
        if ($resp) {
            try { $result.statusCode = [int]$resp.StatusCode } catch {}
            try {
                $sr = New-Object System.IO.StreamReader($resp.GetResponseStream())
                $bodyText = $sr.ReadToEnd(); $sr.Close()
                $result.raw = $bodyText
                try { $obj = $bodyText | ConvertFrom-Json; $result.json = $obj; if ($obj.requestId) { $result.requestId = $obj.requestId } } catch {}
            } catch {}
        }
    }
    [pscustomobject]$result
}

$allResponses = [ordered]@{}
$portCheck = Test-NetConnection -ComputerName 'localhost' -Port 8080
if (-not $portCheck.TcpTestSucceeded) { throw 'Backend is not reachable at http://localhost:8080.' }

$taLoginBody = Get-Content 'backend/login_ta.json' -Raw
$dcLoginBody = Get-Content 'backend/login_dc.json' -Raw

try {
    $taLoginObj = Invoke-RestMethod -Method Post -Uri 'http://localhost:8080/api/v1/auth/login' -Body $taLoginBody -ContentType 'application/json' -SessionVariable taSession -ErrorAction Stop
    $taLogin = [pscustomobject]@{ name='TA login'; method='Post'; uri='http://localhost:8080/api/v1/auth/login'; ok=$true; statusCode=200; requestId=$taLoginObj.requestId; json=$taLoginObj; raw=($taLoginObj|ConvertTo-Json -Depth 20); error=$null }
} catch {
    $taLogin = [pscustomobject]@{ name='TA login'; method='Post'; uri='http://localhost:8080/api/v1/auth/login'; ok=$false; statusCode=$null; requestId=$null; json=$null; raw=$null; error=$_.Exception.Message }
    throw 'TA login failed'
}
$allResponses.taLogin = $taLogin

try {
    $dcLoginObj = Invoke-RestMethod -Method Post -Uri 'http://localhost:8080/api/v1/auth/login' -Body $dcLoginBody -ContentType 'application/json' -SessionVariable dcSession -ErrorAction Stop
    $dcLogin = [pscustomobject]@{ name='DC login'; method='Post'; uri='http://localhost:8080/api/v1/auth/login'; ok=$true; statusCode=200; requestId=$dcLoginObj.requestId; json=$dcLoginObj; raw=($dcLoginObj|ConvertTo-Json -Depth 20); error=$null }
} catch {
    $dcLogin = [pscustomobject]@{ name='DC login'; method='Post'; uri='http://localhost:8080/api/v1/auth/login'; ok=$false; statusCode=$null; requestId=$null; json=$null; raw=$null; error=$_.Exception.Message }
    throw 'DC login failed'
}
$allResponses.dcLogin = $dcLogin

$taTemple = Invoke-Api -Name 'TA temple' -Method Get -Uri 'http://localhost:8080/api/v1/ta/temple' -WebSession $taSession
$allResponses.taTemple = $taTemple
if (-not $taTemple.ok) { throw 'TA temple fetch failed' }
Write-Output 'TA temple full JSON:'
$taTemple.json | ConvertTo-Json -Depth 30
$templeId = $taTemple.json.data.id

$declList = Invoke-Api -Name 'List declarations' -Method Get -Uri ("http://localhost:8080/api/v1/temples/$templeId/declarations?page=0&size=50") -WebSession $taSession
$allResponses.declarationList = $declList
if (-not $declList.ok) { throw 'Declaration listing failed' }
$existingFy = @(); if ($declList.json.data.content) { $existingFy = @($declList.json.data.content | ForEach-Object { $_.financialYear } | Where-Object { $_ }) }
$startYear = 2027; while ($true) { $fy = ('{0}-{1}' -f $startYear,(($startYear+1)%100).ToString('00')); if ($existingFy -notcontains $fy) { break }; $startYear++ }
$dueDate = ('{0}-03-31' -f ($startYear+1))

$createPayload = ([ordered]@{ financialYear=$fy; dueDate=$dueDate; annualIncome=0; annualExpenditure=0; agriculturalLands=@(); buildings=@(); leasedProperties=@(); otherLands=@(); preciousMetals=@(); artifacts=@(); vehicles=@(); equipment=@(); financialAssets=@() } | ConvertTo-Json -Depth 20)
$createDecl = Invoke-Api -Name 'TA create declaration' -Method Post -Uri ("http://localhost:8080/api/v1/temples/$templeId/declarations") -Body $createPayload -WebSession $taSession
if ($createDecl.ok) { $createDecl.statusCode = 201 }
$allResponses.createDeclaration = $createDecl
if (-not $createDecl.ok) { throw 'Create declaration failed' }
Write-Output 'Create declaration full JSON:'
$createDecl.json | ConvertTo-Json -Depth 30
$declarationId = $createDecl.json.data.id

$submitDecl = Invoke-Api -Name 'TA submit declaration' -Method Post -Uri ("http://localhost:8080/api/v1/governance/declarations/$declarationId/submit") -WebSession $taSession
$allResponses.submitDeclaration = $submitDecl
if (-not $submitDecl.ok) { throw 'Submit declaration failed' }

$dcUnreadBefore = Invoke-Api -Name 'DC unread before' -Method Get -Uri 'http://localhost:8080/api/v1/notifications/unread-count' -WebSession $dcSession
$allResponses.dcUnreadBefore = $dcUnreadBefore
$unreadBefore = $dcUnreadBefore.json.data

$approveDecl = Invoke-Api -Name 'DC approve declaration' -Method Post -Uri ("http://localhost:8080/api/v1/governance/declarations/$declarationId/approve") -Body '{}' -WebSession $dcSession
$allResponses.approveDeclaration = $approveDecl
if (-not $approveDecl.ok) { throw 'Approve declaration failed' }

$mysql = 'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe'
$env:MYSQL_PWD = '6sXYNlDhrX80xnDz'
$dbHost = 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com'
$dbPort = '4000'
$dbUser = '3Nkwm2fKtuGqoiu.root'
$q1 = "SELECT id, entity_type, entity_id, status, temple_id, district_id, created_by_user_id, created_at FROM workflow_instances WHERE entity_type='DECLARATION' AND entity_id=$declarationId ORDER BY id DESC LIMIT 1;"
$wiRow = & $mysql --ssl-mode=REQUIRED --host=$dbHost --port=$dbPort --user=$dbUser --database=test -N -B -e $q1
$wiId = $null; if ($wiRow) { $wiId = ($wiRow -split "`t")[0] }
$q2 = "SELECT id, from_status, to_status, action, performed_at FROM workflow_transitions WHERE workflow_instance_id=$wiId ORDER BY id DESC LIMIT 10;"
$wtRows = & $mysql --ssl-mode=REQUIRED --host=$dbHost --port=$dbPort --user=$dbUser --database=test -N -B -e $q2
$q3 = "SELECT id, dispatch_status, event_type, created_at FROM notification_outbox WHERE workflow_instance_id=$wiId ORDER BY id DESC LIMIT 10;"
$noRows = & $mysql --ssl-mode=REQUIRED --host=$dbHost --port=$dbPort --user=$dbUser --database=test -N -B -e $q3
$q4 = "SELECT id, user_id, title, is_read, created_at, read_at FROM in_app_notifications WHERE workflow_instance_id=$wiId ORDER BY id DESC LIMIT 10;"
$ianRows = & $mysql --ssl-mode=REQUIRED --host=$dbHost --port=$dbPort --user=$dbUser --database=test -N -B -e $q4

$dcUnreadAfter = Invoke-Api -Name 'DC unread after approve' -Method Get -Uri 'http://localhost:8080/api/v1/notifications/unread-count' -WebSession $dcSession
$allResponses.dcUnreadAfter = $dcUnreadAfter
$dcNotifList = Invoke-Api -Name 'DC notifications list' -Method Get -Uri 'http://localhost:8080/api/v1/notifications?page=0&size=10' -WebSession $dcSession
$allResponses.dcNotifications = $dcNotifList
$notifContent = @(); if ($dcNotifList.json.data.content) { $notifContent = @($dcNotifList.json.data.content) }
$unreadCandidates = @($notifContent | Where-Object { $_.read -eq $false })
$pickedNotificationId = $null; if ($unreadCandidates.Count -gt 0) { $pickedNotificationId = ($unreadCandidates | Sort-Object createdAt -Descending | Select-Object -First 1).id }
if ($pickedNotificationId) { $markRead = Invoke-Api -Name 'DC mark read' -Method Post -Uri ("http://localhost:8080/api/v1/notifications/$pickedNotificationId/read") -Body '{}' -WebSession $dcSession; $allResponses.dcMarkRead = $markRead }
$dcUnreadAfterMark = Invoke-Api -Name 'DC unread after mark' -Method Get -Uri 'http://localhost:8080/api/v1/notifications/unread-count' -WebSession $dcSession
$allResponses.dcUnreadAfterMark = $dcUnreadAfterMark

$failedApiCalls = @($allResponses.GetEnumerator() | ForEach-Object { $_.Value } | Where-Object { $_.ok -eq $false })
$logSnippets = @()
if ($failedApiCalls.Count -gt 0 -and (Test-Path 'backend/runtime_live.log')) {
    $ids = @($declarationId) + @($failedApiCalls | ForEach-Object { $_.requestId })
    $ids = @($ids | Where-Object { $_ } | Select-Object -Unique)
    if ($ids.Count -gt 0) {
        $pattern = ($ids -join '|')
        $logSnippets = @(Get-Content 'backend/runtime_live.log' | Select-String -Pattern $pattern -Context 3,6 | Select-Object -Last 40 | ForEach-Object { $_.ToString() })
    }
}

$proofResult = [ordered]@{
  runAt=(Get-Date).ToString('o'); backendReachable=$portCheck.TcpTestSucceeded; templeId=$templeId; declarationId=$declarationId; financialYear=$fy; dueDate=$dueDate;
  unread=@{ before=$dcUnreadBefore.json.data; afterApprove=$dcUnreadAfter.json.data; afterMarkRead=$dcUnreadAfterMark.json.data };
  workflow=@{ workflowInstanceRow=$wiRow; workflowInstanceId=$wiId; workflowTransitions=$wtRows; notificationOutbox=$noRows; inAppNotifications=$ianRows };
  ids=@{ taUserId=$taLogin.json.data.userId; dcUserId=$dcLogin.json.data.userId; markedReadNotificationId=$pickedNotificationId };
  api=@{ taLogin=$taLogin; dcLogin=$dcLogin; taTemple=$taTemple; listDeclarations=$declList; createDeclaration=$createDecl; submitDeclaration=$submitDecl; approveDeclaration=$approveDecl; dcUnreadBefore=$dcUnreadBefore; dcUnreadAfter=$dcUnreadAfter; dcUnreadAfterMark=$dcUnreadAfterMark };
  failures=@{ count=$failedApiCalls.Count; calls=$failedApiCalls; runtimeLogSnippets=$logSnippets }
}
$artifactPath = 'backend/proof_result.json'
$proofResult | ConvertTo-Json -Depth 40 | Set-Content -Path $artifactPath -Encoding UTF8

$summary = [ordered]@{ artifactPath=$artifactPath; backendReachable=$portCheck.TcpTestSucceeded; templeId=$templeId; declarationId=$declarationId; workflowInstanceId=$wiId; unreadBefore=$dcUnreadBefore.json.data; unreadAfterApprove=$dcUnreadAfter.json.data; unreadAfterMarkRead=$dcUnreadAfterMark.json.data; failureCount=$failedApiCalls.Count }
$summary | ConvertTo-Json -Depth 10

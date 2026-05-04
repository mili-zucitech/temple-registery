$ErrorActionPreference='Stop'
$base='http://localhost:8080'
$backendDir=Join-Path (Get-Location) 'backend'
$jar=Join-Path $backendDir 'target/temple-registry-backend-0.0.1-SNAPSHOT.jar'
$logFile=Join-Path $backendDir 'runtime_live.log'
function Req($u,$m,$s,$b){ if($null -ne $b){Invoke-WebRequest -UseBasicParsing -Uri $u -Method $m -WebSession $s -ContentType 'application/json' -Body $b}else{Invoke-WebRequest -UseBasicParsing -Uri $u -Method $m -WebSession $s} }
function Ready(){ try{ Invoke-WebRequest -UseBasicParsing -Uri "$base/actuator/health" -Method GET -TimeoutSec 5 | Out-Null; $true }catch{ if($_.Exception.Response){$true}else{$false} } }
function Sql($q){ & mysql '--ssl-mode=REQUIRED' '-h' 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com' '-P' '4000' '-u' '3Nkwm2fKtuGqoiu.root' '-p6sXYNlDhrX80xnDz' 'test' '-N' '-e' $q }
$res=[ordered]@{}
try {
  $started=$false
  if(-not (Ready)){
    if(-not (Test-Path $jar)){ throw "Jar missing: $jar" }
    $cmd="Set-Location -Path '$backendDir'; java -jar '$jar' --spring.profiles.active=dev *>> '$logFile'"
    Start-Process -FilePath 'powershell' -ArgumentList @('-NoProfile','-Command',$cmd) -WindowStyle Hidden
    $started=$true
  }
  $ok=$false;1..60|ForEach-Object{ if(-not $ok){ if(Ready){$ok=$true} } }
  if(-not $ok){ throw 'Backend not reachable on 8080' }
  $ta=New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $dc=New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $taLogin=Req "$base/api/v1/auth/login" 'POST' $ta (Get-Content 'backend/login_ta.json' -Raw)
  $dcLogin=Req "$base/api/v1/auth/login" 'POST' $dc (Get-Content 'backend/login_dc.json' -Raw)
  $t=((Req "$base/api/v1/ta/temple" 'GET' $ta $null).Content|ConvertFrom-Json)
  $templeId=if($t.templeId){$t.templeId}elseif($t.id){$t.id}elseif($t.content){$t.content[0].id}else{$null}
  if(-not $templeId){ throw 'templeId not found' }
  $declId=$null;$createCode=$null;$fyUsed=$null;$y=(Get-Date).Year+1
  1..20|ForEach-Object{ if(-not $declId){ $fy="$y-$((($y+1).ToString()).Substring(2,2))"; $body=@{financialYear=$fy;dueDate='2026-03-31';annualIncome=0;annualExpenditure=0}|ConvertTo-Json; try{$cr=Req "$base/api/v1/temples/$templeId/declarations" 'POST' $ta $body; $createCode=[int]$cr.StatusCode; $j=$cr.Content|ConvertFrom-Json; $declId=if($j.id){$j.id}else{$j.declarationId}; $fyUsed=$fy}catch{ if($_.Exception.Response){$c=[int]$_.Exception.Response.StatusCode; if($c -in 400,409,422){$y++}else{throw}}else{throw}} } }
  if(-not $declId){ throw 'failed to create declaration' }
  $submit=Req "$base/api/v1/governance/declarations/$declId/submit" 'POST' $ta '{}'
  $ub=((Req "$base/api/v1/notifications/unread-count" 'GET' $dc $null).Content|ConvertFrom-Json)
  $approveCode=$null;$approveBody=$null
  try{$ap=Req "$base/api/v1/governance/declarations/$declId/approve" 'POST' $dc '{}';$approveCode=[int]$ap.StatusCode;$approveBody=$ap.Content}catch{ if($_.Exception.Response){$approveCode=[int]$_.Exception.Response.StatusCode;$r=New-Object IO.StreamReader($_.Exception.Response.GetResponseStream());$approveBody=$r.ReadToEnd()}else{throw} }
  $wf=((Sql "SELECT id FROM workflow_instance WHERE entity_type='DECLARATION' AND entity_id=$declId ORDER BY id DESC LIMIT 1;")|Select-Object -First 1).ToString().Trim()
  $trans=Sql "SELECT id,from_status,to_status,action FROM workflow_transitions WHERE workflow_instance_id=$wf ORDER BY id DESC LIMIT 10;"
  $outbox=Sql "SELECT id,status,event_type FROM notification_outbox WHERE workflow_instance_id=$wf OR (entity_type='DECLARATION' AND entity_id=$declId) ORDER BY id DESC LIMIT 10;"
  $inapp=Sql "SELECT id,is_read,read_at FROM in_app_notifications WHERE workflow_instance_id=$wf OR payload LIKE '%$declId%' ORDER BY id DESC LIMIT 10;"
  $ua=((Req "$base/api/v1/notifications/unread-count" 'GET' $dc $null).Content|ConvertFrom-Json)
  $list=((Req "$base/api/v1/notifications?page=0&size=10" 'GET' $dc $null).Content|ConvertFrom-Json)
  $arr=if($list.content){@($list.content)}elseif($list.items){@($list.items)}else{@()}
  $u=$arr|Where-Object{($_.isRead -eq $false)-or($_.read -eq $false)}|Select-Object -First 1
  $markId=$null;$markCode=$null
  if($u){$markId=if($u.id){$u.id}else{$u.notificationId};if($markId){$mk=Req "$base/api/v1/notifications/$markId/read" 'POST' $dc '{}';$markCode=[int]$mk.StatusCode}}
  $um=((Req "$base/api/v1/notifications/unread-count" 'GET' $dc $null).Content|ConvertFrom-Json)
  $res=[ordered]@{declarationId=$declId;workflowInstanceId=$wf;financialYear=$fyUsed;statusCodes=@{taLogin=[int]$taLogin.StatusCode;dcLogin=[int]$dcLogin.StatusCode;create=$createCode;submit=[int]$submit.StatusCode;approve=$approveCode;markRead=$markCode};approveBody=$approveBody;transitionRows=$trans;outboxRows=$outbox;inAppRows=$inapp;unread=@{before=$ub.unreadCount;afterApprove=$ua.unreadCount;afterMark=$um.unreadCount};inAppNotificationMarked=@{id=$markId};backendStartedByScript=$started}
}
catch {
  $tail='';if(Test-Path $logFile){$tail=(Get-Content $logFile -Tail 120)-join "`n"}
  $res=[ordered]@{errorClass=$_.Exception.GetType().FullName;errorMessage=$_.Exception.Message;stack=$_.ScriptStackTrace;logTail=$tail}
}
$res|ConvertTo-Json|Set-Content 'workflow_proof_result.json'
$res|ConvertTo-Json

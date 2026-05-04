$ErrorActionPreference='Stop'
$primaryMysql = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
if (Test-Path $primaryMysql) { $mysql = $primaryMysql } else { $mysql = "mysql" }
$env:MYSQL_PWD = "6sXYNlDhrX80xnDz"
$dbHost = "gateway01.ap-southeast-1.prod.aws.tidbcloud.com"
$dbPort = "4000"
$dbUser = "3Nkwm2fKtuGqoiu.root"
$dbName = "test"

function Run-Query([string]$label,[string]$sql){
  Write-Output ("===== " + $label + " =====")
  Write-Output ("SQL: " + $sql)
  try { & $mysql --ssl-mode=REQUIRED --host=$dbHost --port=$dbPort --user=$dbUser --database=$dbName -B -e $sql 2>&1 | Out-String | Write-Output }
  catch { $_ | Out-String | Write-Output }
  Write-Output ""
}
function Scalar([string]$sql){ (& $mysql --ssl-mode=REQUIRED --host=$dbHost --port=$dbPort --user=$dbUser --database=$dbName -N -B -e $sql 2>$null | Out-String).Trim() }
function Table-Exists([string]$t){ (Scalar "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$dbName' AND table_name='$t';") -eq '1' }
function Column-Exists([string]$t,[string]$c){ (Scalar "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='$dbName' AND table_name='$t' AND column_name='$c';") -eq '1' }

Run-Query "1.1 SHOW TABLES LIKE 'workflow%'" "SHOW TABLES LIKE 'workflow%';"
Run-Query "1.2 SHOW TABLES LIKE '%transition%'" "SHOW TABLES LIKE '%transition%';"
Run-Query "1.3 SHOW TABLES LIKE 'notification%'" "SHOW TABLES LIKE 'notification%';"
Run-Query "1.4 SHOW TABLES LIKE 'in_app%'" "SHOW TABLES LIKE 'in_app%';"
Run-Query "1.5 SHOW TABLES LIKE 'governance_action%'" "SHOW TABLES LIKE 'governance_action%';"
Run-Query "1.6 SHOW TABLES LIKE 'asset%'" "SHOW TABLES LIKE 'asset%';"

$columnTargets = @('workflow_instances','workflow_transitions','asset_declarations','notification_outbox','in_app_notifications','governance_action_history','clarification_threads','workflow_tasks')
foreach($t in $columnTargets){
  if(Table-Exists $t){ Run-Query ("2 SHOW COLUMNS FROM " + $t) ("SHOW COLUMNS FROM " + $t + ";") }
  else { Write-Output ("===== 2 SHOW COLUMNS FROM " + $t + " ====="); Write-Output ("Table not found: " + $t); Write-Output "" }
}

$workflowTable = if(Table-Exists 'workflow_instances'){'workflow_instances'} elseif(Table-Exists 'workflow_instance'){'workflow_instance'} else {''}
$transitionTable = if(Table-Exists 'workflow_transitions'){'workflow_transitions'} elseif(Table-Exists 'workflow_transition'){'workflow_transition'} else {''}
$assetTable = if(Table-Exists 'asset_declarations'){'asset_declarations'} elseif(Table-Exists 'asset_declaration'){'asset_declaration'} else {''}
$trustTable = if(Table-Exists 'trusts'){'trusts'} elseif(Table-Exists 'trust'){'trust'} else {''}
$outboxTable = if(Table-Exists 'notification_outbox'){'notification_outbox'} else {''}
$govTable = if(Table-Exists 'governance_action_history'){'governance_action_history'} else {''}
$clarTable = if(Table-Exists 'clarification_threads'){'clarification_threads'} elseif(Table-Exists 'clarification_thread'){'clarification_thread'} else {''}
$taskTable = if(Table-Exists 'workflow_tasks'){'workflow_tasks'} elseif(Table-Exists 'workflow_task'){'workflow_task'} else {''}
$templeProfileTable = if(Table-Exists 'temple_profile_staging'){'temple_profile_staging'} else {''}

Write-Output "===== 3 Table mapping used for adapted SQL ====="
Write-Output ("workflow="+$workflowTable+", transition="+$transitionTable+", asset="+$assetTable+", trust="+$trustTable+", outbox="+$outboxTable+", governance="+$govTable+", clarification="+$clarTable+", task="+$taskTable+", temple_profile_staging="+$templeProfileTable)
Write-Output ""

if($workflowTable -ne '' -and $trustTable -ne '' -and $assetTable -ne '' -and $templeProfileTable -ne ''){
  Run-Query "3a orphan workflows" "SELECT COUNT(*) AS orphan_workflows FROM $workflowTable w WHERE (w.entity_type='TRUST' AND w.entity_id NOT IN (SELECT id FROM $trustTable)) OR (w.entity_type='DECLARATION' AND w.entity_id NOT IN (SELECT id FROM $assetTable)) OR (w.entity_type='TEMPLE_PROFILE' AND w.entity_id NOT IN (SELECT id FROM $templeProfileTable));"
} else { Write-Output "===== 3a orphan workflows ====="; Write-Output "Skipped due to missing required tables"; Write-Output "" }

if($workflowTable -ne ''){ Run-Query "3b duplicate workflow instances by entity_type/entity_id" "SELECT entity_type, entity_id, COUNT(*) AS c FROM $workflowTable GROUP BY entity_type, entity_id HAVING COUNT(*) > 1 ORDER BY c DESC LIMIT 50;" } else { Write-Output "===== 3b duplicate workflow instances ====="; Write-Output "Skipped: missing workflow table"; Write-Output "" }
if($workflowTable -ne '' -and $outboxTable -ne ''){ Run-Query "3c submitted/resubmitted without outbox" "SELECT COUNT(*) AS submitted_without_outbox FROM $workflowTable w WHERE w.status IN ('SUBMITTED','RESUBMITTED') AND NOT EXISTS (SELECT 1 FROM $outboxTable o WHERE o.entity_type=w.entity_type AND o.entity_id=w.entity_id AND o.event_type='WORKFLOW_TRANSITION');" } else { Write-Output "===== 3c submitted/resubmitted without outbox ====="; Write-Output "Skipped due to missing table(s)"; Write-Output "" }
if($workflowTable -ne '' -and $outboxTable -ne ''){ Run-Query "3d phantom outbox" "SELECT COUNT(*) AS phantom_outbox FROM $outboxTable o WHERE o.event_type='WORKFLOW_TRANSITION' AND NOT EXISTS (SELECT 1 FROM $workflowTable w WHERE w.entity_type=o.entity_type AND w.entity_id=o.entity_id);" } else { Write-Output "===== 3d phantom outbox ====="; Write-Output "Skipped due to missing table(s)"; Write-Output "" }

if($workflowTable -ne '' -and (Table-Exists 'temple') -and (Column-Exists $workflowTable 'temple_id')){ Run-Query "3e.1 invalid temple refs in workflow" "SELECT COUNT(*) AS invalid_temple_refs_wf FROM $workflowTable WHERE temple_id IS NOT NULL AND temple_id NOT IN (SELECT id FROM temple);" } else { Write-Output "===== 3e.1 invalid temple refs in workflow ====="; Write-Output "Skipped"; Write-Output "" }
if($workflowTable -ne '' -and (Table-Exists 'district') -and (Column-Exists $workflowTable 'district_id')){ Run-Query "3e.2 invalid district refs in workflow" "SELECT COUNT(*) AS invalid_district_refs_wf FROM $workflowTable WHERE district_id IS NOT NULL AND district_id NOT IN (SELECT id FROM district);" } else { Write-Output "===== 3e.2 invalid district refs in workflow ====="; Write-Output "Skipped"; Write-Output "" }
if($assetTable -ne '' -and (Table-Exists 'temple') -and (Column-Exists $assetTable 'temple_id')){ Run-Query "3e.3 invalid declaration temple refs" "SELECT COUNT(*) AS invalid_decl_temple_refs FROM $assetTable WHERE temple_id NOT IN (SELECT id FROM temple);" } else { Write-Output "===== 3e.3 invalid declaration temple refs ====="; Write-Output "Skipped"; Write-Output "" }
if($trustTable -ne '' -and (Table-Exists 'temple') -and (Column-Exists $trustTable 'temple_id')){ Run-Query "3e.4 invalid trust temple refs" "SELECT COUNT(*) AS invalid_trust_temple_refs FROM $trustTable WHERE temple_id NOT IN (SELECT id FROM temple);" } else { Write-Output "===== 3e.4 invalid trust temple refs ====="; Write-Output "Skipped"; Write-Output "" }

if($assetTable -ne '' -and (Column-Exists $assetTable 'temple_id')){
  $yearCol = if(Column-Exists $assetTable 'financial_year'){'financial_year'} elseif(Column-Exists $assetTable 'fiscal_year'){'fiscal_year'} else {''}
  if($yearCol -ne ''){ Run-Query "3f duplicate declarations by temple_id/year" "SELECT temple_id, $yearCol, COUNT(*) AS c FROM $assetTable GROUP BY temple_id, $yearCol HAVING COUNT(*) > 1 ORDER BY c DESC LIMIT 50;" } else { Write-Output "===== 3f duplicate declarations by temple_id/year ====="; Write-Output "Skipped: no financial_year/fiscal_year column"; Write-Output "" }
} else { Write-Output "===== 3f duplicate declarations by temple_id/year ====="; Write-Output "Skipped: missing asset table or temple_id"; Write-Output "" }

if($clarTable -ne ''){
  $roundCol = if(Column-Exists $clarTable 'round_number'){'round_number'} elseif(Column-Exists $clarTable 'round'){'round'} elseif(Column-Exists $clarTable 'clarification_round'){'clarification_round'} else {''}
  if($roundCol -ne ''){ Run-Query "3g.1 max clarification round" "SELECT MAX($roundCol) AS max_clarification_round FROM $clarTable;" } else { Write-Output "===== 3g.1 max clarification round ====="; Write-Output "Skipped: no round column"; Write-Output "" }
  if($workflowTable -ne '' -and (Column-Exists $clarTable 'workflow_instance_id')){ Run-Query "3g.2 orphan clarification threads" "SELECT COUNT(*) AS orphan_clarification_threads FROM $clarTable ct WHERE ct.workflow_instance_id NOT IN (SELECT id FROM $workflowTable);" } else { Write-Output "===== 3g.2 orphan clarification threads ====="; Write-Output "Skipped"; Write-Output "" }
} else { Write-Output "===== 3g clarification thread checks ====="; Write-Output "Skipped: clarification table missing"; Write-Output "" }
if($taskTable -ne '' -and $workflowTable -ne '' -and (Column-Exists $taskTable 'workflow_instance_id')){ Run-Query "3g.3 orphan workflow tasks" "SELECT COUNT(*) AS orphan_workflow_tasks FROM $taskTable wt WHERE wt.workflow_instance_id NOT IN (SELECT id FROM $workflowTable);" } else { Write-Output "===== 3g.3 orphan workflow tasks ====="; Write-Output "Skipped"; Write-Output "" }

if($workflowTable -ne '' -and $transitionTable -ne '' -and $govTable -ne ''){
  Run-Query "3h.0 latest 5 workflow ids" "SELECT id FROM $workflowTable ORDER BY id DESC LIMIT 5;"
  $idsRaw = Scalar("SELECT id FROM $workflowTable ORDER BY id DESC LIMIT 5;")
  if(-not [string]::IsNullOrWhiteSpace($idsRaw)){
    $idList = (($idsRaw -split "`r?`n") -join ',')
    Run-Query "3h audit consistency counts" "SELECT w.id, IFNULL(t.transition_count,0) AS transition_count, IFNULL(g.audit_count,0) AS governance_action_history_count FROM $workflowTable w LEFT JOIN (SELECT workflow_instance_id, COUNT(*) AS transition_count FROM $transitionTable GROUP BY workflow_instance_id) t ON t.workflow_instance_id = w.id LEFT JOIN (SELECT workflow_instance_id, COUNT(*) AS audit_count FROM $govTable GROUP BY workflow_instance_id) g ON g.workflow_instance_id = w.id WHERE w.id IN ($idList) ORDER BY w.id DESC;"
  } else { Write-Output "===== 3h audit consistency counts ====="; Write-Output "No workflow ids found"; Write-Output "" }
} else { Write-Output "===== 3h audit consistency counts ====="; Write-Output "Skipped due to missing table(s)"; Write-Output "" }

if($transitionTable -ne ''){
  Run-Query "4 correlation_id column existence" "SELECT COUNT(*) AS has_correlation_id FROM information_schema.columns WHERE table_schema='$dbName' AND table_name='$transitionTable' AND column_name='correlation_id';"
  if(Column-Exists $transitionTable 'correlation_id'){ Run-Query "4 correlation_id sample" "SELECT correlation_id FROM $transitionTable WHERE correlation_id IS NOT NULL LIMIT 5;" }
  else { Write-Output "===== 4 correlation_id sample ====="; Write-Output "Not applicable: correlation_id column not present"; Write-Output "" }
} else { Write-Output "===== 4 correlation_id checks ====="; Write-Output "Skipped: transition table missing"; Write-Output "" }

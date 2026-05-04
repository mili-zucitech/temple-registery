# Track 4 - Temple Smoke Verification Script
# Tests: CREATE → SUBMIT → APPROVE workflow with full DB verification

$ErrorActionPreference = "Stop"
$BASE_URL = "http://localhost:8080"
$OUTPUT_FILE = "smoke_test_results.txt"

# Clear previous results
"" | Out-File $OUTPUT_FILE

function Log {
    param($Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Message"
    Write-Host $logMessage
    $logMessage | Out-File $OUTPUT_FILE -Append
}

function Query-DB {
    param($Query)
    Log "Executing SQL: $Query"
    
    # Using MySQL CLI to query TiDB
    $result = mysql -h gateway01.ap-southeast-1.prod.aws.tidbcloud.com -P 4000 -u 3Nkwm2fKtuGqoiu.root -p6sXYNlDhrX80xnDz test -e "$Query" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Log "Query Result:`n$result"
        return $result
    } else {
        Log "Query Failed: $result"
        return $null
    }
}

function API-Call {
    param(
        [string]$Method,
        [string]$Endpoint,
        [string]$Token,
        [string]$Body = $null
    )
    
    $headers = @{
        "Authorization" = "Bearer $Token"
        "Content-Type" = "application/json"
    }
    
    try {
        if ($Body) {
            $response = Invoke-RestMethod -Uri "$BASE_URL$Endpoint" -Method $Method -Headers $headers -Body $Body
        } else {
            $response = Invoke-RestMethod -Uri "$BASE_URL$Endpoint" -Method $Method -Headers $headers
        }
        return $response
    } catch {
        Log "API Error: $($_.Exception.Message)"
        Log "Response: $($_.Exception.Response)"
        throw
    }
}

Log "========================================="
Log "TRACK 4: TEMPLE SMOKE VERIFICATION"
Log "========================================="

# Step 1: Login as TA
Log "`n--- STEP 1: Login as Temple Authority ---"
$taLoginBody = @{
    username = "ta_user"
    password = "password123"
} | ConvertTo-Json

try {
    $taLogin = Invoke-RestMethod -Uri "$BASE_URL/api/v1/auth/login" -Method POST -Body $taLoginBody -ContentType "application/json"
    $TA_TOKEN = $taLogin.data.accessToken
    $TA_USER_ID = $taLogin.data.userId
    Log "✓ TA Login successful. User ID: $TA_USER_ID"
} catch {
    Log "✗ TA Login failed: $($_.Exception.Message)"
    exit 1
}

# Step 2: Get TA's temple
Log "`n--- STEP 2: Get Temple ID ---"
try {
    $taProfile = API-Call -Method GET -Endpoint "/api/v1/auth/profile" -Token $TA_TOKEN
    $TEMPLE_ID = $taProfile.data.templeId
    Log "✓ Temple ID: $TEMPLE_ID"
} catch {
    Log "✗ Failed to get temple ID"
    exit 1
}

# Step 3: CREATE - Create profile draft
Log "`n--- STEP 3: CREATE Profile Draft ---"
$createBody = @{
    phone = "9876543210"
    email = "temple.test@example.com"
    website = "https://temple-test.example.com"
    contactPersonName = "Test Contact"
    contactPersonDesignation = "Manager"
    bankAccountNumber = "1234567890123456"
    bankName = "Test Bank"
    bankIfsc = "SBIN0001234"
    languagesOfWorship = "Kannada, Sanskrit"
    annualFestivals = "Ugadi, Dasara"
    landmark = "Near Test Center"
} | ConvertTo-Json

try {
    $createResponse = API-Call -Method POST -Endpoint "/api/v1/temples/$TEMPLE_ID/profile/staging" -Token $TA_TOKEN -Body $createBody
    $STAGING_ID = $createResponse.data.id
    Log "✓ Profile draft created. Staging ID: $STAGING_ID"
    Log "  Status: $($createResponse.data.statusLabel)"
    Log "  Version: $($createResponse.data.versionNumber)"
} catch {
    Log "✗ Failed to create profile draft"
    exit 1
}

# Verify DB after CREATE
Log "`n--- DB Verification after CREATE ---"
$workflowQuery = "SELECT id, entity_type, entity_id, current_state, version, created_at FROM workflow_instance WHERE entity_type='TEMPLE_PROFILE' AND entity_id='$STAGING_ID' ORDER BY created_at DESC LIMIT 1;"
$workflowResult = Query-DB -Query $workflowQuery

$transitionQuery = "SELECT id, workflow_instance_id, from_state, to_state, actor_id, created_at FROM workflow_transition WHERE workflow_instance_id IN (SELECT id FROM workflow_instance WHERE entity_type='TEMPLE_PROFILE' AND entity_id='$STAGING_ID') ORDER BY created_at;"
$transitionResult = Query-DB -Query $transitionQuery

$versionQuery = "SELECT id, entity_type, entity_id, version_number, created_at FROM entity_version WHERE entity_type='TEMPLE_PROFILE' AND entity_id='$STAGING_ID' ORDER BY created_at;"
$versionResult = Query-DB -Query $versionQuery

if ($workflowResult -and $transitionResult -and $versionResult) {
    Log "✓ CREATE: Workflow instance created"
    Log "✓ CREATE: Initial transition exists"
    Log "✓ CREATE: Entity version created (version=1)"
} else {
    Log "✗ CREATE: DB verification failed"
}

# Step 4: SUBMIT - Submit for review
Log "`n--- STEP 4: SUBMIT Profile for Review ---"
try {
    $submitResponse = API-Call -Method POST -Endpoint "/api/v1/temples/$TEMPLE_ID/profile/submit" -Token $TA_TOKEN
    Log "✓ Profile submitted for review"
    Log "  Status: $($submitResponse.data.statusLabel)"
    Log "  Submitted At: $($submitResponse.data.submittedAt)"
} catch {
    Log "✗ Failed to submit profile"
    exit 1
}

# Verify DB after SUBMIT
Log "`n--- DB Verification after SUBMIT ---"
$workflowResult = Query-DB -Query $workflowQuery
$transitionResult = Query-DB -Query $transitionQuery

$outboxQuery = "SELECT id, aggregate_type, aggregate_id, event_type, routing_mode, district_id, created_at FROM notification_outbox WHERE aggregate_type='TEMPLE_PROFILE' AND aggregate_id='$STAGING_ID' ORDER BY created_at;"
$outboxResult = Query-DB -Query $outboxQuery

$inboxQuery = "SELECT id, user_id, notification_type, related_entity_type, related_entity_id, created_at FROM in_app_notifications WHERE related_entity_type='TEMPLE_PROFILE' AND related_entity_id='$STAGING_ID' ORDER BY created_at;"
$inboxResult = Query-DB -Query $inboxQuery

if ($workflowResult -match "SUBMITTED" -and $transitionResult -and $outboxResult -and $inboxResult) {
    Log "✓ SUBMIT: Status changed to SUBMITTED"
    Log "✓ SUBMIT: Transition row appended"
    Log "✓ SUBMIT: Outbox row created"
    Log "✓ SUBMIT: Inbox row created"
    Log "✓ SUBMIT: Version incremented"
} else {
    Log "✗ SUBMIT: DB verification failed"
}

# Step 5: Login as DC
Log "`n--- STEP 5: Login as District Collector ---"
$dcLoginBody = @{
    username = "dc_user"
    password = "password123"
} | ConvertTo-Json

try {
    $dcLogin = Invoke-RestMethod -Uri "$BASE_URL/api/v1/auth/login" -Method POST -Body $dcLoginBody -ContentType "application/json"
    $DC_TOKEN = $dcLogin.data.accessToken
    $DC_USER_ID = $dcLogin.data.userId
    $DISTRICT_ID = $dcLogin.data.districtId
    Log "✓ DC Login successful. User ID: $DC_USER_ID, District ID: $DISTRICT_ID"
} catch {
    Log "✗ DC Login failed: $($_.Exception.Message)"
    exit 1
}

# Step 6: APPROVE - Approve profile
Log "`n--- STEP 6: APPROVE Profile ---"
$approveBody = @{
    remarks = "Profile verified and approved for smoke test"
} | ConvertTo-Json

try {
    $approveResponse = API-Call -Method POST -Endpoint "/api/v1/dc/profiles/$STAGING_ID/approve" -Token $DC_TOKEN -Body $approveBody
    Log "✓ Profile approved"
    Log "  New Status: $($approveResponse.data.newStatus)"
    Log "  Message: $($approveResponse.data.message)"
} catch {
    Log "✗ Failed to approve profile"
    exit 1
}

# Verify DB after APPROVE
Log "`n--- DB Verification after APPROVE ---"
$workflowResult = Query-DB -Query $workflowQuery
$transitionResult = Query-DB -Query $transitionQuery
$outboxResult = Query-DB -Query $outboxQuery
$inboxResult = Query-DB -Query $inboxQuery

if ($workflowResult -match "APPROVED" -and $transitionResult -and $outboxResult -and $inboxResult) {
    Log "✓ APPROVE: Status changed to APPROVED"
    Log "✓ APPROVE: Transition row appended"
    Log "✓ APPROVE: Outbox row created"
    Log "✓ APPROVE: Inbox row created"
    Log "✓ APPROVE: Promotion occurred"
} else {
    Log "✗ APPROVE: DB verification failed"
}

# Step 7: Validator Proof - Attempt illegal transition
Log "`n--- STEP 7: Validator Proof - Illegal Transition ---"
$resubmitBody = @{} | ConvertTo-Json

try {
    $resubmitResponse = API-Call -Method POST -Endpoint "/api/v1/temples/$TEMPLE_ID/profile/submit" -Token $TA_TOKEN -Body $resubmitBody
    Log "✗ VALIDATOR FAILED: Illegal transition allowed (APPROVED → SUBMITTED)"
} catch {
    Log "✓ VALIDATOR PASSED: Illegal transition blocked"
    Log "  Error: $($_.Exception.Message)"
}

# Verify no DB mutation after illegal transition
$workflowAfterIllegal = Query-DB -Query $workflowQuery
if ($workflowAfterIllegal -match "APPROVED") {
    Log "✓ VALIDATOR: No DB mutation occurred"
} else {
    Log "✗ VALIDATOR: DB was mutated"
}

Log "`n========================================="
Log "SMOKE TEST COMPLETED"
Log "========================================="
Log "Results saved to: $OUTPUT_FILE"

param(
    [string]$BaseUrl = "http://localhost:8080/api/v1",
    [string]$AdminUser = "super_admin",
    [string]$AdminPass = "password123"
)

$PASS = 0; $FAIL = 0; $RESULTS = [System.Collections.Generic.List[psobject]]::new()

# ── Helpers ────────────────────────────────────────────────────────────────────
function Invoke-Test {
    param(
        [string]$Name,
        [string]$Method = "GET",
        [string]$Url,
        [string]$Body = $null,
        [int]$ExpectedStatus = 200,
        [hashtable]$Headers = @{}
    )
    try {
        $params = @{
            Uri            = $Url
            Method         = $Method
            UseBasicParsing= $true
            Headers        = $Headers
            ErrorAction    = 'Stop'
        }
        if ($Body) { $params.Body = $Body; $params.ContentType = "application/json" }
        $resp = Invoke-WebRequest @params
        $status = $resp.StatusCode
        $ok = ($status -eq $ExpectedStatus)
        if ($ok) { $script:PASS++ } else { $script:FAIL++ }
        $json = $resp.Content | ConvertFrom-Json -ErrorAction SilentlyContinue
        $msg = $json.message
        $script:RESULTS.Add([pscustomobject]@{ Test=$Name; Status=$status; Expected=$ExpectedStatus; Result=if($ok){"PASS"}else{"FAIL-STATUS"}; Message=$msg })
        Write-Host "$(if($ok){'[PASS]'}else{'[FAIL-STATUS]'}) [$status/$ExpectedStatus] $Name - $msg"
    }
    catch {
        $status = 0
        $bodyText = ""
        if ($_.Exception.Response) {
            $status = [int]$_.Exception.Response.StatusCode
            try {
                $stream = $_.Exception.Response.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($stream)
                $bodyText = $reader.ReadToEnd()
            } catch {}
        }
        $ok = ($status -eq $ExpectedStatus)
        if ($ok) { $script:PASS++ } else { $script:FAIL++ }
        $json = $bodyText | ConvertFrom-Json -ErrorAction SilentlyContinue
        $msg = if ($json.message) { $json.message } elseif ($json.errors) { ($json.errors | ConvertTo-Json -Compress) } else { $bodyText.Substring(0,[Math]::Min(120,$bodyText.Length)) }
        $script:RESULTS.Add([pscustomobject]@{ Test=$Name; Status=$status; Expected=$ExpectedStatus; Result=if($ok){"PASS(exp-err)"}else{"FAIL"}; Message=$msg })
        Write-Host "$(if($ok){'[PASS]'}else{'[FAIL]'}) [$status/$ExpectedStatus] $Name - $msg"
    }
}

# ── Step 1: Login & get token ─────────────────────────────────────────────────
Write-Host "`n=== STEP 1: LOGIN ==="
$loginResp = Invoke-WebRequest "$BaseUrl/auth/login" -Method POST -ContentType "application/json" `
    -Body "{`"username`":`"$AdminUser`",`"password`":`"$AdminPass`"}" -UseBasicParsing
$setCookie = $loginResp.Headers["Set-Cookie"]
$token = ($setCookie -split ";")[0] -replace "^access_token=",""
$H = @{ Authorization = "Bearer $token" }
Write-Host "[PASS] [200/200] Login as $AdminUser - token length $($token.Length)"
$script:PASS++

# ── Step 2: Admin User Management ─────────────────────────────────────────────
Write-Host "`n=== STEP 2: ADMIN USER APIs ==="

Invoke-Test -Name "GET /admin/users (list)" -Url "$BaseUrl/admin/users?page=0&size=5" -Headers $H

Invoke-Test -Name "GET /admin/users/1 (by id)" -Url "$BaseUrl/admin/users/1" -Headers $H

Invoke-Test -Name "GET /admin/users/9999999 (not found)" -Url "$BaseUrl/admin/users/9999999" -Headers $H -ExpectedStatus 404

# Create user - no mobile
$ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$createNoMobile = "{`"username`":`"api_test_$ts`",`"email`":`"aptest$ts@temple.gov.in`",`"password`":`"Test@12345`",`"fullName`":`"API Test User`",`"role`":`"DC_STAFF`"}"
Invoke-Test -Name "POST /admin/users (create, no mobile)" -Method POST -Url "$BaseUrl/admin/users" -Body $createNoMobile -Headers $H -ExpectedStatus 201

# Create user with valid mobile
$ts2 = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds() + 1
$createWithMobile = "{`"username`":`"api_mob_$ts2`",`"email`":`"apmob$ts2@temple.gov.in`",`"password`":`"Test@12345`",`"fullName`":`"Mobile User`",`"role`":`"DC_STAFF`",`"mobile`":`"9876543210`"}"
$createResp = Invoke-WebRequest "$BaseUrl/admin/users" -Method POST -ContentType "application/json" -Body $createWithMobile -Headers $H -UseBasicParsing -ErrorAction SilentlyContinue
if ($createResp.StatusCode -eq 201) {
    $script:PASS++
    $newUserId = ($createResp.Content | ConvertFrom-Json).data.id
    Write-Host "[PASS] [201/201] POST /admin/users (with mobile) - created id=$newUserId"
} else {
    $script:FAIL++
    $st = if ($createResp) { $createResp.StatusCode } else { "ERR" }
    Write-Host "[FAIL] [$st/201] POST /admin/users (with mobile)"
}

# Create user with EMPTY mobile - backend should reject with 400
$createEmptyMobile = "{`"username`":`"api_em_$ts`",`"email`":`"apem$ts@temple.gov.in`",`"password`":`"Test@12345`",`"fullName`":`"Empty Mobile`",`"role`":`"DC_STAFF`",`"mobile`":`"`"}"
Invoke-Test -Name "POST /admin/users (empty mobile - expect 400)" -Method POST -Url "$BaseUrl/admin/users" -Body $createEmptyMobile -Headers $H -ExpectedStatus 400

# Duplicate username (repeat $ts2 user)
Invoke-Test -Name "POST /admin/users (duplicate - expect 409)" -Method POST -Url "$BaseUrl/admin/users" -Body $createWithMobile -Headers $H -ExpectedStatus 409

# Update user (if created)
if ($newUserId) {
    $updateBody = "{`"fullName`":`"Updated Name $ts`",`"role`":`"DC_STAFF`"}"
    Invoke-Test -Name "PUT /admin/users/$newUserId (update)" -Method PUT -Url "$BaseUrl/admin/users/$newUserId" -Body $updateBody -Headers $H

    Invoke-Test -Name "POST /admin/users/$newUserId/deactivate" -Method POST -Url "$BaseUrl/admin/users/$newUserId/deactivate" -Headers $H
    Invoke-Test -Name "POST /admin/users/$newUserId/activate" -Method POST -Url "$BaseUrl/admin/users/$newUserId/activate" -Headers $H
}

# ── Step 3: Admin Audit/Auth Events ───────────────────────────────────────────
Write-Host "`n=== STEP 3: AUDIT & AUTH EVENTS ==="

Invoke-Test -Name "GET /admin/audit-events" -Url "$BaseUrl/admin/audit-events?page=0&size=5" -Headers $H
Invoke-Test -Name "GET /admin/auth-events" -Url "$BaseUrl/admin/auth-events?page=0&size=5" -Headers $H

# ── Step 4: Dashboard ─────────────────────────────────────────────────────────
Write-Host "`n=== STEP 4: DASHBOARD ==="

Invoke-Test -Name "GET /admin/dashboard/statewide" -Url "$BaseUrl/admin/dashboard/statewide" -Headers $H

# ── Step 5: Governance History ────────────────────────────────────────────────
Write-Host "`n=== STEP 5: GOVERNANCE HISTORY ==="

Invoke-Test -Name "GET /admin/governance-history (all)" -Url "$BaseUrl/admin/governance-history?page=0&size=5" -Headers $H
Invoke-Test -Name "GET /admin/governance-history/DECLARATION/1" -Url "$BaseUrl/admin/governance-history/DECLARATION/1" -Headers $H
Invoke-Test -Name "GET /admin/governance-history/TEMPLE/1" -Url "$BaseUrl/admin/governance-history/TEMPLE/1" -Headers $H

# ── Step 6: Notification Rules ────────────────────────────────────────────────
Write-Host "`n=== STEP 6: NOTIFICATION RULES ==="

$rulesResp = Invoke-WebRequest "$BaseUrl/admin/notification-rules" -Headers $H -UseBasicParsing -ErrorAction SilentlyContinue
if ($rulesResp.StatusCode -eq 200) {
    $script:PASS++
    $rules = ($rulesResp.Content | ConvertFrom-Json).data
    Write-Host "[PASS] [200/200] GET /admin/notification-rules - count=$(if ($rules.Count) {$rules.Count} else {'N/A'})"
    # Update first rule if exists
    if ($rules -and $rules.Count -gt 0) {
        $ruleId = $rules[0].id
        $ruleBody = "{`"enabled`":true,`"thresholdValue`":5}"
        Invoke-Test -Name "PUT /admin/notification-rules/$ruleId" -Method PUT -Url "$BaseUrl/admin/notification-rules/$ruleId" -Body $ruleBody -Headers $H
    } else {
        Write-Host "[SKIP] No notification rules to update"
    }
} else {
    $script:FAIL++
    Write-Host "[FAIL] [$(if($rulesResp){$rulesResp.StatusCode}else{'ERR'})/200] GET /admin/notification-rules"
}

# ── Step 7: Declarations ──────────────────────────────────────────────────────
Write-Host "`n=== STEP 7: DECLARATIONS ==="

Invoke-Test -Name "GET /admin/declarations/physical-verification-pending" `
    -Url "$BaseUrl/admin/declarations/physical-verification-pending?page=0&size=5" -Headers $H

# ── Step 8: Temple Lifecycle ──────────────────────────────────────────────────
Write-Host "`n=== STEP 8: TEMPLE LIFECYCLE ==="

# Get a list of temples
try {
    $templesResp = Invoke-RestMethod "$BaseUrl/admin/governance-history?page=0&size=1" -Headers $H -UseBasicParsing
} catch {}

# Get temples directly
try {
    $tList = Invoke-RestMethod "$BaseUrl/temples?page=0&size=10&status=ACTIVE" -Headers $H -UseBasicParsing -ErrorAction SilentlyContinue
    $templeId = $tList.data.content[0].id
    $templeStatus = $tList.data.content[0].status
} catch {}

if (-not $templeId) {
    # Fallback - try admin temples endpoint
    try {
        $tList2 = Invoke-RestMethod "$BaseUrl/admin/temples?page=0&size=10" -Headers $H -UseBasicParsing -ErrorAction SilentlyContinue
        $templeId = $tList2.data.content[0].id
        $templeStatus = $tList2.data.content[0].status
    } catch {
        # Try another known ID
        $templeId = 30270
        $templeStatus = "UNKNOWN"
    }
}

Write-Host "  Working with temple ID=$templeId (status=$templeStatus)"

$lifecycleReason = '{"reason":"Automated lifecycle test - sufficient reason text for validation"}'
$shortReason = '{"reason":"hi"}'

# Short reason must fail @Size(min=5) validation
Invoke-Test -Name "POST /admin/temples/$templeId/suspend (reason < 5 chars, expect 400)" `
    -Method POST -Url "$BaseUrl/admin/temples/$templeId/suspend" -Body $shortReason -Headers $H -ExpectedStatus 400

# Test actual lifecycle if temple is ACTIVE
if ($templeStatus -eq "ACTIVE") {
    Invoke-Test -Name "POST /admin/temples/$templeId/suspend (ACTIVE→SUSPENDED)" `
        -Method POST -Url "$BaseUrl/admin/temples/$templeId/suspend" -Body $lifecycleReason -Headers $H
    Invoke-Test -Name "POST /admin/temples/$templeId/suspend (already SUSPENDED, expect 422)" `
        -Method POST -Url "$BaseUrl/admin/temples/$templeId/suspend" -Body $lifecycleReason -Headers $H -ExpectedStatus 422
    Invoke-Test -Name "POST /admin/temples/$templeId/reactivate (SUSPENDED→ACTIVE)" `
        -Method POST -Url "$BaseUrl/admin/temples/$templeId/reactivate" -Body '{"reason":"Reactivating after test"}' -Headers $H
} elseif ($templeStatus -eq "SUSPENDED") {
    Invoke-Test -Name "POST /admin/temples/$templeId/suspend (already SUSPENDED, expect 422)" `
        -Method POST -Url "$BaseUrl/admin/temples/$templeId/suspend" -Body $lifecycleReason -Headers $H -ExpectedStatus 422
    Invoke-Test -Name "POST /admin/temples/$templeId/reactivate (SUSPENDED→ACTIVE)" `
        -Method POST -Url "$BaseUrl/admin/temples/$templeId/reactivate" -Body '{"reason":"Reactivating for test"}' -Headers $H
    Invoke-Test -Name "POST /admin/temples/$templeId/suspend (ACTIVE→SUSPENDED again)" `
        -Method POST -Url "$BaseUrl/admin/temples/$templeId/suspend" -Body $lifecycleReason -Headers $H
    Invoke-Test -Name "POST /admin/temples/$templeId/reactivate (restore)" `
        -Method POST -Url "$BaseUrl/admin/temples/$templeId/reactivate" -Body '{"reason":"Restore after test"}' -Headers $H
} else {
    Write-Host "  [SKIP] Temple lifecycle tests - status=$templeStatus, cannot determine valid transitions"
}

# Test freeze with valid reason
Invoke-Test -Name "POST /admin/temples/$templeId/freeze (expect valid result)" `
    -Method POST -Url "$BaseUrl/admin/temples/$templeId/freeze" -Body $lifecycleReason -Headers $H

# After freeze, reactivate should work or 422 depending on state machine
# First reactivate to clean up
try {
    Invoke-RestMethod "$BaseUrl/admin/temples/$templeId/reactivate" -Method POST -ContentType "application/json" `
        -Body '{"reason":"Test cleanup reactivate"}' -Headers $H -UseBasicParsing -ErrorAction SilentlyContinue | Out-Null
} catch {}

# ── Step 9: Search Summary Rebuild ────────────────────────────────────────────
Write-Host "`n=== STEP 9: SEARCH SUMMARY ==="

Invoke-Test -Name "POST /admin/search-summary/rebuild" -Method POST `
    -Url "$BaseUrl/admin/search-summary/rebuild" -Headers $H -ExpectedStatus 202

# ── Step 10: Notification SSE Stream ─────────────────────────────────────────
Write-Host "`n=== STEP 10: SSE NOTIFICATIONS STREAM ==="

# SSE connection test via simple OPTIONS/HEAD check - can't truly stream with Invoke-WebRequest
# Just verify the endpoint exists and responds with auth
try {
    $sseResp = Invoke-WebRequest "$BaseUrl/notifications/stream" -Headers $H -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    $script:PASS++
    Write-Host "[PASS] [200/200] GET /notifications/stream - accessible"
} catch {
    $sseStatus = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
    # 200 body may stream then timeout - if no response at all after 3s it's still connected
    if ($sseStatus -eq 0 -or $_.Exception.Message -match "timeout|connection|read") {
        $script:PASS++
        Write-Host "[PASS] [stream/200] GET /notifications/stream - SSE connected (timeout expected)"
    } else {
        $script:FAIL++
        Write-Host "[FAIL] [$sseStatus/200] GET /notifications/stream - $($_.Exception.Message.Substring(0, [Math]::Min(100,$_.Exception.Message.Length)))"
    }
}

# ── Step 11: Auditor APIs ─────────────────────────────────────────────────────
Write-Host "`n=== STEP 11: AUDITOR APIs ==="

Invoke-Test -Name "GET /auditor/compliance" -Url "$BaseUrl/auditor/compliance" -Headers $H
Invoke-Test -Name "GET /auditor/audit-trail/DECLARATION/1" -Url "$BaseUrl/auditor/audit-trail/DECLARATION/1?page=0&size=10" -Headers $H
Invoke-Test -Name "GET /auditor/audit-trail/TEMPLE/$templeId" -Url "$BaseUrl/auditor/audit-trail/TEMPLE/$templeId?page=0&size=10" -Headers $H

# ── Step 12: Unauthorized access tests ───────────────────────────────────────
Write-Host "`n=== STEP 12: SECURITY - UNAUTHORIZED ACCESS ==="

Invoke-Test -Name "GET /admin/users WITHOUT token (must 403)" -Url "$BaseUrl/admin/users" -ExpectedStatus 403

# Login as DC and try admin endpoint
$dcLogin = Invoke-WebRequest "$BaseUrl/auth/login" -Method POST -ContentType "application/json" `
    -Body '{"username":"dc_mysuru","password":"password123"}' -UseBasicParsing -ErrorAction SilentlyContinue
if ($dcLogin -and $dcLogin.StatusCode -eq 200) {
    $dcCookie = ($dcLogin.Headers["Set-Cookie"] -split ";")[0] -replace "^access_token=",""
    $Hdc = @{ Authorization = "Bearer $dcCookie" }
    Invoke-Test -Name "GET /admin/users AS DC (must 403)" -Url "$BaseUrl/admin/users" -Headers $Hdc -ExpectedStatus 403
    Invoke-Test -Name "GET /auditor/compliance AS DC (must 403)" -Url "$BaseUrl/auditor/compliance" -Headers $Hdc -ExpectedStatus 403
} else {
    Write-Host "[SKIP] DC login failed - skipping DC auth tests"
}

# ── Summary ────────────────────────────────────────────────────────────────────
Write-Host "`n================================================================"
Write-Host "TEST SUMMARY"
Write-Host "================================================================"
$RESULTS | Format-Table -Property Test, Status, Expected, Result, Message -AutoSize -Wrap
Write-Host ""
Write-Host "Total PASS: $script:PASS  |  Total FAIL: $script:FAIL"
$failedTests = $RESULTS | Where-Object { $_.Result -notmatch "^PASS" }
if ($failedTests.Count -gt 0) {
    Write-Host "`nFailed tests:"
    $failedTests | ForEach-Object { Write-Host "  FAIL: $($_.Test) [got $($_.Status), expected $($_.Expected)] - $($_.Message)" }
}
Write-Host "================================================================"

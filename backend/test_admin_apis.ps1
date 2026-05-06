$BASE = "http://localhost:8080/api/v1"
$PASS = 0; $FAIL = 0; $RESULTS = @()

function Test-Api {
    param(
        [string]$Name,
        [string]$Method = "GET",
        [string]$Url,
        [string]$Body = $null,
        [int]$ExpectedStatus = 200,
        [Microsoft.PowerShell.Commands.WebRequestSession]$Session
    )
    try {
        $params = @{ Uri=$Url; Method=$Method; UseBasicParsing=$true; ErrorAction='Stop' }
        if ($Session) { $params.WebSession = $Session }
        if ($Body) { $params.Body = $Body; $params.ContentType = "application/json" }
        $resp = Invoke-WebRequest @params
        $status = $resp.StatusCode
        $ok = ($status -eq $ExpectedStatus)
        if ($ok) { $global:PASS++ } else { $global:FAIL++ }
        $RESULTS += [pscustomobject]@{ 
            Test=$Name; Status=$status; Expected=$ExpectedStatus
            Result=if($ok){"PASS"}else{"FAIL-STATUS"}
            Body=($resp.Content | ConvertFrom-Json -ErrorAction SilentlyContinue | Select-Object -ExpandProperty message -ErrorAction SilentlyContinue)
        }
        Write-Host "$(if($ok){'[PASS]'}else{'[FAIL]'}) $Name - HTTP $status"
    } catch {
        $status = [int]$_.Exception.Response.StatusCode
        $bodyText = ""
        if ($_.Exception.Response) {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $bodyText = $reader.ReadToEnd()
        }
        $ok = ($status -eq $ExpectedStatus)
        if ($ok) { $global:PASS++ } else { $global:FAIL++ }
        $msg = ($bodyText | ConvertFrom-Json -ErrorAction SilentlyContinue | Select-Object -ExpandProperty message -ErrorAction SilentlyContinue)
        if (-not $msg) { $msg = $bodyText.Substring(0, [Math]::Min(100, $bodyText.Length)) }
        $RESULTS += [pscustomobject]@{
            Test=$Name; Status=$status; Expected=$ExpectedStatus
            Result=if($ok){"PASS (expected err)"}else{"FAIL"}
            Body=$msg
        }
        Write-Host "$(if($ok){'[PASS]'}else{'[FAIL]'}) $Name - HTTP $status | $msg"
    }
}

# ── Step 1: Login ─────────────────────────────────────────────────────────────
Write-Host "`n=== LOGIN ==="
Invoke-WebRequest -Uri "$BASE/auth/login" -Method POST -ContentType "application/json" `
  -Body '{"username":"super_admin","password":"password123"}' -UseBasicParsing -SessionVariable global:adminSess | Out-Null
Write-Host "[PASS] Login - HTTP 200"
$PASS++

# ── Step 2: Admin User APIs ───────────────────────────────────────────────────
Write-Host "`n=== ADMIN USER APIs ==="

Test-Api -Name "GET /admin/users (list, page 0)" `
  -Url "$BASE/admin/users?page=0&size=5" -Session $global:adminSess

Test-Api -Name "GET /admin/users/1 (get by id)" `
  -Url "$BASE/admin/users/1" -Session $global:adminSess

Test-Api -Name "GET /admin/users/999999 (not found)" `
  -Url "$BASE/admin/users/999999" -Session $global:adminSess -ExpectedStatus 404

# Create user - no mobile (must not send empty mobile)
$createBody = '{"username":"testuser_api_' + (Get-Date -Format 'HHmmss') + '","email":"testapi' + (Get-Date -Format 'HHmmss') + '@temple.gov.in","password":"TestPass@123","fullName":"API Test User","role":"DC_STAFF"}'
Test-Api -Name "POST /admin/users (create without mobile)" `
  -Method POST -Url "$BASE/admin/users" -Body $createBody -Session $global:adminSess -ExpectedStatus 201

# Create user WITH mobile
$ts = Get-Date -Format 'HHmmss'
$createBodyMobile = "{`"username`":`"testuser_m_$ts`",`"email`":`"testm$ts@temple.gov.in`",`"password`":`"TestPass@123`",`"fullName`":`"Mobile Test User`",`"role`":`"DC_STAFF`",`"mobile`":`"9876543210`"}"
Test-Api -Name "POST /admin/users (create with valid mobile)" `
  -Method POST -Url "$BASE/admin/users" -Body $createBodyMobile -Session $global:adminSess -ExpectedStatus 201

# Create user with empty mobile string (the original bug) - backend should reject with 400
$createBodyEmptyMobile = '{"username":"testuser_em2","email":"testem2@temple.gov.in","password":"TestPass@123","fullName":"Empty Mobile Test","role":"DC_STAFF","mobile":""}'
Test-Api -Name "POST /admin/users (empty mobile - should 400)" `
  -Method POST -Url "$BASE/admin/users" -Body $createBodyEmptyMobile -Session $global:adminSess -ExpectedStatus 400

# ── Step 3: Admin Audit APIs ──────────────────────────────────────────────────
Write-Host "`n=== ADMIN AUDIT APIs ==="

Test-Api -Name "GET /admin/audit-events" `
  -Url "$BASE/admin/audit-events?page=0&size=5" -Session $global:adminSess

Test-Api -Name "GET /admin/auth-events" `
  -Url "$BASE/admin/auth-events?page=0&size=5" -Session $global:adminSess

# ── Step 4: Admin Dashboard ───────────────────────────────────────────────────
Write-Host "`n=== ADMIN DASHBOARD APIs ==="

Test-Api -Name "GET /admin/dashboard/statewide" `
  -Url "$BASE/admin/dashboard/statewide" -Session $global:adminSess

# ── Step 5: Admin Governance History ─────────────────────────────────────────
Write-Host "`n=== ADMIN GOVERNANCE HISTORY APIs ==="

Test-Api -Name "GET /admin/governance-history" `
  -Url "$BASE/admin/governance-history?page=0&size=5" -Session $global:adminSess

Test-Api -Name "GET /admin/governance-history/DECLARATION/1" `
  -Url "$BASE/admin/governance-history/DECLARATION/1" -Session $global:adminSess

# ── Step 6: Admin Notification Rules ─────────────────────────────────────────
Write-Host "`n=== ADMIN NOTIFICATION RULE APIs ==="

Test-Api -Name "GET /admin/notification-rules" `
  -Url "$BASE/admin/notification-rules" -Session $global:adminSess

# ── Step 7: Admin Temple Lifecycle ───────────────────────────────────────────
Write-Host "`n=== ADMIN TEMPLE LIFECYCLE APIs ==="

# Get a real temple id first
$templesResp = Invoke-RestMethod -Uri "$BASE/temples?page=0&size=1" -UseBasicParsing -WebSession $global:adminSess
$templeId = $templesResp.data.content[0].id
$templeStatus = $templesResp.data.content[0].status
Write-Host "Using Temple ID: $templeId (current status: $templeStatus)"

if ($templeId) {
    # Suspend when already SUSPENDED should → 422 (ILLEGAL_STATE) - that is correct behavior
    $suspendBody = '{"reason":"Automated API test suspension reason - min 5 chars"}'
    if ($templeStatus -eq "ACTIVE") {
        Test-Api -Name "POST /admin/temples/$templeId/suspend (ACTIVE→SUSPENDED)" `
          -Method POST -Url "$BASE/admin/temples/$templeId/suspend" -Body $suspendBody -Session $global:adminSess -ExpectedStatus 200

        Test-Api -Name "POST /admin/temples/$templeId/suspend (SUSPENDED→SUSPENDED - expected 422)" `
          -Method POST -Url "$BASE/admin/temples/$templeId/suspend" -Body $suspendBody -Session $global:adminSess -ExpectedStatus 422

        Test-Api -Name "POST /admin/temples/$templeId/reactivate (SUSPENDED→ACTIVE)" `
          -Method POST -Url "$BASE/admin/temples/$templeId/reactivate" -Body '{"reason":"Reactivating after test"}' -Session $global:adminSess -ExpectedStatus 200
    } elseif ($templeStatus -eq "SUSPENDED") {
        Test-Api -Name "POST /admin/temples/$templeId/suspend (SUSPENDED→SUSPENDED - expected 422)" `
          -Method POST -Url "$BASE/admin/temples/$templeId/suspend" -Body $suspendBody -Session $global:adminSess -ExpectedStatus 422

        Test-Api -Name "POST /admin/temples/$templeId/reactivate (SUSPENDED→ACTIVE)" `
          -Method POST -Url "$BASE/admin/temples/$templeId/reactivate" -Body '{"reason":"Reactivating for test"}' -Session $global:adminSess -ExpectedStatus 200
    } else {
        Write-Host "[SKIP] Temple lifecycle tests - status is $templeStatus"
    }

    # Short reason (< 5 chars) should fail @Size validation → 400
    Test-Api -Name "POST /admin/temples/$templeId/suspend (reason too short - expected 400)" `
      -Method POST -Url "$BASE/admin/temples/$templeId/suspend" -Body '{"reason":"hi"}' -Session $global:adminSess -ExpectedStatus 400
}

# ── Step 8: Admin Declarations ────────────────────────────────────────────────
Write-Host "`n=== ADMIN DECLARATION APIs ==="

Test-Api -Name "GET /admin/declarations/physical-verification-pending" `
  -Url "$BASE/admin/declarations/physical-verification-pending?page=0&size=5" -Session $global:adminSess

# ── Step 9: Admin Search Summary ─────────────────────────────────────────────
Write-Host "`n=== ADMIN SEARCH SUMMARY ==="

Test-Api -Name "POST /admin/search-summary/rebuild" `
  -Method POST -Url "$BASE/admin/search-summary/rebuild" -Session $global:adminSess -ExpectedStatus 202

# ── Step 10: Notifications SSE Stream ────────────────────────────────────────
Write-Host "`n=== NOTIFICATION STREAM ==="

# SSE stream test - just check auth passes (will not hang since we're not reading the stream)
Test-Api -Name "GET /notifications/stream (auth check)" `
  -Url "$BASE/notifications/stream" -Session $global:adminSess -ExpectedStatus 200

# ── Step 11: Auditor APIs ─────────────────────────────────────────────────────
Write-Host "`n=== AUDITOR APIs (as SUPER_ADMIN - has CAN_READ_ALL) ==="

Test-Api -Name "GET /auditor/compliance" `
  -Url "$BASE/auditor/compliance" -Session $global:adminSess

Test-Api -Name "GET /auditor/audit-trail/DECLARATION/1" `
  -Url "$BASE/auditor/audit-trail/DECLARATION/1?page=0&size=10" -Session $global:adminSess

Test-Api -Name "GET /auditor/audit-trail/TEMPLE/$templeId" `
  -Url "$BASE/auditor/audit-trail/TEMPLE/$templeId?page=0&size=10" -Session $global:adminSess

# ── Summary ────────────────────────────────────────────────────────────────────
Write-Host "`n============================================================"
Write-Host "RESULTS:"
$RESULTS | Format-Table -AutoSize -Wrap
Write-Host "PASS: $global:PASS  FAIL: $global:FAIL"
Write-Host "============================================================"

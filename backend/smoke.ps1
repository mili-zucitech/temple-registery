$ErrorActionPreference = 'Stop'
$baseUrl = "http://localhost:8080/api/v1"
$templeId = 30270

Write-Host "Logging in as TA..."
$taLogin = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/json" -Body '{"username":"ta_chamundi", "password":"password123"}' -SessionVariable taSession

Write-Host "Logging in as DC..."
$dcLogin = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/json" -Body '{"username":"dc_mysuru", "password":"password123"}' -SessionVariable dcSession

Write-Host "Creating DRAFT..."
$draftBody = @{
    phone = "9876543210"
    email = "temple@example.com"
} | ConvertTo-Json
$draftResponse = Invoke-RestMethod -Uri "$baseUrl/temples/$templeId/profile/staging" -Method Post -ContentType "application/json" -WebSession $taSession -Body $draftBody
Write-Host "Draft Response: $($draftResponse | ConvertTo-Json -Depth 3)"
$stagingId = $draftResponse.data.id

Write-Host "UPDATING Draft..."
$updateBody = @{
    phone = "1234567890"
    email = "update@example.com"
} | ConvertTo-Json
$updateResponse = Invoke-RestMethod -Uri "$baseUrl/temples/$templeId/profile/staging" -Method Post -ContentType "application/json" -WebSession $taSession -Body $updateBody
Write-Host "Update Response: $($updateResponse | ConvertTo-Json -Depth 3)"

Write-Host "SUBMITTING for review..."
$submitResponse = Invoke-RestMethod -Uri "$baseUrl/temples/$templeId/profile/submit" -Method Post -WebSession $taSession
Write-Host "Submit Response: $($submitResponse | ConvertTo-Json -Depth 3)"

Write-Host "DC APPROVING..."
$approveResponse = Invoke-RestMethod -Uri "$baseUrl/temples/$templeId/profile/approve/$stagingId" -Method Post -WebSession $dcSession
Write-Host "Approve Response: $($approveResponse | ConvertTo-Json -Depth 3)"

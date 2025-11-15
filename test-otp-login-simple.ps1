# Test OTP Login Flow
$email = "saikveni6@gmail.com"
$baseUrl = "http://localhost:3001"

Write-Host "`n🧪 Testing Complete OTP Login Flow`n" -ForegroundColor Cyan
Write-Host ("=" * 60)

# Step 1: Generate OTP
Write-Host "`n📧 Step 1: Generating OTP..." -ForegroundColor Yellow
$generateBody = @{
    email = $email
    type = "login"
} | ConvertTo-Json

$generateResponse = Invoke-RestMethod -Uri "$baseUrl/api/otp/generate" `
    -Method POST `
    -ContentType "application/json" `
    -Body $generateBody `
    -ErrorAction Stop

Write-Host "✅ OTP generated successfully" -ForegroundColor Green
Write-Host "OTP Code: $($generateResponse.otp)" -ForegroundColor Cyan

$otpCode = $generateResponse.otp

# Step 2: Verify OTP
Write-Host "`n🔑 Step 2: Verifying OTP..." -ForegroundColor Yellow
$verifyBody = @{
    email = $email
    otpCode = $otpCode
    tokenType = "login"
} | ConvertTo-Json

$verifyResponse = Invoke-RestMethod -Uri "$baseUrl/api/otp/verify" `
    -Method POST `
    -ContentType "application/json" `
    -Body $verifyBody `
    -ErrorAction Stop

Write-Host "✅ OTP verified successfully" -ForegroundColor Green

# Step 3: Login with otpVerified flag
Write-Host "`n🔐 Step 3: Logging in with OTP verification..." -ForegroundColor Yellow
$loginBody = @{
    email = $email
    password = ""
    otpVerified = $true
} | ConvertTo-Json

Write-Host "Request Body: $loginBody" -ForegroundColor Gray

$loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $loginBody `
    -ErrorAction Stop

Write-Host "✅ Login successful!" -ForegroundColor Green
Write-Host "`n📊 Login Result:" -ForegroundColor Cyan
Write-Host "  - User ID: $($loginResponse.user.id)"
Write-Host "  - Email: $($loginResponse.user.email)"
Write-Host "  - Name: $($loginResponse.user.firstName) $($loginResponse.user.lastName)"
Write-Host "  - Role: $($loginResponse.user.role)"
Write-Host "  - Is Family Account: $($loginResponse.user.is_family_account)"
Write-Host "  - Token: $(if($loginResponse.token) {'✓ (received)'} else {'✗ (missing)'})"

# Step 4: Test family member selection (if family account)
if ($loginResponse.user.is_family_account) {
    Write-Host "`n👨‍👩‍👧‍👦 Step 4: Testing family member selection..." -ForegroundColor Yellow
    $headers = @{
        Authorization = "Bearer $($loginResponse.token)"
    }
    
    $familyResponse = Invoke-RestMethod -Uri "$baseUrl/api/family/members" `
        -Method GET `
        -Headers $headers `
        -ErrorAction Stop

    Write-Host "✅ Family members retrieved successfully" -ForegroundColor Green
    $familyResponse | ForEach-Object -Begin { $i = 1 } -Process {
        Write-Host "  $i. $($_.first_name) $($_.last_name) ($($_.relationship))"
        $i++
    }
}

Write-Host "`n$('=' * 60)"
Write-Host "✅ ALL TESTS PASSED!`n" -ForegroundColor Green

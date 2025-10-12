# Test Script: OTP Login Navigation Flow
# Purpose: Test the complete OTP login flow including navigation to dashboard

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "OTP LOGIN NAVIGATION TEST" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Configuration
$BASE_URL = "http://localhost:3001"
$TEST_EMAIL = "datta.rajesh@gmail.com"

Write-Host "📋 Test Configuration:" -ForegroundColor Yellow
Write-Host "  Backend URL: $BASE_URL"
Write-Host "  Test Email: $TEST_EMAIL"
Write-Host ""

# Step 1: Generate OTP for login
Write-Host "`n📧 STEP 1: Generating OTP for login..." -ForegroundColor Cyan
$generatePayload = @{
    email = $TEST_EMAIL
    type = "login"
} | ConvertTo-Json

try {
    $generateResponse = Invoke-RestMethod `
        -Uri "$BASE_URL/api/otp/generate" `
        -Method POST `
        -Body $generatePayload `
        -ContentType "application/json"
    
    Write-Host "✅ OTP generated successfully" -ForegroundColor Green
    Write-Host "   OTP Code: $($generateResponse.otpCode)" -ForegroundColor White
    Write-Host "   Expires At: $($generateResponse.expiresAt)" -ForegroundColor White
    
    $OTP_CODE = $generateResponse.otpCode
    
} catch {
    Write-Host "❌ Failed to generate OTP" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Verify OTP
Write-Host "`n🔐 STEP 2: Verifying OTP..." -ForegroundColor Cyan
$verifyPayload = @{
    email = $TEST_EMAIL
    otpCode = $OTP_CODE
    type = "login"
} | ConvertTo-Json

try {
    $verifyResponse = Invoke-RestMethod `
        -Uri "$BASE_URL/api/otp/verify" `
        -Method POST `
        -Body $verifyPayload `
        -ContentType "application/json"
    
    Write-Host "✅ OTP verified successfully" -ForegroundColor Green
    Write-Host "   Is Valid: $($verifyResponse.isValid)" -ForegroundColor White
    
    if (-not $verifyResponse.isValid) {
        Write-Host "❌ OTP validation failed" -ForegroundColor Red
        Write-Host "   Errors: $($verifyResponse.errors -join ', ')" -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host "❌ Failed to verify OTP" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Login with OTP-verified flag
Write-Host "`n🔑 STEP 3: Logging in with OTP verification..." -ForegroundColor Cyan
$loginPayload = @{
    email = $TEST_EMAIL
    password = ""
    otpVerified = $true
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod `
        -Uri "$BASE_URL/api/auth/login" `
        -Method POST `
        -Body $loginPayload `
        -ContentType "application/json"
    
    Write-Host "✅ Login successful" -ForegroundColor Green
    Write-Host "   User ID: $($loginResponse.user.id)" -ForegroundColor White
    Write-Host "   Email: $($loginResponse.user.email)" -ForegroundColor White
    Write-Host "   Role: $($loginResponse.user.role)" -ForegroundColor White
    Write-Host "   Token: $($loginResponse.token.Substring(0, 20))..." -ForegroundColor White
    
    $AUTH_TOKEN = $loginResponse.token
    
} catch {
    Write-Host "❌ Failed to login" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
    exit 1
}

# Step 4: Verify user can access protected dashboard endpoint
Write-Host "`n🏠 STEP 4: Testing dashboard access..." -ForegroundColor Cyan
try {
    $headers = @{
        "Authorization" = "Bearer $AUTH_TOKEN"
    }
    
    $userResponse = Invoke-RestMethod `
        -Uri "$BASE_URL/api/users/current" `
        -Method GET `
        -Headers $headers
    
    Write-Host "✅ Dashboard access successful" -ForegroundColor Green
    Write-Host "   Current User: $($userResponse.email)" -ForegroundColor White
    Write-Host "   Role: $($userResponse.role)" -ForegroundColor White
    
} catch {
    Write-Host "❌ Failed to access dashboard" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
Write-Host "✅ All tests passed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Test Flow Completed:" -ForegroundColor Yellow
Write-Host "  1. ✅ OTP Generated" -ForegroundColor Green
Write-Host "  2. ✅ OTP Verified" -ForegroundColor Green
Write-Host "  3. ✅ Login with OTP-verified flag" -ForegroundColor Green
Write-Host "  4. ✅ Dashboard access with auth token" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  - Open browser to http://localhost:5174" -ForegroundColor White
Write-Host "  - Login with email: $TEST_EMAIL" -ForegroundColor White
Write-Host "  - Request OTP and verify navigation" -ForegroundColor White
Write-Host ""

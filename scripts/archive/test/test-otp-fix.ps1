# Test OTP Fix - Verify all changes work correctly
# Run this script to test the complete OTP flow

$testEmail = "harshayarlagadda2@gmail.com"
$baseUrl = "http://localhost:3001"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  OTP AUTHENTICATION FIX TEST" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: Check remaining attempts BEFORE generating OTP
Write-Host "[Test 1] Checking remaining attempts (should be 3)..." -ForegroundColor Yellow
try {
    $response1 = Invoke-RestMethod -Uri "$baseUrl/api/otp/remaining-attempts/$testEmail" -Method GET
    Write-Host "✓ Remaining attempts: $($response1.remainingAttempts)" -ForegroundColor Green
    
    if ($response1.remainingAttempts -ne 3) {
        Write-Host "✗ FAILED: Expected 3 attempts, got $($response1.remainingAttempts)" -ForegroundColor Red
    } else {
        Write-Host "✓ PASSED: Correct remaining attempts" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n" -NoNewline

# Test 2: Generate OTP
Write-Host "[Test 2] Generating OTP..." -ForegroundColor Yellow
try {
    $body = @{
        email = $testEmail
        type = "login"
    } | ConvertTo-Json
    
    $response2 = Invoke-RestMethod -Uri "$baseUrl/api/otp/generate" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✓ OTP generated successfully" -ForegroundColor Green
    Write-Host "  OTP Code: $($response2.code)" -ForegroundColor Cyan
    Write-Host "  Expires at: $($response2.expiresAt)" -ForegroundColor Gray
    $otpCode = $response2.code
    
    Write-Host "✓ PASSED: OTP generation successful" -ForegroundColor Green
} catch {
    Write-Host "✗ FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n" -NoNewline

# Test 3: Check remaining attempts AFTER generating OTP (should still be 3)
Write-Host "[Test 3] Checking remaining attempts after generation (should be 3)..." -ForegroundColor Yellow
try {
    Start-Sleep -Seconds 1 # Wait for DB commit
    $response3 = Invoke-RestMethod -Uri "$baseUrl/api/otp/remaining-attempts/$testEmail" -Method GET
    Write-Host "✓ Remaining attempts: $($response3.remainingAttempts)" -ForegroundColor Green
    
    if ($response3.remainingAttempts -ne 3) {
        Write-Host "✗ FAILED: Expected 3 attempts, got $($response3.remainingAttempts)" -ForegroundColor Red
    } else {
        Write-Host "✓ PASSED: Remaining attempts still at 3 (not decremented)" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n" -NoNewline

# Test 4: Validate with WRONG OTP (should decrease attempts)
Write-Host "[Test 4] Validating with WRONG OTP (should decrease attempts)..." -ForegroundColor Yellow
try {
    $wrongBody = @{
        email = $testEmail
        otpCode = "999999"
        tokenType = "email"
    } | ConvertTo-Json
    
    $response4 = Invoke-RestMethod -Uri "$baseUrl/api/otp/validate" -Method POST -Body $wrongBody -ContentType "application/json"
    Write-Host "✓ Validation response received" -ForegroundColor Green
    Write-Host "  Valid: $($response4.isValid)" -ForegroundColor Gray
    Write-Host "  Remaining: $($response4.remainingAttempts)" -ForegroundColor Gray
    
    if ($response4.isValid -eq $false -and $response4.remainingAttempts -eq 2) {
        Write-Host "✓ PASSED: Wrong code rejected, attempts decremented to 2" -ForegroundColor Green
    } else {
        Write-Host "✗ FAILED: Expected isValid=false and remainingAttempts=2" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n" -NoNewline

# Test 5: Validate with CORRECT OTP
Write-Host "[Test 5] Validating with CORRECT OTP..." -ForegroundColor Yellow
try {
    $correctBody = @{
        email = $testEmail
        otpCode = $otpCode
        tokenType = "email"
    } | ConvertTo-Json
    
    $response5 = Invoke-RestMethod -Uri "$baseUrl/api/otp/validate" -Method POST -Body $correctBody -ContentType "application/json"
    Write-Host "✓ Validation response received" -ForegroundColor Green
    Write-Host "  Valid: $($response5.isValid)" -ForegroundColor Gray
    
    if ($response5.isValid -eq $true) {
        Write-Host "✓ PASSED: Correct OTP validated successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ FAILED: Expected isValid=true" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Check the backend console for OTP code logging." -ForegroundColor Yellow
Write-Host "All fixes have been applied:" -ForegroundColor Green
Write-Host "  ✓ Remaining attempts endpoint fixed" -ForegroundColor Green
Write-Host "  ✓ OTP code logging added to backend" -ForegroundColor Green
Write-Host "  ✓ Email service dev mode detection fixed" -ForegroundColor Green
Write-Host "  ✓ Frontend debug logging added" -ForegroundColor Green

Write-Host "`nNow test the full flow in the browser at:" -ForegroundColor Cyan
Write-Host "  http://localhost:5173/login`n" -ForegroundColor White

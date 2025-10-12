# Simple OTP Test
$BASE_URL = "http://localhost:3001"
$TEST_EMAIL = "datta.rajesh@gmail.com"

Write-Host "Generating OTP..." -ForegroundColor Cyan
$generatePayload = @{
    email = $TEST_EMAIL
    type = "login"
} | ConvertTo-Json

$generateResponse = Invoke-RestMethod `
    -Uri "$BASE_URL/api/otp/generate" `
    -Method POST `
    -Body $generatePayload `
    -ContentType "application/json"

Write-Host "OTP Code: $($generateResponse.code)" -ForegroundColor Green

$OTP_CODE = $generateResponse.code

Write-Host "Verifying OTP..." -ForegroundColor Cyan
$verifyPayload = @{
    email = $TEST_EMAIL
    otpCode = $OTP_CODE
    type = "login"
} | ConvertTo-Json

$verifyResponse = Invoke-RestMethod `
    -Uri "$BASE_URL/api/otp/validate" `
    -Method POST `
    -Body $verifyPayload `
    -ContentType "application/json"

Write-Host "OTP Valid: $($verifyResponse.isValid)" -ForegroundColor Green

Write-Host "Logging in..." -ForegroundColor Cyan
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

    Write-Host "Login Success!" -ForegroundColor Green
    Write-Host "User: $($loginResponse.user.email)" -ForegroundColor White
    Write-Host "Role: $($loginResponse.user.role)" -ForegroundColor White
} catch {
    Write-Host "Login Failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

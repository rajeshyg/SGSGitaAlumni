# Test just the current user profile endpoint

Write-Host "Testing current user profile endpoint..." -ForegroundColor Yellow

# Login first
$loginBody = @{
    email = "datta.rajesh@gmail.com"
    password = "Admin123!"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$authToken = $loginResponse.token

# Test current user profile
$headers = @{
    "Authorization" = "Bearer $authToken"
}

$profileResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/users/profile" -Method GET -Headers $headers
Write-Host "Current user profile:" -ForegroundColor Cyan
$profileResponse | ConvertTo-Json -Depth 10 | Write-Host

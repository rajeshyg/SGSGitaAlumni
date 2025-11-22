# Test Family Members API

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FAMILY MEMBERS API TEST" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# First, login to get a token
Write-Host "1. Logging in..." -ForegroundColor Yellow
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"test@example.com","password":"password123"}' `
  -ErrorAction SilentlyContinue

if ($loginResponse.token) {
  Write-Host "✅ Login successful!" -ForegroundColor Green
  $token = $loginResponse.token
  $headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
  }
  
  # Test 1: Get all family members
  Write-Host "`n2. Getting all family members..." -ForegroundColor Yellow
  $members = Invoke-RestMethod -Uri "http://localhost:3001/api/family-members" `
    -Method GET `
    -Headers $headers
  
  Write-Host "✅ Found $($members.data.Count) family member(s)" -ForegroundColor Green
  $members.data | ForEach-Object {
    Write-Host "   - $($_.display_name) ($($_.relationship)) - Access: $($_.can_access_platform)" -ForegroundColor White
  }
  
  # Test 2: Create a new family member (child)
  Write-Host "`n3. Creating a new family member (child)..." -ForegroundColor Yellow
  $newMember = @{
    firstName = "TestChild"
    lastName = "Yarlagadda"
    displayName = "Test Child"
    birthDate = "2012-05-15"
    relationship = "child"
  } | ConvertTo-Json
  
  $createResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/family-members" `
    -Method POST `
    -Headers $headers `
    -Body $newMember
  
  if ($createResponse.success) {
    Write-Host "✅ Family member created!" -ForegroundColor Green
    Write-Host "   ID: $($createResponse.data.id)" -ForegroundColor White
    Write-Host "   Name: $($createResponse.data.display_name)" -ForegroundColor White
    Write-Host "   Age: $($createResponse.data.current_age)" -ForegroundColor White
    Write-Host "   Requires consent: $($createResponse.data.requires_parent_consent)" -ForegroundColor White
    Write-Host "   Can access: $($createResponse.data.can_access_platform)" -ForegroundColor White
    
    $childId = $createResponse.data.id
    
    # Test 3: Grant parent consent
    if ($createResponse.data.requires_parent_consent) {
      Write-Host "`n4. Granting parent consent..." -ForegroundColor Yellow
      $consentResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/family-members/$childId/consent/grant" `
        -Method POST `
        -Headers $headers
      
      if ($consentResponse.success) {
        Write-Host "✅ Consent granted!" -ForegroundColor Green
        Write-Host "   Can access now: $($consentResponse.data.can_access_platform)" -ForegroundColor White
        Write-Host "   Status: $($consentResponse.data.status)" -ForegroundColor White
      }
    }
    
    # Test 4: Switch to child profile
    Write-Host "`n5. Switching to child profile..." -ForegroundColor Yellow
    $switchResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/family-members/$childId/switch" `
      -Method POST `
      -Headers $headers
    
    if ($switchResponse.success) {
      Write-Host "✅ Profile switched!" -ForegroundColor Green
      Write-Host "   Active profile: $($switchResponse.data.display_name)" -ForegroundColor White
    }
    
    # Test 5: Get updated family members list
    Write-Host "`n6. Getting updated family members list..." -ForegroundColor Yellow
    $updatedMembers = Invoke-RestMethod -Uri "http://localhost:3001/api/family-members" `
      -Method GET `
      -Headers $headers
    
    Write-Host "✅ Total family members: $($updatedMembers.data.Count)" -ForegroundColor Green
    $updatedMembers.data | ForEach-Object {
      Write-Host "   - $($_.display_name) ($($_.relationship)) - Access: $($_.can_access_platform)" -ForegroundColor White
    }
    
    # Test 6: Get access logs
    Write-Host "`n7. Getting access logs..." -ForegroundColor Yellow
    $logs = Invoke-RestMethod -Uri "http://localhost:3001/api/family-members/logs/access" `
      -Method GET `
      -Headers $headers
    
    Write-Host "✅ Found $($logs.data.Count) access log(s)" -ForegroundColor Green
    $logs.data | Select-Object -First 3 | ForEach-Object {
      Write-Host "   - $($_.display_name): $($_.access_type) at $($_.access_timestamp)" -ForegroundColor White
    }
  }
  
  Write-Host "`n========================================" -ForegroundColor Cyan
  Write-Host "ALL TESTS COMPLETED SUCCESSFULLY! ✅" -ForegroundColor Green
  Write-Host "========================================`n" -ForegroundColor Cyan
  
} else {
  Write-Host "❌ Login failed!" -ForegroundColor Red
  Write-Host "Response: $loginResponse" -ForegroundColor Red
}

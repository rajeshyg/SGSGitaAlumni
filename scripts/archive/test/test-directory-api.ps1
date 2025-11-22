# Test Alumni Directory API
# Make sure server is running: npm run dev

Write-Host "Testing Alumni Directory API..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Basic pagination
Write-Host "Test 1: Basic Pagination (page=1, perPage=5)" -ForegroundColor Yellow
curl "http://localhost:3001/api/alumni/directory?page=1&perPage=5" -UseBasicParsing | ConvertFrom-Json | ConvertTo-Json -Depth 5
Write-Host ""

# Test 2: Search
Write-Host "Test 2: Search by name" -ForegroundColor Yellow
curl "http://localhost:3001/api/alumni/directory?q=John&page=1&perPage=5" -UseBasicParsing | ConvertFrom-Json | ConvertTo-Json -Depth 5
Write-Host ""

# Test 3: Sort by year
Write-Host "Test 3: Sort by graduation year" -ForegroundColor Yellow
curl "http://localhost:3001/api/alumni/directory?sortBy=graduationYear&sortOrder=desc&page=1&perPage=5" -UseBasicParsing | ConvertFrom-Json | ConvertTo-Json -Depth 5
Write-Host ""

Write-Host "✓ API tests complete!" -ForegroundColor Green

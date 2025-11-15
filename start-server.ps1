# Start the server in a new PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; node server.js"
Write-Host "Server starting in new window..."
Start-Sleep -Seconds 5
Write-Host "Testing server health..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -Method GET
    Write-Host "✅ Server is running!" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "❌ Server not responding" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

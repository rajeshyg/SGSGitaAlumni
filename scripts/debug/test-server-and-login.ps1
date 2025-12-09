# Start server in background using cmd
Start-Process -FilePath "cmd" -ArgumentList "/c","cd /d c:\React-Projects\SGSGitaAlumni && npm run server" -WindowStyle Hidden

Write-Host "Waiting for server to start..."
Start-Sleep -Seconds 8

Write-Host "Testing login..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"datta.rajesh@gmail.com","password":"Admin123!"}' -UseBasicParsing
    Write-Host "Status: $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
}

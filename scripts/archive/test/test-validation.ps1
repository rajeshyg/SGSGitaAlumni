try {
    $response = Invoke-WebRequest 'http://localhost:3001/api/invitations/validate/test-token-123' -Method GET -TimeoutSec 10
    Write-Output "Status: $($response.StatusCode)"
    Write-Output "Content: $($response.Content)"
} catch {
    Write-Output "Error: $($_.Exception.Message)"
}
try {
    $response = Invoke-WebRequest 'http://localhost:3001/api/auth/register-from-invitation' -Method POST -Body '{"invitationToken":"test-token-123","additionalData":{}}' -ContentType 'application/json' -TimeoutSec 10
    Write-Output "Status: $($response.StatusCode)"
    Write-Output "Content: $($response.Content)"
} catch {
    Write-Output "Error: $($_.Exception.Message)"
}
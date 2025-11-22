# PowerShell script to create a fresh invitation
Write-Host "Creating fresh invitation..." -ForegroundColor Cyan
node create-fresh-invitation.js
Write-Host "`nPress any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

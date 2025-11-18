# ============================================================================
# CLEANUP SCRIPT: Remove test user sankarijv@gmail.com
# ============================================================================
# Run this script to clean up all database records for the test user
# so you can retry the invitation acceptance flow.

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Test User Cleanup Script" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will remove all data for: sankarijv@gmail.com" -ForegroundColor Yellow
Write-Host ""
Write-Host "Records to be cleaned:" -ForegroundColor White
Write-Host "  - User accounts (app_users)" -ForegroundColor Gray
Write-Host "  - Family member records" -ForegroundColor Gray
Write-Host "  - User preferences" -ForegroundColor Gray
Write-Host "  - OTP tokens" -ForegroundColor Gray
Write-Host "  - Invitations (reset to pending)" -ForegroundColor Gray
Write-Host ""

$confirmation = Read-Host "Are you sure you want to proceed? (yes/no)"

if ($confirmation -ne "yes") {
    Write-Host ""
    Write-Host "❌ Cleanup cancelled" -ForegroundColor Red
    Write-Host ""
    exit 0
}

Write-Host ""
Write-Host "🚀 Running cleanup script..." -ForegroundColor Green
Write-Host ""

try {
    # Run the Node.js cleanup script
    node scripts/cleanup-sankari-test-user.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "=========================================" -ForegroundColor Green
        Write-Host "✅ Cleanup completed successfully!" -ForegroundColor Green
        Write-Host "=========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "You can now:" -ForegroundColor Cyan
        Write-Host "  1. Resend invitation (if needed)" -ForegroundColor White
        Write-Host "  2. Accept invitation with fresh registration" -ForegroundColor White
        Write-Host "  3. Test the complete flow" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "❌ Cleanup script failed with exit code: $LASTEXITCODE" -ForegroundColor Red
        Write-Host ""
        exit $LASTEXITCODE
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error running cleanup script:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    exit 1
}

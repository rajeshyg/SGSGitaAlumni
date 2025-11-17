# ============================================================================
# Database Restore Script for COPPA Migration
# ============================================================================
# Purpose: Restore database from backup if migration fails
# Usage: .\scripts\database\restore-database.ps1 <backup-file>
# Example: .\scripts\database\restore-database.ps1 backups\coppa-backup-2025-11-16_120000.sql
# ============================================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile
)

Write-Host "Starting Database Restore..." -ForegroundColor Cyan
Write-Host ""

# Check if backup file exists
if (-not (Test-Path $BackupFile)) {
    Write-Host "[ERROR] Backup file not found: $BackupFile" -ForegroundColor Red
    exit 1
}

# Load environment variables
if (-not (Test-Path .env)) {
    Write-Host "[ERROR] .env file not found!" -ForegroundColor Red
    exit 1
}

# Parse .env file
$envContent = Get-Content .env | Where-Object { $_ -notmatch '^#' -and $_ -match '=' }
$envVars = @{}
foreach ($line in $envContent) {
    $parts = $line -split '=', 2
    if ($parts.Count -eq 2) {
        $envVars[$parts[0].Trim()] = $parts[1].Trim()
    }
}

$DB_HOST = $envVars['DB_HOST']
$DB_USER = $envVars['DB_USER']
$DB_PASSWORD = $envVars['DB_PASSWORD']
$DB_NAME = $envVars['DB_NAME']
$DB_PORT = if ($envVars['DB_PORT']) { $envVars['DB_PORT'] } else { '3306' }

Write-Host "Restore Details:" -ForegroundColor Yellow
Write-Host "   Database: $DB_NAME"
Write-Host "   Host: $DB_HOST"
Write-Host "   Backup File: $BackupFile"
Write-Host ""

# Confirm restore
$confirmation = Read-Host "WARNING: This will restore the database from backup. Continue? (yes/no)"
if ($confirmation -ne "yes") {
    Write-Host "Restore cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Restoring database..." -ForegroundColor Cyan

$env:MYSQL_PWD = $DB_PASSWORD
$restoreCmd = "mysql -h $DB_HOST -P $DB_PORT -u $DB_USER $DB_NAME < `"$BackupFile`""

try {
    Invoke-Expression $restoreCmd
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Database restored successfully!" -ForegroundColor Green
        Write-Host ""
    } else {
        throw "mysql returned exit code $LASTEXITCODE"
    }
} catch {
    Write-Host ""
    Write-Host "[ERROR] Restore failed: $_" -ForegroundColor Red
    exit 1
} finally {
    Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue
}

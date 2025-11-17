# ============================================================================
# Database Backup Script for COPPA Migration
# ============================================================================
# Purpose: Create a full backup before running migration
# Usage: .\scripts\database\backup-database.ps1
# ============================================================================

Write-Host "Starting Database Backup..." -ForegroundColor Cyan
Write-Host ""

# Load environment variables
if (-not (Test-Path .env)) {
    Write-Host "[ERROR] .env file not found!" -ForegroundColor Red
    Write-Host "Please create .env file with database credentials"
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

if (-not $DB_HOST -or -not $DB_USER -or -not $DB_PASSWORD -or -not $DB_NAME) {
    Write-Host "[ERROR] Missing database credentials in .env file" -ForegroundColor Red
    exit 1
}

# Create backup directory
$backupDir = "backups"
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}

# Generate backup filename with timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$backupFile = "$backupDir\coppa-backup-$timestamp.sql"

Write-Host "Backup Details:" -ForegroundColor Yellow
Write-Host "   Database: $DB_NAME"
Write-Host "   Host: $DB_HOST"
Write-Host "   File: $backupFile"
Write-Host ""

# Check if mysqldump is available
$mysqldump = Get-Command mysqldump -ErrorAction SilentlyContinue
if (-not $mysqldump) {
    Write-Host "[ERROR] mysqldump not found in PATH" -ForegroundColor Red
    Write-Host "Please install MySQL client tools or add to PATH"
    exit 1
}

# Backup critical tables for COPPA migration
Write-Host "Backing up FAMILY_MEMBERS and app_users tables..." -ForegroundColor Cyan

$env:MYSQL_PWD = $DB_PASSWORD
$backupCmd = "mysqldump -h $DB_HOST -P $DB_PORT -u $DB_USER --no-tablespaces --single-transaction --routines --triggers $DB_NAME FAMILY_MEMBERS app_users FAMILY_ACCESS_LOG > `"$backupFile`""

try {
    Invoke-Expression $backupCmd
    
    if ($LASTEXITCODE -eq 0) {
        $fileSize = (Get-Item $backupFile).Length / 1KB
        Write-Host ""
        Write-Host "Backup completed successfully!" -ForegroundColor Green
        Write-Host "   File: $backupFile" -ForegroundColor Green
        Write-Host "   Size: $([math]::Round($fileSize, 2)) KB" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next Steps:" -ForegroundColor Yellow
        Write-Host "   1. Keep this backup file safe"
        Write-Host "   2. Run migration: node scripts\database\run-migration.js scripts\database\migrations\create-coppa-compliance-tables.sql"
        Write-Host "   3. If needed, restore: mysql -h $DB_HOST -u $DB_USER -p $DB_NAME < $backupFile"
        Write-Host ""
    } else {
        throw "mysqldump returned exit code $LASTEXITCODE"
    }
} catch {
    Write-Host ""
    Write-Host "[ERROR] Backup failed: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "   1. Verify database credentials in .env"
    Write-Host "   2. Check network connection to database"
    Write-Host "   3. Ensure mysqldump is installed and in PATH"
    exit 1
} finally {
    Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue
}

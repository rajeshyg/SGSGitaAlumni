# ============================================================================
# Safe COPPA Migration Deployment Script with Backup
# ============================================================================
# Purpose: Safely deploy COPPA compliance with automatic backup and rollback
# Usage: .\deploy-coppa-safe.ps1
# ============================================================================

Write-Host "🚀 COPPA Compliance Safe Deployment Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check prerequisites
Write-Host "Step 1: Checking prerequisites..." -ForegroundColor Yellow

if (-not (Test-Path .env)) {
    Write-Host "[ERROR] .env file not found!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path scripts\database\run-migration.js)) {
    Write-Host "[ERROR] Migration runner not found!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path scripts\database\migrations\create-coppa-compliance-tables.sql)) {
    Write-Host "[ERROR] Migration SQL file not found!" -ForegroundColor Red
    exit 1
}

Write-Host "   [OK] All files present" -ForegroundColor Green
Write-Host ""

# Step 2: Create backup
Write-Host "Step 2: Creating database backup..." -ForegroundColor Yellow
Write-Host ""

& .\scripts\database\backup-database.ps1

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Backup failed! Aborting migration." -ForegroundColor Red
    exit 1
}

Write-Host "   [OK] Backup created successfully" -ForegroundColor Green
Write-Host ""

# Step 3: Run migration
Write-Host "Step 3: Running COPPA migration..." -ForegroundColor Yellow
Write-Host ""

node scripts\database\run-migration.js scripts\database\migrations\create-coppa-compliance-tables.sql

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ERROR] Migration failed!" -ForegroundColor Red
    Write-Host ""
    $rollback = Read-Host "Do you want to rollback? (yes/no)"
    
    if ($rollback -eq "yes") {
        Write-Host ""
        Write-Host "Rolling back migration..." -ForegroundColor Yellow
        node scripts\database\run-migration.js scripts\database\migrations\rollback-coppa-compliance-tables.sql
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] Rollback successful" -ForegroundColor Green
        } else {
            Write-Host "[ERROR] Rollback failed! Manual intervention required." -ForegroundColor Red
            Write-Host "Latest backup is in backups\ folder" -ForegroundColor Yellow
        }
    }
    
    exit 1
}

Write-Host "   [OK] Migration completed successfully" -ForegroundColor Green
Write-Host ""

# Step 4: Verify migration
Write-Host "Step 4: Verifying migration..." -ForegroundColor Yellow
Write-Host ""

# Parse .env for database connection
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

# Verify tables exist
$env:MYSQL_PWD = $DB_PASSWORD
$verifyCmd = @"
SHOW TABLES LIKE 'PARENT_CONSENT%';
SHOW TABLES LIKE 'AGE_VERIFICATION%';
SELECT COUNT(*) as consent_records FROM PARENT_CONSENT_RECORDS;
SELECT COUNT(*) as audit_records FROM AGE_VERIFICATION_AUDIT;
"@

$verifyCmd | mysql -h $DB_HOST -P $DB_PORT -u $DB_USER $DB_NAME

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "   [OK] Tables verified successfully" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "   [WARNING] Could not verify tables" -ForegroundColor Yellow
}

Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "COPPA MIGRATION COMPLETED!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "   - Backup created in backups\ folder"
Write-Host "   - PARENT_CONSENT_RECORDS table created"
Write-Host "   - AGE_VERIFICATION_AUDIT table created"
Write-Host "   - Existing consent data migrated"
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Start the server: npm start"
Write-Host "   2. Review documentation: docs\COPPA_COMPLIANCE_COMPLETE.md"
Write-Host "   3. Run tests according to testing guide"
Write-Host ""
Write-Host "Rollback Instructions (if needed):" -ForegroundColor Yellow
Write-Host "   - Automated: node scripts\database\run-migration.js scripts\database\migrations\rollback-coppa-compliance-tables.sql"
Write-Host "   - Manual: .\scripts\database\restore-database.ps1 <backup-file>"
Write-Host ""

# Install Alumni Directory Database Indexes
# Run this script to add performance indexes to the alumni_members table

$env:MYSQL_PWD="2FvT6j06sfI"

Write-Host "Installing Alumni Directory Indexes..." -ForegroundColor Cyan
Write-Host "Database: sgsbg-app-db.cj88ledblqs8.us-east-1.rds.amazonaws.com" -ForegroundColor Yellow
Write-Host ""

# Check if mysql is available
if (!(Get-Command mysql -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: MySQL client not found. Please install MySQL client first." -ForegroundColor Red
    Write-Host "Download from: https://dev.mysql.com/downloads/mysql/" -ForegroundColor Yellow
    exit 1
}

# Run the SQL script
Get-Content scripts/database/add-directory-indexes.sql | mysql -h sgsbg-app-db.cj88ledblqs8.us-east-1.rds.amazonaws.com -u sgsgita_alumni_user sgsgita_alumni

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Indexes installed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Verifying indexes..." -ForegroundColor Cyan
    
    # Verify indexes were created
    "SHOW INDEX FROM alumni_members;" | mysql -h sgsbg-app-db.cj88ledblqs8.us-east-1.rds.amazonaws.com -u sgsgita_alumni_user sgsgita_alumni
    
    Write-Host ""
    Write-Host "Installation complete!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Failed to install indexes" -ForegroundColor Red
    exit 1
}

Remove-Item Env:\MYSQL_PWD

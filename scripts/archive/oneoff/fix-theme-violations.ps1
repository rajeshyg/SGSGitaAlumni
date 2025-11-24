# Theme Violation Fix Script
# Systematically replaces hardcoded color utilities with theme variables

$files = @(
    "src/components/AdditionalInfoForm.tsx",
    "src/components/admin/AdminHelpers.tsx",
    "src/components/admin/AlumniMemberManagement.tsx",
    "src/components/admin/AnalyticsDashboard.tsx",
    "src/components/admin/AppUserManagement.tsx",
    "src/components/dashboard/QualityDashboard.tsx",
    "src/components/monitoring/MonitoringDashboard.tsx",
    "src/components/performance/ContinuousPerformanceDashboard.tsx",
    "src/components/performance/PerformanceDashboard.tsx"
)

# Define replacement mappings
$replacements = @{
    # Text colors
    'text-gray-900' = 'text-foreground'
    'text-gray-800' = 'text-foreground'
    'text-gray-700' = 'text-foreground'
    'text-gray-600' = 'text-muted-foreground'
    'text-gray-500' = 'text-muted-foreground'
    'text-gray-400' = 'text-muted-foreground'
    
    # Background colors
    'bg-gray-50' = 'bg-muted'
    'bg-gray-100' = 'bg-muted'
    'bg-gray-200' = 'bg-muted'
    'bg-gray-400' = 'bg-muted-foreground/40'
    'bg-white' = 'bg-background'
    
    # Border colors
    'border-gray-200' = 'border-border'
    'border-gray-300' = 'border-border'
    
    # Blue colors (primary)
    'text-blue-600' = 'text-primary'
    'text-blue-700' = 'text-primary'
    'text-blue-800' = 'text-primary'
    'text-blue-900' = 'text-foreground'
    'bg-blue-50' = 'bg-primary/5'
    'bg-blue-100' = 'bg-primary/10'
    'bg-blue-600' = 'bg-primary'
    'bg-blue-700' = 'bg-primary/90'
    'border-blue-200' = 'border-primary/20'
    
    # Red colors (destructive)
    'text-red-500' = 'text-destructive'
    'text-red-600' = 'text-destructive'
    'text-red-700' = 'text-destructive'
    'text-red-800' = 'text-destructive'
    'bg-red-50' = 'bg-destructive/5'
    'bg-red-100' = 'bg-destructive/10'
    'bg-red-600' = 'bg-destructive'
    'border-red-200' = 'border-destructive/20'
    
    # Green colors (success)
    'text-green-600' = 'text-green-700 dark:text-green-400'
    'bg-green-600' = 'bg-green-600 dark:bg-green-700'
    
    # Yellow colors (warning)
    'text-yellow-600' = 'text-yellow-700 dark:text-yellow-400'
    'bg-yellow-600' = 'bg-yellow-600 dark:bg-yellow-700'
    
    # Purple colors
    'text-purple-600' = 'text-purple-600 dark:text-purple-400'
    'bg-purple-600' = 'bg-purple-600 dark:bg-purple-700'
}

Write-Host "Starting theme violation fixes..." -ForegroundColor Cyan

foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot "..\$file"
    
    if (Test-Path $fullPath) {
        Write-Host "`nProcessing: $file" -ForegroundColor Yellow
        $content = Get-Content $fullPath -Raw
        $originalContent = $content
        $changes = 0
        
        foreach ($key in $replacements.Keys) {
            $value = $replacements[$key]
            if ($content -match [regex]::Escape($key)) {
                $content = $content -replace [regex]::Escape($key), $value
                $changes++
            }
        }
        
        if ($content -ne $originalContent) {
            Set-Content -Path $fullPath -Value $content -NoNewline
            Write-Host "  ✓ Fixed $changes violations" -ForegroundColor Green
        } else {
            Write-Host "  - No violations found" -ForegroundColor Gray
        }
    } else {
        Write-Host "`nFile not found: $file" -ForegroundColor Red
    }
}

Write-Host "`n✓ Theme violation fixes complete!" -ForegroundColor Green
Write-Host "Run 'node scripts/validate-theme-compliance.js' to verify." -ForegroundColor Cyan

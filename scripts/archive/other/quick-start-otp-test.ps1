# ============================================================================
# QUICK START GUIDE - Passwordless Authentication Testing
# ============================================================================

Write-Host "`n🔐 Passwordless Authentication - Quick Start Testing" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan

# ============================================================================
# STEP 1: CHECK PREREQUISITES
# ============================================================================

Write-Host "`n📋 Step 1: Checking Prerequisites..." -ForegroundColor Yellow

# Check if .env file exists
if (Test-Path ".env") {
    Write-Host "✅ .env file found" -ForegroundColor Green
    
    # Check for required environment variables
    $envContent = Get-Content ".env" -Raw
    
    $requiredVars = @(
        "SMTP_PROVIDER",
        "EMAIL_FROM",
        "OTP_LENGTH",
        "OTP_EXPIRY_MINUTES"
    )
    
    $missingVars = @()
    foreach ($var in $requiredVars) {
        if ($envContent -notmatch "$var=") {
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -gt 0) {
        Write-Host "⚠️  Missing environment variables:" -ForegroundColor Yellow
        $missingVars | ForEach-Object { Write-Host "   - $_" -ForegroundColor Yellow }
    } else {
        Write-Host "✅ All required environment variables configured" -ForegroundColor Green
    }
} else {
    Write-Host "❌ .env file not found" -ForegroundColor Red
    Write-Host "   Creating .env from .env.example..." -ForegroundColor Yellow
    
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✅ .env file created" -ForegroundColor Green
        Write-Host "   ⚠️  Please configure SMTP settings in .env file" -ForegroundColor Yellow
    } else {
        Write-Host "❌ .env.example not found" -ForegroundColor Red
        exit 1
    }
}

# Check if node_modules exists
if (Test-Path "node_modules") {
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Dependencies not installed" -ForegroundColor Yellow
    Write-Host "   Running npm install..." -ForegroundColor Yellow
    npm install
}

# ============================================================================
# STEP 2: START SERVERS
# ============================================================================

Write-Host "`n🚀 Step 2: Starting Development Servers..." -ForegroundColor Yellow

# Kill existing node processes
Write-Host "   Stopping existing servers..." -ForegroundColor Gray
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force
    Write-Host "   ✅ Stopped existing Node.js processes" -ForegroundColor Green
}

Write-Host "`n   Starting servers in new windows..." -ForegroundColor Gray
Write-Host "   - Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "   - Frontend: http://localhost:5173" -ForegroundColor Cyan

# Start backend server in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host '🔧 Backend Server' -ForegroundColor Cyan; node server.js"

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Start frontend dev server in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host '💻 Frontend Dev Server' -ForegroundColor Cyan; npm run dev"

Write-Host "   ✅ Servers started in separate windows" -ForegroundColor Green

# ============================================================================
# STEP 3: CREATE TEST INVITATION
# ============================================================================

Write-Host "`n📧 Step 3: Creating Test Invitation..." -ForegroundColor Yellow

Start-Sleep -Seconds 5  # Wait for servers to be fully ready

if (Test-Path "create-fresh-invitation.js") {
    Write-Host "   Running invitation creation script..." -ForegroundColor Gray
    $invitationOutput = node create-fresh-invitation.js 2>&1
    
    # Extract invitation token from output
    $invitationToken = $invitationOutput | Select-String -Pattern "Invitation Token: ([a-f0-9-]+)" | ForEach-Object { $_.Matches.Groups[1].Value }
    
    if ($invitationToken) {
        Write-Host "   ✅ Invitation created successfully" -ForegroundColor Green
        Write-Host "`n   🔗 Invitation URL:" -ForegroundColor Cyan
        Write-Host "   http://localhost:5173/invitation/$invitationToken" -ForegroundColor White
        
        # Copy to clipboard
        "http://localhost:5173/invitation/$invitationToken" | Set-Clipboard
        Write-Host "   📋 URL copied to clipboard!" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Could not extract invitation token" -ForegroundColor Yellow
        Write-Host "   Please check the output above for the invitation URL" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️  create-fresh-invitation.js not found" -ForegroundColor Yellow
    Write-Host "   Please create an invitation manually through the admin panel" -ForegroundColor Yellow
}

# ============================================================================
# STEP 4: TESTING INSTRUCTIONS
# ============================================================================

Write-Host "`n📝 Step 4: Testing Instructions" -ForegroundColor Yellow
Write-Host "=" * 70 -ForegroundColor Gray

Write-Host "`n🧪 Test Scenario 1: New User Registration with OTP" -ForegroundColor Cyan
Write-Host "   1. Open the invitation URL (copied to clipboard)" -ForegroundColor White
Write-Host "   2. Click 'Join Alumni Network'" -ForegroundColor White
Write-Host "   3. Check console for OTP code (development mode)" -ForegroundColor White
Write-Host "   4. Enter OTP on verification page" -ForegroundColor White
Write-Host "   5. Verify redirect to dashboard" -ForegroundColor White

Write-Host "`n🧪 Test Scenario 2: Passwordless Login" -ForegroundColor Cyan
Write-Host "   1. Navigate to http://localhost:5173/login" -ForegroundColor White
Write-Host "   2. Click 'Sign in without password'" -ForegroundColor White
Write-Host "   3. Enter email address" -ForegroundColor White
Write-Host "   4. Click 'Send Verification Code'" -ForegroundColor White
Write-Host "   5. Check console for OTP code" -ForegroundColor White
Write-Host "   6. Enter OTP on verification page" -ForegroundColor White
Write-Host "   7. Verify redirect to dashboard" -ForegroundColor White

Write-Host "`n🔍 Where to Find OTP Codes (Development Mode):" -ForegroundColor Cyan
Write-Host "   - Check the backend server terminal window" -ForegroundColor White
Write-Host "   - Look for: '📧 [EmailService] OTP EMAIL (Development Mode)'" -ForegroundColor White
Write-Host "   - OTP Code will be displayed in the output" -ForegroundColor White

Write-Host "`n🐛 Troubleshooting:" -ForegroundColor Cyan
Write-Host "   - Check server terminal windows for errors" -ForegroundColor White
Write-Host "   - Verify .env configuration" -ForegroundColor White
Write-Host "   - Check browser console (F12) for frontend errors" -ForegroundColor White
Write-Host "   - View detailed setup guide:" -ForegroundColor White
Write-Host "     docs/progress/phase-7/PASSWORDLESS_AUTH_SETUP_GUIDE.md" -ForegroundColor Gray

# ============================================================================
# STEP 5: DATABASE VERIFICATION
# ============================================================================

Write-Host "`n🗄️  Step 5: Database Verification (Optional)" -ForegroundColor Yellow

Write-Host "   To verify OTP in database, run:" -ForegroundColor Gray
Write-Host @"
   
   -- Check latest OTP tokens
   SELECT * FROM OTP_TOKENS 
   WHERE email = 'your-email@example.com' 
   ORDER BY created_at DESC 
   LIMIT 5;
   
   -- Check if OTP is valid
   SELECT 
       otp_code,
       expires_at,
       expires_at > NOW() as is_valid,
       attempt_count,
       is_used
   FROM OTP_TOKENS 
   WHERE email = 'your-email@example.com'
   ORDER BY created_at DESC 
   LIMIT 1;
"@ -ForegroundColor DarkGray

# ============================================================================
# COMPLETION
# ============================================================================

Write-Host "`n✅ Quick Start Setup Complete!" -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Green

Write-Host "`n📚 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Test the invitation flow using the URL above" -ForegroundColor White
Write-Host "   2. Test passwordless login" -ForegroundColor White
Write-Host "   3. Configure production email service (SendGrid/AWS SES)" -ForegroundColor White
Write-Host "   4. Review setup guide for advanced configuration" -ForegroundColor White

Write-Host "`n🔗 Useful URLs:" -ForegroundColor Cyan
Write-Host "   - Frontend:  http://localhost:5173" -ForegroundColor White
Write-Host "   - Backend:   http://localhost:5000" -ForegroundColor White
Write-Host "   - API Docs:  docs/API_ENDPOINTS.md" -ForegroundColor White
Write-Host "   - Setup Guide: docs/progress/phase-7/PASSWORDLESS_AUTH_SETUP_GUIDE.md" -ForegroundColor White

Write-Host "`n" -ForegroundColor White

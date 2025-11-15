# Network Testing Setup for Chat Module
# Date: November 11, 2025
# This script helps you test the chat module on multiple devices in the same wifi network

Write-Host "🔍 Finding your IP address..." -ForegroundColor Cyan

# Get network adapters and find the active one
$networkAdapters = Get-NetAdapter | Where-Object { $_.Status -eq "Up" }

foreach ($adapter in $networkAdapters) {
    $ipAddresses = Get-NetIPAddress -InterfaceIndex $adapter.InterfaceIndex -AddressFamily IPv4

    foreach ($ip in $ipAddresses) {
        if ($ip.IPAddress -notlike "127.*" -and $ip.IPAddress -notlike "169.*") {
            Write-Host "✅ Found network IP: $($ip.IPAddress)" -ForegroundColor Green
            Write-Host "📱 Access your app from other devices using: http://$($ip.IPAddress):3001" -ForegroundColor Yellow
            Write-Host "💻 Frontend will be available at: http://$($ip.IPAddress):5173" -ForegroundColor Yellow
            Write-Host ""
            $foundIP = $ip.IPAddress
            break
        }
    }
    if ($foundIP) { break }
}

if (-not $foundIP) {
    Write-Host "❌ Could not find a suitable network IP address" -ForegroundColor Red
    Write-Host "💡 Make sure you're connected to a wifi network" -ForegroundColor Yellow
    exit 1
}

Write-Host "🚀 Starting server for network testing..." -ForegroundColor Green
Write-Host "📝 Server will be accessible from other devices on your network" -ForegroundColor Cyan
Write-Host "🔄 Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the development server
npm run dev
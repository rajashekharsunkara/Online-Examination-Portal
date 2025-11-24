Write-Host "========================================" -ForegroundColor Cyan
Write-Host "REINITIALIZING DATABASE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop any running Node.js servers
Write-Host "Step 1: Stopping any running servers..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
    Write-Host "Servers stopped successfully." -ForegroundColor Green
} else {
    Write-Host "No servers were running." -ForegroundColor Gray
}
Write-Host ""
Start-Sleep -Seconds 3

# Step 2: Delete old database if exists
Write-Host "Step 2: Removing old database..." -ForegroundColor Yellow
if (Test-Path "exam_portal.db") {
    Remove-Item "exam_portal.db" -Force
    Write-Host "Old database deleted." -ForegroundColor Green
} else {
    Write-Host "No existing database found." -ForegroundColor Gray
}
Write-Host ""

# Step 3: Recreate database
Write-Host "Step 3: Creating new database structure..." -ForegroundColor Yellow
node recreate-database.js
Write-Host ""

# Wait a moment for database to be fully created
Write-Host "Waiting for database initialization to complete..." -ForegroundColor Gray
Start-Sleep -Seconds 3

Write-Host "========================================" -ForegroundColor Green
Write-Host "DATABASE INITIALIZED SUCCESSFULLY" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Step 4: Starting servers..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Student Portal: " -NoNewline; Write-Host "http://localhost:3000" -ForegroundColor Yellow
Write-Host "Admin Portal:   " -NoNewline; Write-Host "http://localhost:3001" -ForegroundColor Yellow
Write-Host ""
Write-Host "Admin Credentials:" -ForegroundColor Magenta
Write-Host "  Username: admin" -ForegroundColor White
Write-Host "  Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the servers" -ForegroundColor Gray
Write-Host ""

# Start both servers
node start-both.js

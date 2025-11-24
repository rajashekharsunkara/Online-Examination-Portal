Write-Host "========================================" -ForegroundColor Cyan
Write-Host "INDIA SKILLS 2025 - DATABASE SETUP" -ForegroundColor Cyan
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

# Step 3: Create database with India Skills 2025 data
Write-Host "Step 3: Creating database with India Skills 2025 data..." -ForegroundColor Yellow
Write-Host "  - 48 Trades" -ForegroundColor Cyan
Write-Host "  - 26 Districts" -ForegroundColor Cyan
Write-Host "  - Multiple Centers per district" -ForegroundColor Cyan
Write-Host "  - Test students for first 10 trades" -ForegroundColor Cyan
Write-Host ""
node populate-india-skills-data.js
Write-Host ""

# Wait a moment for database to be fully created
Write-Host "Waiting for database initialization to complete..." -ForegroundColor Gray
Start-Sleep -Seconds 2

# Step 4: Upload existing question sets
Write-Host ""
Write-Host "Step 4: Uploading existing question sets..." -ForegroundColor Yellow
node upload-question-sets.js
Write-Host ""

Start-Sleep -Seconds 1

# Step 5: Generate questions for all trades
Write-Host "Step 5: Generating questions for all 48 trades..." -ForegroundColor Yellow
node generate-all-questions.js
Write-Host ""

# Wait a moment
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "Step 6: Starting servers..." -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "ALL 48 TRADES READY WITH QUESTIONS!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Student Portal: " -NoNewline; Write-Host "http://localhost:3000" -ForegroundColor Yellow
Write-Host "Admin Portal:   " -NoNewline; Write-Host "http://localhost:3001" -ForegroundColor Yellow
Write-Host ""
Write-Host "Test Login:" -ForegroundColor Magenta
Write-Host "  Admit Card: 2025SRI0001" -ForegroundColor White
Write-Host "  DOB: 2000-01-15" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the servers" -ForegroundColor Gray
Write-Host ""

# Start both servers
node start-both.js

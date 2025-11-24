@echo off
echo ========================================
echo INDIA SKILLS 2025 - DATABASE SETUP
echo ========================================
echo.

REM Step 1: Kill all existing Node.js servers
echo Step 1: Stopping any running servers...
taskkill /F /IM node.exe 2>nul
if %errorlevel% equ 0 (
    echo Servers stopped successfully.
) else (
    echo No servers were running.
)
echo.
timeout /t 3 /nobreak > nul

REM Step 2: Delete old database if exists
echo Step 2: Removing old database...
if exist exam_portal.db (
    del exam_portal.db
    echo Old database deleted.
) else (
    echo No existing database found.
)
echo.

REM Step 3: Create database with India Skills 2025 data
echo Step 3: Creating database with India Skills 2025 data...
echo   - 48 Trades
echo   - 26 Districts
echo   - Multiple Centers per district
echo   - Test students for first 10 trades
echo.
node populate-india-skills-data.js
echo.

REM Wait a moment for database to be fully created
echo Waiting for database initialization to complete...
timeout /t 2 /nobreak > nul

REM Step 4: Upload existing question sets
echo Step 4: Uploading existing question sets...
node upload-question-sets.js
echo.

timeout /t 1 /nobreak > nul

REM Step 5: Generate questions for remaining trades
echo Step 5: Generating questions for all 48 trades...
node generate-all-questions.js
echo.

REM Wait a moment
timeout /t 2 /nobreak > nul

echo.
echo Step 6: Starting servers...
echo.
echo ========================================
echo ALL 48 TRADES READY WITH QUESTIONS!
echo ========================================
echo.
echo Student Portal: http://localhost:3000
echo Admin Portal:   http://localhost:3001
echo.
echo Test Login:
echo   Admit Card: 2025SRI0001
echo   DOB: 2000-01-15
echo.
echo Press Ctrl+C to stop the servers
echo.

REM Start both servers
node start-both.js

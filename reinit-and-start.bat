@echo off
echo ========================================
echo REINITIALIZING DATABASE
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

REM Step 3: Recreate database
echo Step 3: Creating new database structure...
node recreate-database.js
echo.

REM Wait a moment for database to be fully created
echo Waiting for database initialization to complete...
timeout /t 3 /nobreak > nul

echo ========================================
echo DATABASE INITIALIZED SUCCESSFULLY
echo ========================================
echo.
echo Step 4: Starting servers...
echo.
echo Student Portal: http://localhost:3000
echo Admin Portal:   http://localhost:3001
echo.
echo Admin Credentials:
echo   Username: admin
echo   Password: admin123
echo.
echo Press Ctrl+C to stop the servers
echo.

REM Start both servers
node start-both.js

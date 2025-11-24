@echo off
cls
echo ========================================
echo ONLINE EXAMINATION PORTAL - SETUP
echo ========================================
echo.

REM Check if database exists
if not exist exam_portal.db (
    echo Database not found. Creating new database...
    echo.
    node recreate-database.js
    echo.
    timeout /t 2 /nobreak > nul
) else (
    echo Database found. Checking if reinitialization is needed...
    echo.
    choice /C YN /M "Do you want to reinitialize the database (this will delete all data)"
    if errorlevel 2 goto :start_servers
    if errorlevel 1 (
        echo.
        echo Deleting old database...
        del exam_portal.db
        echo Creating new database...
        node recreate-database.js
        echo.
        timeout /t 2 /nobreak > nul
    )
)

:start_servers
echo ========================================
echo STARTING SERVERS
echo ========================================
echo.
echo Student Portal will be available at: http://localhost:3000
echo Admin Portal will be available at: http://localhost:3001
echo.
echo Press Ctrl+C to stop the servers
echo.

node start-both.js

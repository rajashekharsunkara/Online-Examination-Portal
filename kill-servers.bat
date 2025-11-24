@echo off
echo Stopping existing Node.js servers...
echo.

REM Kill all node processes
taskkill /F /IM node.exe 2>nul

if %errorlevel% equ 0 (
    echo All Node.js processes stopped.
) else (
    echo No Node.js processes found running.
)

echo.
timeout /t 2 /nobreak > nul
echo Ready to start fresh!

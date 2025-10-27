@echo off
echo Starting India Skills Examination Portal...
echo.
start "Student Server" cmd /k "node student-server.js"
timeout /t 2 /nobreak > nul
start "Admin Server" cmd /k "node admin-server.js"
echo.
echo Both servers are starting in separate windows...
echo Student Portal: http://localhost:3000
echo Admin Portal: http://localhost:3001
echo.
pause

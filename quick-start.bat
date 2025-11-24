@echo off
taskkill /F /IM node.exe 2>nul & timeout /t 3 /nobreak > nul & del exam_portal.db 2>nul & node recreate-database.js & timeout /t 2 /nobreak > nul & echo. & echo Starting servers... & echo Student: http://localhost:3000 & echo Admin: http://localhost:3001 & echo. & node start-both.js

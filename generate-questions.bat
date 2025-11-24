@echo off
echo ========================================
echo GENERATE QUESTIONS FOR ALL TRADES
echo ========================================
echo.
echo This will generate 30 questions for each trade
echo that doesn't already have question sets.
echo.
echo Total: 48 trades = 1,440 questions
echo.
pause
echo.
node generate-all-questions.js
echo.
pause

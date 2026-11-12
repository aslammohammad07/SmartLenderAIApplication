@echo off
title SmartLenderAI Launcher
echo ========================================================
echo   SmartLenderAI - Enterprise Loan Prediction System
echo ========================================================
echo Starting Backend and Frontend servers...

start "SmartLenderAI Backend (Flask Port 5000)" cmd /k "cd /d %~dp0backend && python app.py"
start "SmartLenderAI Frontend (Vite Port 3000)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Servers started in separate windows:
echo   - Backend:  http://127.0.0.1:5000
echo   - Frontend: http://localhost:3000
echo.
echo Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul
start http://localhost:3000

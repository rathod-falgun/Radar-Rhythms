@echo off
title Brahmaputra FloodWatch - NASA Space Apps 2026
color 0B
echo =====================================================================
echo       BRAHMAPUTRA FLOODWATCH - NASA SPACE APPS CHALLENGE 2026
echo             "Dancing with the SARs" Multi-Temporal Radar
echo =====================================================================
echo.
echo [1/3] Starting FastAPI Backend on http://127.0.0.1:8005 ...
start "Brahmaputra FloodWatch Backend" cmd /k "cd /d \"%~dp0backend\" && python -m uvicorn app.main:app --host 127.0.0.1 --port 8005 --reload"

echo [2/3] Starting Vite Frontend on http://localhost:5173 ...
start "Brahmaputra FloodWatch Frontend" cmd /k "cd /d \"%~dp0frontend\" && npm run dev"

echo [3/3] Waiting 4 seconds for servers to initialize...
timeout /t 4 /nobreak >nul

echo.
echo Launching your browser to http://localhost:5173 ...
start http://localhost:5173

echo.
echo =====================================================================
echo System is running!
echo - Frontend UI:  http://localhost:5173
echo - Backend API:  http://127.0.0.1:8005
echo - API Docs:     http://127.0.0.1:8005/docs
echo =====================================================================
echo.
echo To stop the servers, simply close the opened command windows.
pause


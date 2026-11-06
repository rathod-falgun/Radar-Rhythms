# Brahmaputra FloodWatch - Unified PowerShell Launcher
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "      BRAHMAPUTRA FLOODWATCH - NASA SPACE APPS CHALLENGE 2026" -ForegroundColor Cyan
Write-Host "            'Dancing with the SARs' Multi-Temporal Radar" -ForegroundColor Yellow
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

$workspace = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "[1/3] Starting FastAPI Backend on http://127.0.0.1:8001 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$workspace\backend'; python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload"

Write-Host "[2/3] Starting Vite Frontend on http://localhost:5173 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$workspace\frontend'; npm run dev"

Write-Host "[3/3] Waiting 4 seconds for servers to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 4

Write-Host "Launching default browser to http://localhost:5173 ..." -ForegroundColor Cyan
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "System is running!" -ForegroundColor Green
Write-Host "- Frontend UI:  http://localhost:5173" -ForegroundColor White
Write-Host "- Backend API:  http://127.0.0.1:8001" -ForegroundColor White
Write-Host "- API Docs:     http://127.0.0.1:8001/docs" -ForegroundColor White
Write-Host "=====================================================================" -ForegroundColor Cyan


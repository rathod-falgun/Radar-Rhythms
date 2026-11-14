@echo off
echo Starting Radar Rhythms FastAPI Backend on port 8005...
cd /d "%~dp0backend"
if exist ".venv\Scripts\python.exe" (
    ".venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8005 --reload
) else (
    python -m uvicorn app.main:app --host 127.0.0.1 --port 8005 --reload
)
pause

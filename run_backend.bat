@echo off
echo Starting Brahmaputra FloodWatch FastAPI Backend...
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause

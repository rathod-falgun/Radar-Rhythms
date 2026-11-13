@echo off
echo Starting Brahmaputra FloodWatch FastAPI Backend on port 8005...
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8005 --reload
pause


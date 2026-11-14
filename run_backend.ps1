Write-Host "Starting Radar Rhythms FastAPI Backend on port 8005..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot\backend"
$pythonExe = if (Test-Path ".\.venv\Scripts\python.exe") { ".\.venv\Scripts\python.exe" } else { "python" }
& $pythonExe -m uvicorn app.main:app --host 127.0.0.1 --port 8005 --reload

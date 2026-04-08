@echo off
echo 🚀 Starting VaultPay Full Stack Application
echo ==========================================

REM Check if models exist
if not exist "models\RandomForest_model.pkl" (
    echo ⚠️ Models not found. Training models first...
    python train.py
)

echo ✅ Starting Flask Backend on http://localhost:5000
start python backend.py

REM Wait for backend to start
timeout /t 2 /nobreak

cd frontend

echo ✅ Installing frontend dependencies (if needed)...
call npm install --silent

echo ✅ Starting React Frontend on http://localhost:3000
start npm start

echo.
echo ==========================================
echo 🎉 VaultPay is running!
echo ==========================================
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5000
echo ==========================================

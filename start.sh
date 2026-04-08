#!/bin/bash

echo "🚀 Starting VaultPay Full Stack Application"
echo "=========================================="

# Check if models exist
if [ ! -f "models/RandomForest_model.pkl" ]; then
    echo "⚠️  Models not found. Training models first..."
    python train.py
fi

echo "✅ Starting Flask Backend on http://localhost:5000"
python backend.py &
BACKEND_PID=$!

# Wait for backend to start
sleep 2

cd frontend

echo "✅ Installing frontend dependencies (if needed)..."
npm install --silent 2>/dev/null || true

echo "✅ Starting React Frontend on http://localhost:3000"
npm start &
FRONTEND_PID=$!

echo ""
echo "=========================================="
echo "🎉 VaultPay is running!"
echo "=========================================="
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo "=========================================="

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID

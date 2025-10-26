#!/bin/bash

# TurfSpot - Quick Start Script

echo "🚀 Starting TurfSpot Application..."
echo ""

# Check if backend is running
if lsof -Pi :4000 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Backend is running on port 4000"
else
    echo "⚠️  Backend is not running!"
    echo "Starting backend..."
    cd backend
    npm start &
    cd ..
    sleep 5
fi

# Start frontend server
echo ""
echo "🌐 Starting Frontend Server..."
cd frontend
python3 -m http.server 3000 &
FRONTEND_PID=$!

echo ""
echo "✨ TurfSpot is ready!"
echo ""
echo "📍 Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:4000/api"
echo ""
echo "👤 Default Login Credentials:"
echo "   Admin:"
echo "     Email: admin@turfspot.com"
echo "     Password: admin123456"
echo ""
echo "   Test Owner:"
echo "     Email: owner1@example.com"
echo "     Password: password123"
echo ""
echo "   Test User:"
echo "     Email: user1@example.com"
echo "     Password: password123"
echo ""
echo "🛑 Press Ctrl+C to stop the servers"
echo ""

# Wait for interrupt
trap "echo ''; echo 'Stopping servers...'; kill $FRONTEND_PID; exit" INT
wait

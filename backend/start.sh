#!/bin/bash

# TurfSpot Backend Quick Start Script

echo "🚀 TurfSpot Backend Quick Start"
echo "================================"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

echo "✅ Dependencies installed"
echo ""

# Check if admin user needs to be created
echo "🔐 Do you want to create an admin user? (y/n)"
read -r create_admin

if [ "$create_admin" = "y" ]; then
    echo "Creating admin user..."
    node src/scripts/createAdmin.js
    echo ""
fi

# Check if sample data should be seeded
echo "📊 Do you want to seed sample data? (y/n)"
read -r seed_data

if [ "$seed_data" = "y" ]; then
    echo "Seeding sample data..."
    node src/scripts/seedData.js
    echo ""
fi

echo "🎯 Starting server in development mode..."
echo ""
npm run dev

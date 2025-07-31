#!/bin/bash

# Simple development setup script for the voting application

echo "🚀 Starting Voting Application"
echo "=============================="

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Build the frontend
echo "🔨 Building frontend..."
npm run build

# Check if server dependencies are installed
echo "🔧 Checking server dependencies..."
cd ../server
if [ ! -d "node_modules" ]; then
    echo "📦 Installing server dependencies..."
    npm install
fi

# Start the server
echo "🌟 Starting server..."
echo "📡 Server will run on http://localhost:5000"
echo "=============================="

npm run dev

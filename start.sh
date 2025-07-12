#!/bin/bash

# Start script for CargoRepo with client build
echo "🚀 Starting CargoRepo with client build..."

# Check if client build exists
if [ ! -d "client/dist" ]; then
    echo "📦 Building client first..."
    cd client && npm run build && cd ..
fi

# Start the server
echo "🌐 Starting server on port 8000..."
npm run dev 
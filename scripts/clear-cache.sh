#!/bin/bash

# LogiGoFast - Complete Cache Clear Script

echo "🧹 LogiGoFast Cache Cleaning Started..."

# Stop any running processes
echo "⏹️ Stopping running processes..."
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "tsx server" 2>/dev/null || true

# Clean all cache directories
echo "🗑️ Removing cache directories..."
rm -rf node_modules
rm -rf dist
rm -rf .vite
rm -rf node_modules/.vite
rm -rf .cache

# Clean package lock
echo "📦 Removing package-lock.json..."
rm -rf package-lock.json

# Clean npm cache
echo "🔄 Clearing npm cache..."
npm cache clean --force

# Fresh install
echo "⬇️ Fresh npm install..."
npm install

echo "✅ Cache clearing completed!"
echo ""
echo "📋 Next steps:"
echo "1. Close all browser tabs"
echo "2. Clear browser cache (Ctrl+Shift+R)"
echo "3. Run: npm run dev"
echo "4. Open fresh browser tab: http://localhost:5000"
echo ""
echo "🎉 You should now see the latest UI!"
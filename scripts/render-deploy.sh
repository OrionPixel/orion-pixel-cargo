#!/bin/bash

# LogiGoFast - Render Deployment Script
echo "🚀 Starting LogiGoFast deployment to Render..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "🔧 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit: LogiGoFast platform for Render deployment"
    git branch -M main
fi

# Check for remote
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "❌ Error: No git remote 'origin' found."
    echo "Please add your GitHub repository URL:"
    echo "git remote add origin https://github.com/yourusername/logigofast-platform.git"
    exit 1
fi

# Push to GitHub
echo "📤 Pushing code to GitHub..."
git add .
git commit -m "Deploy: Updated LogiGoFast platform for Render" || echo "No changes to commit"
git push origin main

echo "✅ Code pushed to GitHub successfully!"
echo ""
echo "📋 Next steps for Render deployment:"
echo "1. Go to https://render.com and login"
echo "2. Click 'New +' and select 'Web Service'"
echo "3. Connect your GitHub repository"
echo "4. Use these settings:"
echo "   - Build Command: npm install && npm run build"
echo "   - Start Command: npm run start"
echo "   - Node Version: 20.x"
echo ""
echo "5. Add these environment variables:"
echo "   - NODE_ENV=production"
echo "   - DATABASE_URL=<your_postgresql_connection_string>"
echo "   - SESSION_SECRET=<generate_64_char_random_string>"
echo "   - PORT=10000"
echo ""
echo "6. Create PostgreSQL database and connect it"
echo "7. After deployment, run: npm run db:push in Render shell"
echo ""
echo "🎉 Your LogiGoFast platform will be live at: https://your-app-name.onrender.com"
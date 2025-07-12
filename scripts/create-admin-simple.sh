#!/bin/bash

# Simple Admin Creation Script using Registration API
# Usage: ./scripts/create-admin-simple.sh <email> <password>

EMAIL="$1"
PASSWORD="$2"

if [ -z "$EMAIL" ] || [ -z "$PASSWORD" ]; then
    echo "❌ Usage: ./scripts/create-admin-simple.sh <email> <password>"
    echo "📋 Example: ./scripts/create-admin-simple.sh admin@company.com mypassword123"
    exit 1
fi

echo "🚀 Creating admin user: $EMAIL"

# Step 1: Register user
echo "📝 Step 1: Registering user..."
RESPONSE=$(curl -s -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"firstName\": \"Admin\", 
    \"lastName\": \"User\",
    \"password\": \"$PASSWORD\",
    \"phone\": \"9876543210\",
    \"subscriptionPlan\": \"enterprise\"
  }")

USER_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$USER_ID" ]; then
    echo "❌ User registration failed"
    echo "Response: $RESPONSE"
    exit 1
fi

echo "✅ User created with ID: $USER_ID"

# Step 2: Update role to admin using SQL
echo "👑 Step 2: Setting admin role..."
echo "UPDATE users SET role = 'admin', subscription_status = 'active' WHERE email = '$EMAIL';" | psql "$DATABASE_URL"

echo "✅ Admin user created successfully!"
echo "📧 Email: $EMAIL"
echo "🔐 Password: [HIDDEN]"
echo "👑 Role: admin"
echo "🔑 Ready to login"
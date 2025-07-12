#!/usr/bin/env node

/**
 * Admin User Creation Script
 * Creates admin user with custom email and password
 * Usage: node scripts/create-admin.js <email> <password> [custom-database-url]
 */

import { neon } from "@neondatabase/serverless";
import bcrypt from "bcrypt";
import crypto from "node:crypto";

// Get command line arguments
const email = process.argv[2];
const password = process.argv[3];
const customDatabaseUrl =
  "postgresql://neondb_owner:npg_m2wRI3bXezuT@ep-lingering-cloud-a1xte3yr-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

if (!email || !password) {
  console.error(
    "❌ Usage: node scripts/create-admin.js <email> <password> [custom-database-url]",
  );
  console.error(
    "📋 Example: node scripts/create-admin.js admin@company.com mypassword123",
  );
  console.error(
    "📋 With custom DB: node scripts/create-admin.js admin@company.com mypassword123 postgresql://...",
  );
  process.exit(1);
}

// Use custom database URL if provided
const databaseUrl = customDatabaseUrl || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ No database URL found!");
  console.error(
    "💡 Provide as third argument or set DATABASE_URL environment variable",
  );
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error("❌ Invalid email format");
  process.exit(1);
}

// Validate password strength
if (password.length < 6) {
  console.error("❌ Password must be at least 6 characters long");
  process.exit(1);
}

async function createAdmin() {
  console.log("🚀 Starting Admin User Creation...");
  console.log("📧 Email:", email);
  console.log("🔐 Password: [HIDDEN]");

  try {
    // Initialize database connection
    const sql = neon(databaseUrl);
    console.log("🗄️ Database connected successfully");
    console.log("🔗 Using database:", databaseUrl.substring(0, 50) + "...");

    // Check if user already exists
    const existingUser = await sql`
      SELECT id, email FROM users WHERE email = ${email}
    `;

    if (existingUser.length > 0) {
      console.error("❌ Admin user already exists with this email");
      process.exit(1);
    }

    // Generate unique ID
    let userId;
    try {
      userId = crypto.randomUUID();
    } catch (error) {
      // Fallback UUID generation
      const timestamp = Date.now().toString(16);
      const random = Math.random().toString(16).substring(2, 14);
      userId = `${timestamp}-${random}`;
    }

    // Hash password
    console.log("🔐 Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create admin user (using hashedPassword field instead of password)
    console.log("👤 Creating admin user...");
    const result = await sql`
      INSERT INTO users (
        id, email, hashed_password, first_name, last_name, role, 
        subscription_plan, subscription_status, is_active, 
        created_at, updated_at
      ) VALUES (
        ${userId}, ${email}, ${hashedPassword}, 'Admin', 'User', 'admin',
        'enterprise', 'active', true, 
        NOW(), NOW()
      )
      RETURNING id, email, role
    `;

    // Create default theme settings for admin
    console.log("🎨 Creating default theme settings...");
    await sql`
      INSERT INTO user_theme_settings (
        user_id, primary_color, secondary_color, accent_color, 
        created_at, updated_at
      ) VALUES (
        ${userId}, '#3094d1', '#e7a293', '#cbdc65',
        NOW(), NOW()
      )
    `;

    console.log("✅ Admin user created successfully!");
    console.log("📋 User Details:", result[0]);
    console.log("🌟 Role: admin");
    console.log("🎯 Status: active");
    console.log("🔑 Login credentials ready");
  } catch (error) {
    console.error("❌ Admin creation failed:", error.message);
    process.exit(1);
  }
}

// Run the script
createAdmin();

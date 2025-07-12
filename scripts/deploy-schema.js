#!/usr/bin/env node

/**
 * Production Database Schema Deployment Script
 * Pushes Drizzle schema to production database
 * Usage: node scripts/deploy-schema.js [custom-database-url]
 */

import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Get custom database URL from command line argument
const customDatabaseUrl =
  "postgresql://neondb_owner:npg_m2wRI3bXezuT@ep-lingering-cloud-a1xte3yr-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const databaseUrl = customDatabaseUrl || process.env.DATABASE_URL;

console.log("🚀 Starting Production Database Schema Deployment...");
console.log("📋 Database URL:", databaseUrl ? "Connected" : "Not Found");

if (!databaseUrl) {
  console.error("❌ No database URL provided!");
  console.error(
    "💡 Usage: node scripts/deploy-schema.js [custom-database-url]",
  );
  console.error("💡 Or set DATABASE_URL environment variable");
  process.exit(1);
}

// Set the database URL for drizzle-kit
if (customDatabaseUrl) {
  process.env.DATABASE_URL = customDatabaseUrl;
  console.log("🔄 Using custom database URL");
}

try {
  // Change to project root directory
  process.chdir(path.join(__dirname, ".."));

  console.log("📦 Installing dependencies...");
  execSync("npm install", { stdio: "inherit" });

  console.log("🔄 Pushing schema to production database...");
  execSync("npx drizzle-kit push", { stdio: "inherit" });

  console.log("✅ Schema deployment completed successfully!");
  console.log("🎯 All tables have been created in production database");
} catch (error) {
  console.error("❌ Schema deployment failed:", error.message);
  process.exit(1);
}

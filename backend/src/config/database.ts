import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../../../shared/schema";

// Configure Neon for Replit deployment environment
const isReplit = process.env.REPLIT_URL || process.env.REPL_SLUG;
if (process.env.NODE_ENV === 'development' || isReplit) {
  neonConfig.webSocketConstructor = ws;
  // Use fetch for queries to avoid WebSocket connection issues in Replit/development
  neonConfig.poolQueryViaFetch = true;
  // Replit deployment fix - disable pipelining for better compatibility
  neonConfig.pipelineConnect = false;
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create connection pool with Replit production compatibility
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 3, // Reduced for Replit deployment
  min: 1,
  idleTimeoutMillis: 20000,
  connectionTimeoutMillis: 10000, // Increased timeout for Replit
});

// Add error handling for pool
pool.on('error', (err) => {
  console.error('Database pool error:', err);
  // Don't exit process on pool errors in development
  if (process.env.NODE_ENV !== 'development') {
    process.exit(1);
  }
});

export const db = drizzle({ client: pool, schema });
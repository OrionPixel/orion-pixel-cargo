import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon for Replit deployment environment
const isReplit = process.env.REPLIT_URL || process.env.REPL_SLUG;
const isRender = process.env.RENDER_SERVICE_NAME || process.env.RENDER;

// Enhanced Neon configuration for production stability
neonConfig.webSocketConstructor = ws;

// Force fetch for all environments to ensure compatibility
neonConfig.poolQueryViaFetch = true;
neonConfig.fetchConnectionCache = true;
neonConfig.pipelineConnect = false;

// Additional production configurations
if (isRender) {
  // Render-specific optimizations
  neonConfig.fetchEndpoint = (host, port, opts) => {
    return `https://${host}:${port}/sql`;
  };
  
  // Add connection retry logic
  neonConfig.fetchFunction = async (input: any, init?: any) => {
    const maxRetries = 3;
    let lastError: any;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(input, {
          ...init,
          timeout: 15000,
          headers: {
            ...init?.headers,
            'User-Agent': 'LogiGoFast-Render-App'
          }
        });
        
        if (response.ok) {
          return response;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error: any) {
        lastError = error;
        console.log(`🔄 Database connection attempt ${i + 1}/${maxRetries} failed:`, error?.message || error);
        
        if (i < maxRetries - 1) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }
    
    throw lastError;
  };
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Enhanced connection pool with Neon serverless compatibility
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: isRender ? 8 : 3, // Increased for better throughput in Render
  min: 2, // Keep minimum connections alive
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000,
  // Enhanced configuration for Neon serverless
  application_name: 'LogiGoFast_Production',
  // Removed search_path option - not supported by Neon serverless
  // Add retry configuration for production
  ...(isRender && {
    query_timeout: 45000,
    statement_timeout: 45000,
    keepalive: true,
    keepaliveInitialDelayMillis: 10000,
  })
});

// Add error handling for pool
pool.on('error', (err: any) => {
  console.error('❌ Database pool error:', err);
  console.error('Error details:', {
    code: err?.code || 'unknown',
    message: err?.message || 'Unknown error',
    stack: err?.stack,
    timestamp: new Date().toISOString()
  });
  // Don't exit process on pool errors in development
  if (process.env.NODE_ENV !== 'development') {
    console.error('🚨 Production database error - attempting graceful handling');
    // In production, try to recover instead of crashing
    setTimeout(() => {
      console.log('♻️ Attempting database connection recovery...');
    }, 5000);
  }
});

// Add connection event logging for production debugging
pool.on('connect', (client) => {
  console.log('✅ Database connection established');
});

pool.on('remove', (client) => {
  console.log('🔌 Database connection removed from pool');
});

// Export database with explicit schema configuration
export const db = drizzle({ 
  client: pool, 
  schema,
  // Add explicit schema configuration for Neon serverless
  ...(isRender && {
    logger: process.env.NODE_ENV === 'development' ? true : false,
  })
});

// Add database health check function
export async function checkDatabaseConnection() {
  try {
    const result = await pool.query('SELECT current_database(), current_schema(), current_user');
    console.log('✅ Database connection verified:', result.rows[0]);
    
    // Check if financial tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('salary_payments', 'income_records', 'vehicle_expenses', 'toll_expenses', 'client_ledger')
      ORDER BY table_name
    `);
    console.log('✅ Financial tables found:', tablesResult.rows.map(r => r.table_name));
    
    return true;
  } catch (error) {
    console.error('❌ Database connection check failed:', error);
    return false;
  }
}
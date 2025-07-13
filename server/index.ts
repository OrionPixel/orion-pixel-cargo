import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { initializeEventHub } from "./eventHub.js";

// Remove top-level vite imports to prevent bundling in production
// const { setupVite, serveStatic, log } = await import("./vite");

const app = express();

// Production-ready CORS configuration for Render and Replit
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Production environments detection
  const isRender = process.env.RENDER_SERVICE_NAME || process.env.RENDER || process.env.RENDER_EXTERNAL_URL;
  const isReplit = process.env.REPLIT_URL || process.env.REPL_SLUG;
  const isProduction = process.env.NODE_ENV === 'production';
  
  console.log('🌍 CORS Request:', { origin, isRender: !!isRender, isReplit: !!isReplit, isProduction });
  
  let allowedOrigins = ['http://localhost:5000', 'http://localhost:3000'];
  
  if (isRender) {
    // Add comprehensive Render domain patterns
    allowedOrigins.push('https://cargorepo-4.onrender.com');
    allowedOrigins.push('https://*.onrender.com');
    // CRITICAL: Add LogiGoFast domain for frontend domain mismatch fix
    allowedOrigins.push('https://www.logigofast.com');
    allowedOrigins.push('http://www.logigofast.com');
    allowedOrigins.push('https://logigofast.com');
    allowedOrigins.push('http://logigofast.com');
    if (process.env.RENDER_EXTERNAL_URL) {
      allowedOrigins.push(process.env.RENDER_EXTERNAL_URL);
    }
    console.log('🚀 Render environment detected, CORS configured for production with LogiGoFast domains');
  }
  
  if (isReplit) {
    // Add Replit domain patterns
    allowedOrigins.push('https://*.replit.dev');
    allowedOrigins.push('https://*.replit.co');
    if (process.env.REPLIT_URL) {
      allowedOrigins.push(process.env.REPLIT_URL);
    }
  }
  
  // EMERGENCY PRODUCTION CORS FIX: Allow all origins for domain mismatch recovery
  const allowOrigin = isProduction && origin ? 
    (allowedOrigins.some(allowed => 
      allowed === origin || 
      (allowed.includes('*') && origin.includes(allowed.replace('*', ''))) ||
      origin.includes('onrender.com') ||
      origin.includes('logigofast.com')
    ) ? origin : '*') : // Allow all in emergency mode
    (origin || '*');
  
  if (allowOrigin) {
    res.header('Access-Control-Allow-Origin', allowOrigin);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie, Set-Cookie, Cache-Control');
  res.header('Access-Control-Expose-Headers', 'Set-Cookie');
  res.header('Vary', 'Origin');
  
  if (req.method === 'OPTIONS') {
    console.log('🎯 CORS Preflight handled for:', req.path);
    return res.sendStatus(200);
  }
  
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      // Use console.log instead of imported log function
      console.log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize database connection and health check
  const { checkDatabaseConnection } = await import("./db.js");
  console.log('🔍 Checking database connection and schema...');
  const dbHealthy = await checkDatabaseConnection();
  if (!dbHealthy) {
    console.error('❌ Database connection failed - some features may not work properly');
  }
  
  const server = await registerRoutes(app);
  
  // Initialize WebSocket Event Hub for real-time updates
  console.log('🚀 Initializing EventHub WebSocket server...');
  initializeEventHub(server);
  console.log('✅ EventHub WebSocket server initialized');

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    
    // Log errors for debugging
    console.error('Server error:', err);
  });

  // Production environment detection and logging
  const isProduction = process.env.NODE_ENV === 'production';
  const isRender = process.env.RENDER_SERVICE_NAME || process.env.RENDER;
  
  console.log('🌍 Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    isProduction,
    isRender,
    PORT: process.env.PORT,
    HOST: process.env.HOST
  });

  // CRITICAL: Production server configuration with proper port and host binding
  const PORT = process.env.PORT || 5000;
  const HOST = '0.0.0.0'; // Must be 0.0.0.0 for Render deployment
  
  console.log(`🚀 Starting server configuration:`, {
    PORT: PORT,
    HOST: HOST,
    isProduction: isProduction,
    isRender: isRender
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (!isProduction) {
    console.log('🛠️ Development mode: Setting up Vite');
    try {
      const { setupVite } = await import("./vite.js");
      await setupVite(app, server);
    } catch (error) {
      console.error('❌ Failed to setup Vite:', error);
      // Fallback to static serving
      try {
        const { serveStatic } = await import("./static.js");
        serveStatic(app);
      } catch (staticError) {
        console.error('❌ Failed to serve static files:', staticError);
      }
    }
  } else {
    console.log('🚀 Production mode: Serving static files');
    try {
      const { serveStatic } = await import("./static.js");
      serveStatic(app);
      console.log('✅ Static files served successfully');
    } catch (error) {
      console.error('❌ Static file serving failed:', error);
      // In production, if static files fail, serve a simple fallback
      app.use("*", (_req, res) => {
        res.status(200).send(`
          <!DOCTYPE html>
          <html>
            <head><title>Loading...</title></head>
            <body>
              <div id="root">Loading application...</div>
              <script>console.log('Fallback HTML served');</script>
            </body>
          </html>
        `);
      });
    }
  }

  // Critical: Use the PORT and HOST variables configured above
  server.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on ${HOST}:${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 WebSocket endpoints: /events, /ws, /socket.io/`);
    
    if (isRender) {
      console.log(`🌐 Render Production URL: https://cargorepo-4.onrender.com`);
      console.log(`✅ Production server ready for Financial Reports!`);
    }
    if (process.env.RENDER_EXTERNAL_URL) {
      console.log(`🌐 Render URL: ${process.env.RENDER_EXTERNAL_URL}`);
    }
    if (process.env.REPLIT_URL) {
      console.log(`🌐 Replit URL: ${process.env.REPLIT_URL}`);
    }
  });
})();

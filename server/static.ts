import express, { type Express } from "express";
import fs from "fs";
import path from "path";

const isProduction = process.env.NODE_ENV === 'production';

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, '../client/dist');

  if (!fs.existsSync(distPath)) {
    console.error(`❌ Client build not found at: ${distPath}`);
    console.log('💡 Run "npm run build:client" to build the client first');
    throw new Error(
      `Could not find the client build directory: ${distPath}. Please run "npm run build:client" first.`,
    );
  }

  console.log(`📁 Serving client build from: ${distPath}`);

  // Serve static files from the client build
  app.use(express.static(distPath, {
    maxAge: isProduction ? '1y' : '0',
    etag: true,
    lastModified: true
  }));

  // Handle all routes by serving index.html (SPA routing)
  app.use("*", (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api/') || req.path.startsWith('/socket.io/') || 
        req.path.startsWith('/events') || req.path.startsWith('/ws')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>CargoRepo - Not Found</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .error { color: #e74c3c; }
            </style>
          </head>
          <body>
            <h1 class="error">404 - Page Not Found</h1>
            <p>The requested page could not be found.</p>
            <a href="/">Go to Home</a>
          </body>
        </html>
      `);
    }
  });

  console.log('✅ Client build served successfully');
} 
import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";
import { nanoid } from "nanoid";

const isProduction = process.env.NODE_ENV === 'production';

function createLogger() {
  return {
    info: (msg: string) => console.log(msg),
    warn: (msg: string) => console.warn(msg),
    error: (msg: string, options?: any) => console.error(msg, options),
  };
}

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  if (isProduction) {
    console.log('⚠️ Vite setup called in production - skipping');
    return;
  }

  // Dynamic import of Vite and viteConfig only in development
  const { createServer: createViteServer } = await import("vite");
  const viteConfigModule = await import("../vite.config");
  const viteConfig = viteConfigModule.default;

  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

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

  console.log('✅ Client build configured successfully');
}

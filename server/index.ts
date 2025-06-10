import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Profile upload route - MUST be registered before other middleware
app.post("/api/upload/profile", async (req, res) => {
  console.log('Profile upload route hit directly');
  
  try {
    const formidable = await import('formidable');
    const form = formidable.default({
      uploadDir: './uploads',
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    });

    form.parse(req, (err: any, fields: any, files: any) => {
      if (err) {
        console.error('Formidable parse error:', err);
        return res.status(500).json({ message: 'Upload failed' });
      }

      const file = files.file;
      if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const uploadedFile = Array.isArray(file) ? file[0] : file;
      
      // Return the uploaded file info
      res.json({
        success: true,
        filename: uploadedFile.newFilename,
        originalName: uploadedFile.originalFilename,
        size: uploadedFile.size,
        path: `/uploads/${uploadedFile.newFilename}`
      });
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ message: 'Server error' });
  }
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

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    const domain = process.env.REPLIT_DEV_DOMAIN;
    if (domain) {
      log(`OAuth callback accessible at: https://${domain}/oauth/kakao/callback`);
    } else {
      log(`OAuth callback accessible at: http://127.0.0.1:${port}/oauth/kakao/callback`);
    }
    log(`Local development URL: http://localhost:${port}`);
  });
})();

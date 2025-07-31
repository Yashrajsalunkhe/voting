import dotenv from 'dotenv';
import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { registerRoutes } from "./routes.js";
import { setupDevelopment, serveStatic } from "./static.js";

// Load environment variables
dotenv.config();

export const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from public directory in both dev and production
const publicPath = process.env.NODE_ENV === 'production' 
  ? path.resolve(import.meta.dirname, "..", "public")
  : path.resolve(import.meta.dirname, "public");
app.use(express.static(publicPath));

(async () => {
  // Register admin routes
  try {
    const { registerAdminRoutes } = await import('./admin-routes.js');
    registerAdminRoutes(app);
  } catch (error) {
    console.error("Error registering admin routes:", error);
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Setup frontend serving
  if (app.get("env") === "development") {
    setupDevelopment(app);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  const host = process.env.NODE_ENV === 'production' ? "0.0.0.0" : "localhost";
  server.listen(port, host, () => {
    console.log(`Server running on ${host}:${port}`);
  });
})();

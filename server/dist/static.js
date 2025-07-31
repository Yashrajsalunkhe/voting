import express from "express";
import fs from "fs";
import path from "path";
export function setupDevelopment(app) {
    // In development, serve files from frontend/dist or build directory
    const frontendDistPath = path.resolve(import.meta.dirname, "..", "frontend", "dist");
    if (fs.existsSync(frontendDistPath)) {
        app.use(express.static(frontendDistPath));
        // Serve index.html for all non-API routes
        app.use("*", (_req, res) => {
            res.sendFile(path.resolve(frontendDistPath, "index.html"));
        });
    }
    else {
        console.log("Frontend dist directory not found. Please build the frontend first.");
    }
}
export function serveStatic(app) {
    // In production, the compiled JS is in dist/, but public files are in the parent directory
    const distPath = path.resolve(import.meta.dirname, "..", "public");
    if (!fs.existsSync(distPath)) {
        throw new Error(`Could not find the build directory: ${distPath}, make sure to build the client first`);
    }
    app.use(express.static(distPath));
    // fall through to index.html if the file doesn't exist
    app.use("*", (_req, res) => {
        res.sendFile(path.resolve(distPath, "index.html"));
    });
}
//# sourceMappingURL=static.js.map
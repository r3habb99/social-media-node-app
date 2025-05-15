import express, { Request, Response } from "express";
import path from "path";
import { logger } from "../services";
import { ALLOWED_ORIGINS } from "../constants/urls";

/**
 * Configure static file serving for the Express application
 * @param app Express application instance
 */
export const setupStaticFiles = (app: express.Application): void => {
  // Serve static files from public directory with CORS headers
  app.use("/public", (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  }, express.static(path.join(__dirname, "../public")));

  // Serve uploads directory with comprehensive CORS headers
  app.use("/uploads", (req, res, next) => {
    // Set comprehensive CORS headers
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    // Set Access-Control-Allow-Origin based on the request origin
    const origin = req.headers.origin;
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      // Fallback to the first allowed origin if the request origin is not in the allowed list
      res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGINS[0]);
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization');
    next();
  }, express.static(path.join(__dirname, "../../uploads")));

  // Add a redirect for /api/uploads to /uploads
  app.use("/api/uploads", (req, res) => {
    const redirectUrl = `/uploads${req.url}`;
    logger.info(`Redirecting from ${req.originalUrl} to ${redirectUrl}`);
    res.redirect(redirectUrl);
  });

  // Special handling for profile pictures
  app.get("/api/uploads/profile-pictures/:filename", (req, res) => {
    const filePath = path.join(__dirname, "../../uploads/profile-pictures", req.params.filename);
    logger.info(`Serving profile picture directly from: ${filePath}`);
    res.sendFile(filePath);
  });

  // Special handling for cover photos
  app.get("/api/uploads/cover-photos/:filename", (req, res) => {
    const filePath = path.join(__dirname, "../../uploads/cover-photos", req.params.filename);
    logger.info(`Serving cover photo directly from: ${filePath}`);
    res.sendFile(filePath);
  });
};

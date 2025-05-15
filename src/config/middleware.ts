import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import cors from "cors";
import bodyParser from "body-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { NODE_ENV } from "../config";
import { logger } from "../services";
import { ALLOWED_ORIGINS } from "../constants/urls";

/**
 * Configure all middleware for the Express application
 * @param app Express application instance
 */
export const setupMiddleware = (app: express.Application): void => {
  // Security middleware
  app.use(helmet());

  // Rate limiting middleware (commented out for now)
  // const limiter = rateLimit({
  //   windowMs: 15 * 60 * 1000, // 15 minutes
  //   max: 100, // limit each IP to 100 requests per windowMs
  //   standardHeaders: true,
  //   legacyHeaders: false,
  // });
  // app.use(limiter);

  // Body parsing middleware
  app.use(express.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // Configure CORS for all routes
  app.use(cors({
    origin: ALLOWED_ORIGINS, // Use allowed origins from constants
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    exposedHeaders: ['Content-Disposition'] // For file downloads
  }));

  // Logging middleware
  app.use(morgan("dev"));

  // Handle OPTIONS requests for CORS preflight
  app.options('*', (req, res) => {
    res.status(200).end();
  });

  // Request logging middleware
  app.use((req: Request, _res: Response, next: NextFunction) => {
    const logMessage = `Request method: ${req.method}, Request URL: ${req.originalUrl}`;
    logger.info(logMessage);
    next();
  });
};

/**
 * Configure global error handling middleware
 * @param app Express application instance
 */
export const setupErrorHandling = (app: express.Application): void => {
  // Global error handling middleware
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error("Global error handler:", err);
    res.status(err.status || 500).json({
      message: err.message || "Internal Server Error",
      error: NODE_ENV === "development" ? err : {},
    });
  });

  // Fallback error handling middleware
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  });
};

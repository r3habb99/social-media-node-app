import express, { NextFunction, Request, Response } from "express";
import path from "path";
import morgan from "morgan";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import helmet from "helmet";

import rateLimit from "express-rate-limit";

dotenv.config();

// Importing custom modules
import { connectDB } from "./db";
import { HOST, NODE_ENV, PORT } from "./config";
import { logger } from "./services";
import { createServer } from "http";
import { initializeSocket } from "./socket";
import { setupSwagger } from "./swagger";
// Importing routes
import indexRoutes from "./routes/indexRoutes";
// Import URL constants
import { ALLOWED_ORIGINS, SERVER_BASE_URL, API_BASE_URL } from "./constants/urls";

const app = express();
setupSwagger(app);
const httpServer = createServer(app); // Create HTTP server

// Security middleware
app.use(helmet());

// Rate limiting middleware
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   standardHeaders: true,
//   legacyHeaders: false,
// });
// app.use(limiter);

// Removed global upload.any() middleware to avoid conflicts with route-specific upload middleware
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

app.use(morgan("dev"));

// Handle OPTIONS requests for CORS preflight
app.options('*', (req, res) => {
  res.status(200).end();
});

// Serve static images with CORS headers
app.use("/public", (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, "public")));

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
}, express.static(path.join(__dirname, "../uploads")));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  const logMessage = `Request method: ${req.method}, Request URL: ${req.originalUrl}`;
  logger.info(logMessage);
  next();
});

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "OK" });
});

// Add a redirect for /api/uploads to /uploads
app.use("/api/uploads", (req, res) => {
  const redirectUrl = `/uploads${req.url}`;
  logger.info(`Redirecting from ${req.originalUrl} to ${redirectUrl}`);
  res.redirect(redirectUrl);
});

// Special handling for profile pictures and cover photos
app.get("/api/uploads/profile-pictures/:filename", (req, res) => {
  const filePath = path.join(__dirname, "../uploads/profile-pictures", req.params.filename);
  logger.info(`Serving profile picture directly from: ${filePath}`);
  res.sendFile(filePath);
});

app.get("/api/uploads/cover-photos/:filename", (req, res) => {
  const filePath = path.join(__dirname, "../uploads/cover-photos", req.params.filename);
  logger.info(`Serving cover photo directly from: ${filePath}`);
  res.sendFile(filePath);
});

app.use("/api", indexRoutes);

// Global error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error("Global error handler:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    error: NODE_ENV === "development" ? err : {},
  });
});

// Initialize WebSocket server
const io = initializeSocket(httpServer);

// Set socket instance in the centralized notification service
import { setSocketInstance } from "./services/notificationService";
setSocketInstance(io);

export const startServer = async () => {
  try {
    // Connect to MongoDB
    logger.info('Connecting to MongoDB database...');
    await connectDB();
    logger.info('Database connection established successfully');

    // Parse port number
    const portNumber = PORT ? parseInt(PORT, 10) : NaN;
    if (isNaN(portNumber)) {
      logger.error("Invalid PORT number. Please check your environment variables.");
      process.exit(1);
    }

    // Start HTTP server
    httpServer.listen(portNumber, () => {
      // Log server information
      logger.info('===============================================');
      logger.info(`Environment: ${NODE_ENV || 'development'}`);
      logger.info(`Server URL: ${SERVER_BASE_URL}`);
      logger.info(`API URL: ${API_BASE_URL}`);
      logger.info(`Port: ${PORT}`);
      logger.info(`Swagger Docs: ${SERVER_BASE_URL}/api-docs`);
      logger.info('===============================================');
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Server startup failed: ${error.message}`);
      if (error.stack) {
        logger.error(`Stack trace: ${error.stack}`);
      }
    } else {
      logger.error(`Server startup failed with unknown error: ${error}`);
    }
    process.exit(1); // Exit process on failure
  }
};

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

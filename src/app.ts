import express from "express";
import dotenv from "dotenv";
import { createServer } from "http";
import {
  NODE_ENV,
  PORT,
  setupMiddleware,
  setupErrorHandling,
  setupStaticFiles,
  setupRoutes
} from "./config";
import { logger } from "./services";
import { initializeSocket } from "./socket";
import { setupSwagger } from "./swagger";
import { SERVER_BASE_URL, API_BASE_URL } from "./constants/urls";
import { connectDB } from "./db";

// Load environment variables
dotenv.config();

// Initialize Express app and HTTP server
const app = express();
const httpServer = createServer(app);

// Setup Swagger documentation
setupSwagger(app);

// Configure middleware
setupMiddleware(app);

// Configure static file serving
setupStaticFiles(app);

// Configure API routes
setupRoutes(app);

// Configure error handling middleware
setupErrorHandling(app);

// Initialize WebSocket server
export const io = initializeSocket(httpServer);

// Set socket instance in the centralized services
import { setSocketInstance as setNotificationSocketInstance } from "./services/notificationService";
import { setSocketInstance as setChatSocketInstance } from "./services/chatSocketService";
import { setWebRTCSocketInstance } from "./services/webrtcService";

// Set socket instance in all services
setNotificationSocketInstance(io);
setChatSocketInstance(io);
setWebRTCSocketInstance(io);

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

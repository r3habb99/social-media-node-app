import express, { NextFunction, Request, Response } from "express";
import path from "path";
import morgan from "morgan";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
dotenv.config();

// Importing custom modules
import { connectDB } from "./db";
import { HOST, NODE_ENV, PORT } from "./config";
import { logger, upload } from "./services";
import { createServer } from "http";
import { initializeSocket } from "./socket";

// Importing routes
import indexRoutes from "./routes/indexRoutes";

const app = express();
const httpServer = createServer(app); // Create HTTP server

app.use(upload.any());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());
// {
//   origin: (origin, callback) => {
//     // Allow any origin or check for a specific one
//     const allowedOrigins = [
//       // "http://localhost:5173",
//       // "http://localhost:3000",
//       // "http://localhost:8080",
//       "http://192.168.0.88:8080",
//     ];
//     if (!origin || allowedOrigins.indexOf(origin) === -1) {
//       callback(new Error("Not allowed by CORS"));
//     } else {
//       callback(null, true);
//     }
//   },
//   methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
//   allowedHeaders: ["Content-Type", "Authorization"],
//   credentials: true,
// }

app.use(morgan("dev"));

// Serve static images
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

if (NODE_ENV === "development") {
  app.use("*", (req: Request, _res: Response, next: NextFunction) => {
    const logMessage = `Request method: ${req.method}, Request URL: ${req.originalUrl} `;
    logger.info(logMessage);
    next();
  });
}

app.use("/api", indexRoutes);

// Initialize WebSocket server
const io = initializeSocket(httpServer);

export const startServer = () => {
  try {
    connectDB(); // Connect to MongoDB
    const portNumber = PORT ? parseInt(PORT, 10) : NaN;
    if (isNaN(portNumber)) {
      logger.error("❌ Invalid PORT number:", PORT);
      process.exit(1);
    }
    if (HOST) {
      logger.info(`===============================================`);
      logger.info(`http://${HOST}:${PORT}/api`);
    } else {
      logger.warn("HOST is not defined, unable to log the URL.");
    }

    httpServer.listen(portNumber, () => {
      logger.info("✅ Database Connected Successfully....");
      logger.info(`Chat-Service Server is running on port ${PORT}`);
      logger.info(`===============================================`);
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error("❌ Error starting the server:", error.message);
      logger.error(error.stack);
    } else {
      logger.error("❌ Error starting the server:", error);
    }
    process.exit(1); // Exit process on failure
  }
};

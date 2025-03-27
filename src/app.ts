import path from "path";
import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import cors from "cors";
// import bodyParser from "body-parser";
import dotenv from "dotenv";
dotenv.config();
import indexRoutes from "./routes/indexRoutes";
import { connectDB } from "./db";
import { HOST, NODE_ENV, PORT } from "./config";
import { logger } from "./services";

const app = express();

app.use(express.json());
// app.use(bodyParser.json())
app.use(cors());
app.use(morgan("dev"));

// Serve static images
app.use("/public", express.static(path.join(__dirname, "public")));
// Serve static files (uploaded images)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

if (NODE_ENV === "development") {
  app.use("*", (req: Request, _res: Response, next: NextFunction) => {
    const logMessage = `Request method: ${req.method}, Request URL: ${req.originalUrl} `;
    logger.info(logMessage);
    next();
  });
}

app.use("/api", indexRoutes);

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
    app.listen(portNumber, () => {
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

import mongoose from "mongoose";
import dotenv from "dotenv";
import { logger } from "../services/logger";
import { MONGO_URI } from "../config";

dotenv.config();

export const connectDB = async (): Promise<void> => {
  try {
    if (!MONGO_URI) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }

    await mongoose.connect(MONGO_URI);
    return Promise.resolve();
  } catch (error) {
    logger.error("MongoDB Connection Error:", error);
    return Promise.reject(error);
  }
};

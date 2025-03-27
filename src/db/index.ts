import mongoose from "mongoose";
import dotenv from "dotenv";
import { logger } from "../services/logger";
import { MONGO_URI } from "../config";

dotenv.config();

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI as string);
  } catch (error) {
    logger.error("❌ MongoDB Connection Error:", error);
    process.exit(1);
  }
};

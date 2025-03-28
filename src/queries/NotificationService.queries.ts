import { Notification } from "../entities";
import { logger } from "../services";
import mongoose from "mongoose";

/**
 * Insert or replace a notification
 */
export const insertNotification = async (
  userTo: mongoose.Types.ObjectId,
  userFrom: mongoose.Types.ObjectId,
  notificationType: string,
  entityId: mongoose.Types.ObjectId
) => {
  try {
    const data = { userTo, userFrom, notificationType, entityId };
    await Notification.deleteOne(data);
    return await Notification.create(data);
  } catch (error) {
    logger.error("❌ Error inserting notification: ", error);
    throw error;
  }
};

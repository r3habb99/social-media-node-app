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

    // Remove existing notification of the same type and entity
    await Notification.deleteOne(data);

    // Insert a new notification
    return await Notification.create(data);
  } catch (error) {
    logger.error("❌ Error inserting notification: ", error);
    throw error;
  }
};

/**
 * Get notifications for a user
 */
export const getNotifications = async (
  userId: mongoose.Types.ObjectId,
  unreadOnly?: boolean
) => {
  try {
    const query: any = {
      userTo: userId,
      notificationType: { $ne: "newMessage" },
    };
    if (unreadOnly) {
      query.opened = false;
    }

    return await Notification.find(query)
      .populate("userTo", "_id name") // Select only needed fields
      .populate("userFrom", "_id name")
      .sort({ createdAt: -1 })
      .lean(); // Improves performance for read-only queries
  } catch (error) {
    logger.error("❌ Error fetching notifications:", error);
    throw error;
  }
};

/**
 * Get latest notification for a user
 */
export const getLatestNotification = async (
  userId: mongoose.Types.ObjectId
) => {
  try {
    return await Notification.findOne({ userTo: userId })
      .populate("userTo", "_id name")
      .populate("userFrom", "_id name")
      .sort({ createdAt: -1 })
      .lean();
  } catch (error) {
    logger.error("❌ Error fetching latest notification:", error);
    throw error;
  }
};

/**
 * Get a notification by ID
 */
export const getNotificationById = async (notificationId: string) => {
  try {
    return await Notification.findById(notificationId)
      .populate("userTo", "_id name") // Select only necessary fields
      .populate("userFrom", "_id name")
      .lean();
  } catch (error) {
    logger.error(
      `❌ Error fetching notification by ID (${notificationId}):`,
      error
    );
    throw error;
  }
};

/**
 * Mark a specific notification as opened
 */
export const markNotificationAsOpened = async (
  notificationId: string,
  userId: string
) => {
  try {
    const notification = await getNotificationById(notificationId);

    if (!notification || String(notification.userTo) !== String(userId)) {
      logger.warn(
        `⚠️ Unauthorized attempt by user ${userId} to mark notification ${notificationId} as opened.`
      );
      return { modifiedCount: 0 };
    }

    const result = await Notification.updateOne(
      { _id: notificationId },
      { $set: { opened: true } }
    );

    return { modifiedCount: result.modifiedCount };
  } catch (error) {
    logger.error("❌ Error marking notification as opened:", error);
    throw error;
  }
};

/**
 * Mark all notifications for a user as opened
 */
export const markAllNotificationsAsOpened = async (
  userId: mongoose.Types.ObjectId
) => {
  try {
    const result = await Notification.updateMany(
      { userTo: userId, opened: false }, // Only update unread ones
      { $set: { opened: true } }
    );

    return { modifiedCount: result.modifiedCount };
  } catch (error) {
    logger.error("❌ Error marking all notifications as opened:", error);
    throw error;
  }
};

import { Notification, User, Post, Comment } from "../entities";
import { logger } from "../services";
import mongoose from "mongoose";
import { NotificationTypes } from "../constants";
import { transformNotificationMediaUrls, transformNotificationsMediaUrls } from "../utils/notificationMediaUrl";

/**
 * Insert or replace a notification with a detailed message
 */
export const insertNotification = async (
  userTo: mongoose.Types.ObjectId,
  userFrom: mongoose.Types.ObjectId,
  notificationType: string,
  entityId: mongoose.Types.ObjectId,
  customMessage?: string
) => {
  try {
    // Get user data for the notification message
    const userFromData = await User.findById(userFrom).select('firstName lastName username').lean();

    if (!userFromData) {
      logger.error(`User ${userFrom} not found for notification`);
      throw new Error(`User ${userFrom} not found for notification`);
    }

    // Create username for the message
    const username = userFromData.firstName && userFromData.lastName
      ? `${userFromData.firstName} ${userFromData.lastName}`
      : userFromData.username;

    // Generate appropriate message based on notification type
    let message = customMessage || '';

    if (!message) {
      switch (notificationType) {
        case NotificationTypes.FOLLOW:
          message = `${username} has followed you`;
          break;

        case NotificationTypes.LIKE:
          // Get post data for the like notification
          try {
            const post = await Post.findById(entityId).select('content').lean();
            const postSnippet = post?.content
              ? (post.content.length > 30 ? post.content.substring(0, 30) + '...' : post.content)
              : '';
            message = `${username} has liked your post${postSnippet ? ': "' + postSnippet + '"' : ''}`;
          } catch (err) {
            message = `${username} has liked your post`;
          }
          break;

        case NotificationTypes.COMMENT:
          // Get comment data for the comment notification
          try {
            const comment = await Comment.findById(entityId).select('content postId').lean();
            const commentSnippet = comment?.content
              ? (comment.content.length > 30 ? comment.content.substring(0, 30) + '...' : comment.content)
              : '';
            message = `${username} has commented on your post: "${commentSnippet}"`;
          } catch (err) {
            message = `${username} has commented on your post`;
          }
          break;

        case NotificationTypes.REPLY:
          // Get reply data for the reply notification
          try {
            const reply = await Comment.findById(entityId).select('content').lean();
            const replySnippet = reply?.content
              ? (reply.content.length > 30 ? reply.content.substring(0, 30) + '...' : reply.content)
              : '';
            message = `${username} has replied to your post: "${replySnippet}"`;
          } catch (err) {
            message = `${username} has replied to your post`;
          }
          break;

        case NotificationTypes.RETWEET:
          message = `${username} has retweeted your post`;
          break;

        default:
          message = `You have a new ${notificationType} notification from ${username}`;
      }
    }

    const data = {
      userTo,
      userFrom,
      notificationType,
      entityId,
      message
    };

    // Remove existing notification of the same type and entity
    await Notification.deleteOne({ userTo, userFrom, notificationType, entityId });

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

    const notifications = await Notification.find(query)
      .populate("userTo", "_id firstName lastName username profilePic") // Include profile picture
      .populate("userFrom", "_id firstName lastName username profilePic")
      .sort({ createdAt: -1 })
      .lean(); // Improves performance for read-only queries

    // Transform profile picture URLs to full URLs
    return transformNotificationsMediaUrls(notifications);
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
    const notification = await Notification.findOne({ userTo: userId })
      .populate("userTo", "_id firstName lastName username profilePic")
      .populate("userFrom", "_id firstName lastName username profilePic")
      .sort({ createdAt: -1 })
      .lean();

    // Transform profile picture URL to full URL
    return transformNotificationMediaUrls(notification);
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
    const notification = await Notification.findById(notificationId)
      .populate("userTo", "_id firstName lastName username profilePic") // Include profile picture
      .populate("userFrom", "_id firstName lastName username profilePic")
      .lean();

    // Transform profile picture URL to full URL
    return transformNotificationMediaUrls(notification);
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
    // First, get the notification to check ownership
    const notification = await Notification.findById(notificationId).lean();

    if (!notification) {
      logger.warn(`⚠️ Notification ${notificationId} not found.`);
      return { modifiedCount: 0, error: "Notification not found" };
    }

    // Check if the user is authorized to mark this notification as opened
    // Compare the string representations of the ObjectIds
    // Handle both cases: when userTo is populated (object) or just an ID
    const notificationUserToId = notification.userTo && typeof notification.userTo === 'object'
      ? notification.userTo._id
      : notification.userTo;

    if (String(notificationUserToId) !== String(userId)) {
      logger.warn(
        `⚠️ Unauthorized attempt by user ${userId} to mark notification ${notificationId} as opened.`
      );
      return { modifiedCount: 0, error: "Unauthorized access" };
    }

    // If authorized, mark the notification as opened
    const result = await Notification.updateOne(
      { _id: notificationId },
      { $set: { opened: true } }
    );

    logger.info(`✅ Notification ${notificationId} marked as opened by user ${userId}`);
    return { modifiedCount: result.modifiedCount, success: true };
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

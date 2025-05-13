import mongoose from "mongoose";
import { logger } from "./logger";
import { insertNotification } from "../queries/NotificationService.queries";
import { NotificationTypes } from "../constants";
import { emitNotification } from "../socket";
import { Server } from "socket.io";
import { getPostById, getUserById } from "../queries";

// Reference to the Socket.io server instance
let io: Server;

// Function to set the Socket.io instance - should be called once from app.ts
export const setSocketInstance = (socketIo: Server) => {
  io = socketIo;
  logger.info("Socket.io instance set in notification service");
};

/**
 * Create a notification and send it in real-time if possible
 * @param userToId - User who will receive the notification
 * @param userFromId - User who triggered the notification
 * @param notificationType - Type of notification (from NotificationTypes)
 * @param entityId - ID of the entity related to the notification (post, comment, etc.)
 * @param content - Optional content to include in the real-time notification
 */
export const createNotification = async (
  userToId: string,
  userFromId: string,
  notificationType: string,
  entityId: string,
  content?: string
): Promise<boolean> => {
  try {
    // Don't send notification if the user is notifying themselves
    if (userToId === userFromId) {
      return false;
    }

    // Create database notification
    const notification = await insertNotification(
      new mongoose.Types.ObjectId(userToId),
      new mongoose.Types.ObjectId(userFromId),
      notificationType,
      new mongoose.Types.ObjectId(entityId)
    );

    logger.info(`Created ${notificationType} notification for user ${userToId}`);

    // Send real-time notification if Socket.io is initialized
    if (io) {
      try {
        // Get user data for the notification
        const userFrom = await getUserById(userFromId);

        if (!userFrom) {
          logger.error(`User ${userFromId} not found for notification`);
          return false;
        }

        // Prepare notification data based on type
        const notificationData: any = {
          id: notification?.id || entityId,
          type: notificationType,
          userFrom: {
            id: userFromId,
            name: userFrom.firstName + ' ' + userFrom.lastName,
            username: userFrom.username,
            profilePic: userFrom.profilePic
          },
          createdAt: new Date()
        };

        // Add entity-specific data based on notification type
        switch (notificationType) {
          case NotificationTypes.COMMENT:
          case NotificationTypes.REPLY:
            notificationData.content = content || '';
            notificationData.postId = entityId;
            break;

          case NotificationTypes.LIKE:
            const likedPost = await getPostById(entityId);
            notificationData.postId = entityId;
            notificationData.postContent = likedPost?.content || '';
            break;

          case NotificationTypes.RETWEET:
            const retweetedPost = await getPostById(entityId);
            notificationData.postId = entityId;
            notificationData.postContent = retweetedPost?.content || '';
            break;

          case NotificationTypes.FOLLOW:
            // For follow notifications, entityId is the follower's user ID
            break;
        }

        // Emit notification to the recipient
        emitNotification(io, userToId, notificationData);
        logger.info(`Real-time ${notificationType} notification sent to user ${userToId}`);
        return true;
      } catch (error) {
        logger.error(`Error sending real-time notification: ${error}`);
        return false;
      }
    }

    return true;
  } catch (error) {
    logger.error(`Error creating notification: ${error}`);
    return false;
  }
};

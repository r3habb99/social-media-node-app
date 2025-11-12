import { Response } from "express";
import { AuthRequest, logger, sendResponse } from "../services";
import { HttpResponseMessages, HttpStatusCodes } from "../constants";
import {
  getLatestNotification,
  getNotificationById,
  getNotifications,
  markAllNotificationsAsOpened,
  markNotificationAsOpened,
} from "../queries";

/**
 * Get notifications for the current user
 */
export const handleGetNotifications = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const unreadOnly = req.query.unreadOnly === "true";
    const notifications = await getNotifications(req.user!.id, unreadOnly);
    logger.info("Notifications retrieved successfully");
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: HttpResponseMessages.SUCCESS,
      data: notifications,
    });
  } catch (error) {
    logger.error("❌ Error in getNotifications:", error);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error: error,
    });
  }
};

/**
 * Get latest notification for the current user
 */
export const handleGetLatestNotification = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const notification = await getLatestNotification(req.user!.id);
    logger.info("Latest notification retrieved successfully");
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: HttpResponseMessages.SUCCESS,
      data: notification,
    });
  } catch (error) {
    logger.error("❌ Error in getLatestNotification:", error);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error: error,
    });
  }
};

/**
 * Mark a notification as opened
 */
export const handleMarkNotificationAsOpened = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.id;

    // Attempt to mark the notification as opened
    const result = await markNotificationAsOpened(id, currentUserId);

    if (result.modifiedCount === 0) {
      logger.info(
        "You are not authorized to mark this notification or it does not exist."
      );
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.FORBIDDEN,
        message: HttpResponseMessages.FORBIDDEN,
        data: "Unauthorized attempt to mark notification as opened",
      });
    }

    logger.info(
      `✅ Notification ${id} marked as opened by user ${currentUserId}`
    );

    return sendResponse({
      res,
      statusCode: HttpStatusCodes.NO_CONTENT,
      message: HttpResponseMessages.SUCCESS,
    });
  } catch (error) {
    logger.error("❌ Error in markNotificationAsOpened:", error);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error,
    });
  }
};

/**
 * Mark all notifications as opened for the current user
 */
export const handleMarkAllNotificationsAsOpened = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      logger.error("User ID not found in request");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.UNAUTHORIZED,
        message: HttpResponseMessages.UNAUTHORIZED,
        error: "User authentication required",
      });
    }

    const result = await markAllNotificationsAsOpened(userId);

    logger.info(`✅ Marked ${result.modifiedCount} notifications as opened for user ${userId}`);

    return sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: "All notifications marked as opened successfully",
      data: {
        modifiedCount: result.modifiedCount,
        message: `${result.modifiedCount} notifications were marked as opened`
      },
    });
  } catch (error) {
    logger.error("❌ Error in markAllNotificationsAsOpened:", error);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Get a notification by ID
 */
export const handleGetNotificationById = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.id;

    if (!id) {
      logger.error("Notification ID is required");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: HttpResponseMessages.BAD_REQUEST,
        data: "Notification ID is required",
      });
    }

    const notification = await getNotificationById(id);

    if (!notification) {
      logger.error(`Notification with ID ${id} not found`);
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.NOT_FOUND,
        message: HttpResponseMessages.NOT_FOUND,
        data: "Notification not found",
      });
    }

    // Check if the user is authorized to view this notification
    // Handle both cases: when userTo is populated (object) or just an ID
    const notificationUserToId = notification.userTo && typeof notification.userTo === 'object'
      ? notification.userTo._id
      : notification.userTo;

    if (String(notificationUserToId) !== String(currentUserId)) {
      logger.warn(
        `⚠️ Unauthorized attempt by user ${currentUserId} to access notification ${id}`
      );
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.FORBIDDEN,
        message: HttpResponseMessages.FORBIDDEN,
        data: "You are not authorized to view this notification",
      });
    }

    logger.info(`Notification ${id} retrieved successfully`);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: HttpResponseMessages.SUCCESS,
      data: notification,
    });
  } catch (error) {
    logger.error(`❌ Error in getNotificationById: ${error}`);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error: error,
    });
  }
};

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
    await markAllNotificationsAsOpened(req.user!.id);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.NO_CONTENT,
      message: HttpResponseMessages.SUCCESS,
    });
    // res.sendStatus(204);
  } catch (error) {
    logger.error("❌ Error in markAllNotificationsAsOpened:", error);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error: error,
    });
  }
};

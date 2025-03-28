import { Response } from "express";
import { AuthRequest, logger, sendResponse } from "../services";
import { HttpResponseMessages, HttpStatusCodes } from "../constants";
import {
  findUserById,
  getUserFollowers,
  getUserFollowing,
  insertNotification,
  updateUserFollowData,
} from "../queries";
import mongoose from "mongoose";

/**
 * Toggle follow/unfollow a user
 */
export const toggleFollowUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.UNAUTHORIZED,
        message: HttpResponseMessages.UNAUTHORIZED,
        data: "Unauthorized",
      });
    }

    if (userId === String(currentUserId)) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: "You cannot follow yourself",
      });
    }

    const userToFollow = await findUserById(userId);
    if (!userToFollow) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.NOT_FOUND,
        message: "User not found",
      });
    }

    // Check if the userId and currentUserId are valid ObjectId strings
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(currentUserId)
    ) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: "Invalid user ID",
      });
    }

    const isFollowing = userToFollow?.followers?.includes(currentUserId);
    const operation = isFollowing ? "$pull" : "$addToSet";

    // Directly use the string IDs without creating ObjectId instances
    // Since MongoDB can handle string representations of ObjectIds in queries
    const updatedUser = await updateUserFollowData(
      new mongoose.Types.ObjectId(userId),
      currentUserId,
      operation
    );

    // Send notification if followed
    if (!isFollowing) {
      await insertNotification(
        new mongoose.Types.ObjectId(userId),
        currentUserId,
        "follow",
        currentUserId
      );
    }

    return sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: HttpResponseMessages.SUCCESS,
      data: updatedUser,
    });
  } catch (error) {
    logger.error("❌ Error in toggleFollowUser:", error);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error,
    });
  }
};

/**
 * Get users that a specific user is following
 */
export const getUserFollowingController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { userId } = req.params;
    const user = await getUserFollowing(userId);
    if (!user) {
      logger.error("❌ User not found");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.NOT_FOUND,
        message: "User not found",
      });
    }

    if (!user.following || user.following.length === 0) {
      logger.info("No following users found");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.OK,
        message: HttpResponseMessages.SUCCESS,
        data: ["No following users found"],
      });
    }

    logger.info("Following users retrieved successfully");
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: HttpResponseMessages.SUCCESS,
      data: user.following,
    });
  } catch (error) {
    logger.error("❌ Error in getUserFollowing:", error);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error,
    });
  }
};

/**
 * Get followers of a specific user
 */
export const getUserFollowersController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { userId } = req.params;
    const user = await getUserFollowers(userId);
    if (!user) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.NOT_FOUND,
        message: "User not found",
      });
    }
    if (!user.followers || user.followers.length === 0) {
      logger.info("No following users found");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.OK,
        message: HttpResponseMessages.SUCCESS,
        data: ["No followers users found"],
      });
    }
    logger.info("Followers retrieved successfully");
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: HttpResponseMessages.SUCCESS,
      data: user.followers,
    });
  } catch (error) {
    logger.error("❌ Error in getUserFollowers:", error);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error,
    });
  }
};

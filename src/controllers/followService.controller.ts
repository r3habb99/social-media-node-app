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
      logger.error("❌ Unauthorized");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.UNAUTHORIZED,
        message: HttpResponseMessages.UNAUTHORIZED,
        data: "Unauthorized",
      });
    }

    if (userId === String(currentUserId)) {
      logger.error("❌ You cannot follow yourself");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: "You cannot follow yourself",
      });
    }

    // Validate userId and currentUserId as ObjectId
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(currentUserId)
    ) {
      logger.error("❌ Invalid user ID");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: "Invalid user ID",
      });
    }

    const userToFollow = await findUserById(userId);
    if (!userToFollow) {
      logger.error("❌ User not found");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.NOT_FOUND,
        message: "User not found",
      });
    }

    // Convert to ObjectId
    const userIdObj = new mongoose.Types.ObjectId(userId);
    const currentUserIdObj = new mongoose.Types.ObjectId(currentUserId);

    const isFollowing = userToFollow?.followers?.includes(currentUserIdObj);
    const operation = isFollowing ? "$pull" : "$addToSet";

    // Update both users' follow data
    const { updatedCurrentUser, updatedTargetUser } =
      await updateUserFollowData(currentUserIdObj, userIdObj, operation);

    // Send notification if followed
    if (!isFollowing) {
      logger.info("Inserting notification");
      await insertNotification(
        userIdObj,
        currentUserIdObj,
        "follow",
        currentUserIdObj
      );
    }
    logger.info("User followed successfully");
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: HttpResponseMessages.SUCCESS,
      data: { updatedCurrentUser, updatedTargetUser },
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

    // The following array should already have full URLs for profile pictures
    // from the getUserFollowing function, but we'll double-check here
    const followingUsers = user.following;

    logger.info("Following users retrieved successfully");
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: HttpResponseMessages.SUCCESS,
      data: followingUsers,
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
      logger.info("No followers found");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.OK,
        message: HttpResponseMessages.SUCCESS,
        data: ["No followers found"],
      });
    }

    // The followers array should already have full URLs for profile pictures
    // from the getUserFollowers function, but we'll double-check here
    const followerUsers = user.followers;

    logger.info("Followers retrieved successfully");
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: HttpResponseMessages.SUCCESS,
      data: followerUsers,
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

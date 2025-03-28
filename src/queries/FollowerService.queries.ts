import { User } from "../entities";
import { logger } from "../services";
import mongoose from "mongoose";

/**
 * Find user by ID
 */
export const findUserById = async (userId: string) => {
  try {
    return await User.findById(userId);
  } catch (error) {
    logger.error("❌ Error finding user by ID: ", error);
    throw error;
  }
};

/**
 * Update user's following or followers list
 */
export const updateUserFollowData = async (
  currentUserId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId,
  operation: "$pull" | "$addToSet"
) => {
  try {
    return await Promise.all([
      User.findByIdAndUpdate(
        currentUserId,
        { [operation]: { following: userId } },
        { new: true }
      ),
      User.findByIdAndUpdate(userId, {
        [operation]: { followers: currentUserId },
      }),
    ]);
  } catch (error) {
    logger.error("❌ Error updating follow data: ", error);
    throw error;
  }
};

/**
 * Get users a specific user is following
 */
export const getUserFollowing = async (userId: string) => {
  try {
    return await User.findById(userId).populate("following");
  } catch (error) {
    logger.error("❌ Error getting following users: ", error);
    throw error;
  }
};

/**
 * Get followers of a specific user
 */
export const getUserFollowers = async (userId: string) => {
  try {
    return await User.findById(userId).populate("followers");
  } catch (error) {
    logger.error("❌ Error getting followers: ", error);
    throw error;
  }
};

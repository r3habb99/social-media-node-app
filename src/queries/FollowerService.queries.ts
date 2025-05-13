import { User } from "../entities";
import { logger } from "../services";
import mongoose from "mongoose";
import { getFullMediaUrl } from "../utils/mediaUrl";

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
    const updatedCurrentUser = await User.findByIdAndUpdate(
      currentUserId,
      { [operation]: { following: userId } },
      { new: true }
    );

    const updatedTargetUser = await User.findByIdAndUpdate(
      userId,
      { [operation]: { followers: currentUserId } },
      { new: true }
    );

    return { updatedCurrentUser, updatedTargetUser };
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
    // Find the user and populate the following field
    const user = await User.findById(userId).populate("following", "-password");

    if (!user) {
      return null;
    }

    // Transform profile pictures to full URLs if user exists and has following
    if (user.following && Array.isArray(user.following)) {
      // For each user in the following array, transform their profile picture and cover photo
      user.following.forEach((followedUser: any) => {
        if (followedUser.profilePic && typeof followedUser.profilePic === 'string' && !followedUser.profilePic.startsWith('http')) {
          followedUser.profilePic = getFullMediaUrl(followedUser.profilePic);
        }
        if (followedUser.coverPhoto && typeof followedUser.coverPhoto === 'string' && !followedUser.coverPhoto.startsWith('http')) {
          followedUser.coverPhoto = getFullMediaUrl(followedUser.coverPhoto);
        }
      });
    }

    return user;
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
    // Find the user and populate the followers field
    const user = await User.findById(userId).populate("followers", "-password");

    if (!user) {
      return null;
    }

    // Transform profile pictures to full URLs if user exists and has followers
    if (user.followers && Array.isArray(user.followers)) {
      // For each user in the followers array, transform their profile picture and cover photo
      user.followers.forEach((follower: any) => {
        if (follower.profilePic && typeof follower.profilePic === 'string' && !follower.profilePic.startsWith('http')) {
          follower.profilePic = getFullMediaUrl(follower.profilePic);
        }
        if (follower.coverPhoto && typeof follower.coverPhoto === 'string' && !follower.coverPhoto.startsWith('http')) {
          follower.coverPhoto = getFullMediaUrl(follower.coverPhoto);
        }
      });
    }

    return user;
  } catch (error) {
    logger.error("❌ Error getting followers: ", error);
    throw error;
  }
};

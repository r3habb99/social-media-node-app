import { SERVER_URL } from "../config";
import { User, Post } from "../entities";
import { IUser } from "../interfaces";
import { logger } from "../services";
import { transformUserMediaUrls, transformUsersMediaUrls } from "../utils/userMediaUrl";
import mongoose from "mongoose";

export const createUser = async (userData: Partial<IUser>): Promise<IUser> => {
  try {
    const user = new User(userData);
    return await user.save();
  } catch (error) {
    logger.error("❌ Error in creating user: ", error);
    throw error;
  }
};
export const getAllUsers = async () => {
  try {
    const users = await User.find();
    return transformUsersMediaUrls(users);
  } catch (error) {
    logger.error("❌ Error in fetching users: ", error);
    return error;
  }
};

export const getUser = async (email: string): Promise<IUser | null> => {
  try {
    const user = await User.findOne({ email });
    return transformUserMediaUrls(user);
  } catch (error) {
    logger.error("❌ Error fetching user by email: ", error);
    return null;
  }
};

export const getUserById = async (userId: string): Promise<IUser | null> => {
  try {
    const user = await User.findById(userId).select("-password");
    return transformUserMediaUrls(user);
  } catch (error) {
    logger.error("❌ Error fetching user by ID: ", error);
    return null;
  }
};

export const updateUserById = async (
  userId: string,
  updateData: Partial<IUser>
): Promise<IUser | null> => {
  try {
    const user = await User.findByIdAndUpdate(userId, updateData, { new: true });
    return transformUserMediaUrls(user);
  } catch (error) {
    logger.error("❌ Error updating user:", error);
    throw error;
  }
};

export const deleteUsersByIds = async (userIds: string[]) => {
  try {
    return await User.updateMany(
      { _id: { $in: userIds } },
      { isDeleted: 1, deletedAt: new Date() }
    );
  } catch (error) {
    logger.error("❌ Error in deleting users by IDs: ", error);
    return error;
  }
};

export const searchUser = async (query: string) => {
  try {
    const searchQuery = {
      $or: [
        { username: { $regex: query, $options: "i" } },
        { firstName: { $regex: query, $options: "i" } },
        { lastName: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    };

    // Query the User collection with the built search query
    const users = await User.find(searchQuery);

    // Transform user media URLs before returning
    return transformUsersMediaUrls(users);
  } catch (error) {
    logger.error("Error searching users in database", error);
    return []; // Return an empty array in case of error
  }
};

/**
 * Get user profile with comprehensive stats and paginated content
 * @param userId User ID to fetch profile for
 * @param paginationOptions Options for pagination and content filtering
 * @returns User profile with stats and paginated content (posts, replies, likes, or media)
 */
export const getUserProfileWithStats = async (
  userId: string,
  paginationOptions: {
    max_id?: string;
    since_id?: string;
    limit: number;
    contentType: string;
    includeComments: boolean;
  }
): Promise<{
  user: IUser | null;
  stats: {
    postCount: number;
    repliesCount: number;
    receivedRepliesCount: number;
    likesCount: number;
    mediaCount: number;
  };
  content: {
    items: any[];
    pagination: {
      next_max_id?: string;
      has_more: boolean;
    };
  };
}> => {
  try {
    // Extract pagination options with defaults
    const {
      max_id,
      since_id,
      limit = 10,
      contentType = 'posts',
      includeComments = true
    } = paginationOptions;

    // Get the user
    const user = await User.findById(userId).select("-password");

    if (!user) {
      logger.error(`User not found with ID: ${userId}`);
      return {
        user: null,
        stats: {
          postCount: 0,
          repliesCount: 0,
          receivedRepliesCount: 0,
          likesCount: 0,
          mediaCount: 0
        },
        content: {
          items: [],
          pagination: {
            has_more: false
          }
        }
      };
    }

    // Count posts (excluding replies)
    const postCount = await Post.countDocuments({
      postedBy: new mongoose.Types.ObjectId(userId),
      replyTo: { $exists: false },
      isDeleted: false
    });

    // Count replies made by the user
    const repliesCount = await Post.countDocuments({
      postedBy: new mongoose.Types.ObjectId(userId),
      replyTo: { $exists: true },
      isDeleted: false
    });

    // Get all post IDs by this user
    const userPostIds = await Post.find({
      postedBy: new mongoose.Types.ObjectId(userId),
      isDeleted: false
    }).select('_id').lean();

    // Extract just the IDs
    const postIds = userPostIds.map(post => post._id);

    // Count replies received on user's posts
    const receivedRepliesCount = await Post.countDocuments({
      replyTo: { $in: postIds },
      postedBy: { $ne: new mongoose.Types.ObjectId(userId) }, // Exclude user's own replies
      isDeleted: false
    });

    // Count posts liked by the user
    const likesCount = user.likes ? user.likes.length : 0;

    // Count posts with media
    const mediaCount = await Post.countDocuments({
      postedBy: new mongoose.Types.ObjectId(userId),
      media: { $exists: true, $ne: [] },
      isDeleted: false
    });

    // Base query for pagination
    let query: any = { isDeleted: false };

    // Apply cursor-based pagination filters
    if (max_id) {
      // Get posts older than max_id (going backwards in time)
      const maxIdPost = await Post.findById(max_id);
      if (maxIdPost) {
        query.createdAt = { $lt: maxIdPost.createdAt };
      }
    } else if (since_id) {
      // Get posts newer than since_id (going forward in time)
      const sinceIdPost = await Post.findById(since_id);
      if (sinceIdPost) {
        query.createdAt = { $gt: sinceIdPost.createdAt };
      }
    }

    // Apply content type filters
    switch (contentType) {
      case 'posts':
        // Original posts by the user (not replies)
        query.postedBy = new mongoose.Types.ObjectId(userId);
        query.replyTo = { $exists: false };
        break;

      case 'replies':
        // Replies made by the user
        query.postedBy = new mongoose.Types.ObjectId(userId);
        query.replyTo = { $exists: true };
        break;

      case 'likes':
        // Posts liked by the user
        if (!user.likes || user.likes.length === 0) {
          // If user hasn't liked any posts, return empty result
          return {
            user: transformUserMediaUrls(user),
            stats: {
              postCount,
              repliesCount,
              receivedRepliesCount,
              likesCount,
              mediaCount
            },
            content: {
              items: [],
              pagination: {
                has_more: false
              }
            }
          };
        }

        // Get posts that the user has liked
        query._id = { $in: user.likes };
        break;

      case 'media':
        // Posts with media by the user
        query.postedBy = new mongoose.Types.ObjectId(userId);
        query.media = { $exists: true, $ne: [] };
        break;

      default:
        // Default to posts if contentType is not recognized
        query.postedBy = new mongoose.Types.ObjectId(userId);
        query.replyTo = { $exists: false };
    }

    // Fetch one more item than requested to determine if there are more
    const posts = await Post.find(query)
      .populate("postedBy")
      .populate({
        path: "retweetData",
        populate: [
          { path: "postedBy" },
          { path: "replyTo" }
        ]
      })
      .populate("replyTo")
      .sort({ createdAt: -1 })
      .limit(limit + 1) // Fetch one extra to check if there are more
      .exec();

    // Check if there are more posts
    const hasMore = posts.length > limit;

    // Remove the extra post if there are more
    const paginatedPosts = hasMore ? posts.slice(0, limit) : posts;

    // Get the next_max_id (the ID of the last post in the current set)
    const nextMaxId = paginatedPosts.length > 0 ? paginatedPosts[paginatedPosts.length - 1]._id?.toString() : undefined;

    // Transform posts to include full URLs and comment counts
    const transformedPosts = [];
    for (const post of paginatedPosts) {
      // Create a new object to avoid modifying the original
      const postObj = post.toObject();

      // Transform media URLs if they exist
      if (postObj.media && Array.isArray(postObj.media)) {
        postObj.media = postObj.media.map((url: string) => {
          // Check if the URL already starts with http
          if (url.startsWith('http')) return url;
          return `${SERVER_URL}${url}`;
        });
      }

      // Transform profile picture URL of the user who posted
      if (postObj.postedBy && typeof postObj.postedBy === 'object' && 'profilePic' in postObj.postedBy) {
        if (typeof postObj.postedBy.profilePic === 'string' && !postObj.postedBy.profilePic.startsWith('http')) {
          postObj.postedBy.profilePic = `${SERVER_URL}${postObj.postedBy.profilePic}`;
        }
      }

      // Transform profile picture in retweetData if it exists
      if (postObj.retweetData && typeof postObj.retweetData === 'object') {
        const retweetData = postObj.retweetData as any;
        if (retweetData.postedBy && typeof retweetData.postedBy === 'object') {
          if (retweetData.postedBy.profilePic && !retweetData.postedBy.profilePic.startsWith('http')) {
            retweetData.postedBy.profilePic = `${SERVER_URL}${retweetData.postedBy.profilePic}`;
          }
        }
      }

      // Transform profile picture in replyTo if it exists
      if (postObj.replyTo && typeof postObj.replyTo === 'object') {
        const replyTo = postObj.replyTo as any;
        if (replyTo.postedBy && typeof replyTo.postedBy === 'object') {
          if (replyTo.postedBy.profilePic && !replyTo.postedBy.profilePic.startsWith('http')) {
            replyTo.postedBy.profilePic = `${SERVER_URL}${replyTo.postedBy.profilePic}`;
          }
        }
      }

      // Add comment count if requested
      if (includeComments) {
        const commentCount = await Post.countDocuments({
          replyTo: post._id,
          isDeleted: false
        });
        postObj.commentCount = commentCount;
      }

      transformedPosts.push(postObj);
    }

    // Transform user media URLs
    const transformedUser = transformUserMediaUrls(user);

    return {
      user: transformedUser,
      stats: {
        postCount,
        repliesCount,
        receivedRepliesCount,
        likesCount,
        mediaCount
      },
      content: {
        items: transformedPosts,
        pagination: {
          next_max_id: hasMore ? nextMaxId : undefined,
          has_more: hasMore
        }
      }
    };
  } catch (error) {
    logger.error(`Error fetching user profile with stats: ${error}`);
    return {
      user: null,
      stats: {
        postCount: 0,
        repliesCount: 0,
        receivedRepliesCount: 0,
        likesCount: 0,
        mediaCount: 0
      },
      content: {
        items: [],
        pagination: {
          has_more: false
        }
      }
    };
  }
};

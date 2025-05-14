import mongoose from "mongoose";
import { IPost } from "../interfaces";
import { Post, User, Comment } from "../entities";
import { logger } from "../services";
import { getFullMediaUrl } from "../utils/mediaUrl";
import { countCommentsForPost, getCommentsForPost } from "./Comment.queries";
import { insertNotification } from "./NotificationService.queries";
import { NotificationTypes } from "../constants";

/**
 * Helper function to transform media URLs in a post to full URLs and add comments
 */
const transformPostMediaUrls = async (post: IPost | null, includeComments: boolean = false): Promise<IPost | null> => {
  if (!post) return null;

  // Create a new object to avoid modifying the original
  const postObj = post.toObject();

  // Transform media URLs if they exist
  if (postObj.media && Array.isArray(postObj.media)) {
    postObj.media = postObj.media.map((url: string) => getFullMediaUrl(url));
  }

  // Transform profile picture URL of the user who posted
  if (postObj.postedBy && postObj.postedBy.profilePic) {
    postObj.postedBy.profilePic = getFullMediaUrl(postObj.postedBy.profilePic);
  }

  // Transform media URLs in retweetData if it exists
  if (postObj.retweetData) {
    if (postObj.retweetData.media && Array.isArray(postObj.retweetData.media)) {
      postObj.retweetData.media = postObj.retweetData.media.map((url: string) => getFullMediaUrl(url));
    }

    // Transform profile picture in retweetData.postedBy if it exists
    if (postObj.retweetData.postedBy && postObj.retweetData.postedBy.profilePic) {
      postObj.retweetData.postedBy.profilePic = getFullMediaUrl(postObj.retweetData.postedBy.profilePic);
    }
  }

  // Transform media URLs in replyTo if it exists
  if (postObj.replyTo) {
    if (postObj.replyTo.media && Array.isArray(postObj.replyTo.media)) {
      postObj.replyTo.media = postObj.replyTo.media.map((url: string) => getFullMediaUrl(url));
    }

    // Transform profile picture in replyTo.postedBy if it exists
    if (postObj.replyTo.postedBy && postObj.replyTo.postedBy.profilePic) {
      postObj.replyTo.postedBy.profilePic = getFullMediaUrl(postObj.replyTo.postedBy.profilePic);
    }
  }

  // Add comment count to the post
  try {
    const commentCount = await Comment.countDocuments({
      postId: post._id,
      isDeleted: false
    });

    // Add commentCount as a property to the post object
    (postObj as any).commentCount = commentCount;
  } catch (error) {
    logger.error(`Error counting comments for post: ${error}`);
    (postObj as any).commentCount = 0;
  }

  // Fetch comments for the post if includeComments is true
  if (includeComments) {
    try {
      // Make sure post._id is a valid ObjectId
      const postId = post._id ? post._id.toString() : '';
      if (postId) {
        const commentsResult = await getCommentsForPost(postId, 1, 10, true);
        (postObj as any).comments = commentsResult.comments;
        (postObj as any).commentsHasMore = commentsResult.hasMore;
        (postObj as any).commentsTotal = commentsResult.total;
      } else {
        logger.error(`Invalid post ID when fetching comments`);
        (postObj as any).comments = [];
        (postObj as any).commentsHasMore = false;
        (postObj as any).commentsTotal = 0;
      }
    } catch (error) {
      logger.error(`Error fetching comments for post: ${error}`);
      (postObj as any).comments = [];
      (postObj as any).commentsHasMore = false;
      (postObj as any).commentsTotal = 0;
    }
  }

  return postObj as unknown as IPost;
};

/**
 * Helper function to transform media URLs in an array of posts
 */
const transformPostsMediaUrls = async (posts: IPost[], includeComments: boolean = false): Promise<IPost[]> => {
  const transformedPosts = await Promise.all(posts.map(post => transformPostMediaUrls(post, includeComments)));
  return transformedPosts.filter(Boolean) as IPost[];
};

// Get Posts with Filters and Pagination
export const getPosts = async (
  filter: object,
  paginationOptions?: {
    max_id?: string;
    since_id?: string;
    limit?: number;
    includeComments?: boolean;
  }
): Promise<{
  posts: IPost[];
  pagination: {
    next_max_id?: string;
    has_more: boolean;
  };
}> => {
  try {
    const limit = paginationOptions?.limit || 10; // Default limit is 10
    const includeComments = paginationOptions?.includeComments !== undefined ? paginationOptions.includeComments : true;
    let query: any = { isDeleted: false, ...filter };

    // Apply cursor-based pagination filters
    if (paginationOptions?.max_id) {
      // Get posts older than max_id (going backwards in time)
      const maxIdPost = await Post.findById(paginationOptions.max_id);
      if (maxIdPost) {
        query.createdAt = { $lt: maxIdPost.createdAt };
      }
    } else if (paginationOptions?.since_id) {
      // Get posts newer than since_id (going forward in time)
      const sinceIdPost = await Post.findById(paginationOptions.since_id);
      if (sinceIdPost) {
        query.createdAt = { $gt: sinceIdPost.createdAt };
      }
    }

    // Fetch one more post than requested to determine if there are more posts
    const posts = await Post.find(query)
      .populate("postedBy") // Populate the postedBy field (user data)
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

    // Transform media URLs to full URLs and include comments if requested
    const transformedPosts = await transformPostsMediaUrls(paginatedPosts || [], includeComments);
    return {
      posts: transformedPosts,
      pagination: {
        next_max_id: hasMore ? nextMaxId : undefined,
        has_more: hasMore
      }
    };
  } catch (error) {
    logger.error(`Error fetching posts: ${error}`);
    return {
      posts: [],
      pagination: {
        has_more: false
      }
    }; // Return empty array in case of error
  }
};

// Get a single Post by ID
export const getPostById = async (postId: string, includeComments: boolean = true): Promise<IPost | null> => {
  try {
    const post = await Post.findOne({ _id: postId, isDeleted: false })
      .populate("postedBy")
      .populate({
        path: "retweetData",
        populate: [
          { path: "postedBy" },
          { path: "replyTo" }
        ]
      })
      .populate("replyTo")
      .exec();

    // Transform media URLs to full URLs and add comments if requested
    return await transformPostMediaUrls(post, includeComments);
  } catch (error) {
    logger.error(`Error fetching post by ID: ${error}`);
    return null; // Return null in case of error
  }
};

// Create Post
export const createPost = async (data: Partial<IPost>): Promise<IPost> => {
  try {
    return await Post.create(data);
  } catch (error) {
    logger.error(`Error creating post: ${error}`);
    throw error;
  }
};

// Like/Unlike a Post
export const toggleLikePost = async (
  postId: string,
  userId: string
): Promise<IPost | null> => {
  try {
    const post = await Post.findById(postId);
    if (!post || post.isDeleted) return null; // If post doesn't exist or is deleted, return null

    const isLiked = post.likes.includes(new mongoose.Types.ObjectId(userId));
    const option = isLiked ? "$pull" : "$addToSet"; // Toggle like using $pull and $addToSet

    // Update the post's likes array
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { [option]: { likes: new mongoose.Types.ObjectId(userId) } }, // Add/remove the userId
      { new: true }
    )
    .populate("postedBy") // Populate postedBy with user data for username
    .populate("retweetData")
    .populate("replyTo");

    // Also update the user's likes array to maintain consistency
    await User.findByIdAndUpdate(
      userId,
      { [option]: { likes: new mongoose.Types.ObjectId(postId) } } // Add/remove the postId
    );

    // Create notification if the post was liked (not unliked)
    if (!isLiked && updatedPost && updatedPost.postedBy) {
      const postOwnerId = updatedPost.postedBy._id.toString();

      // Don't send notification if the user is liking their own post
      if (postOwnerId !== userId) {
        try {
          await insertNotification(
            new mongoose.Types.ObjectId(postOwnerId),
            new mongoose.Types.ObjectId(userId),
            NotificationTypes.LIKE,
            new mongoose.Types.ObjectId(postId)
          );
          logger.info(`Created like notification for user ${postOwnerId}`);
        } catch (notificationError) {
          logger.error(`Error creating like notification: ${notificationError}`);
        }
      }
    }

    // Transform media URLs to full URLs and add comment count
    return await transformPostMediaUrls(updatedPost, false);
  } catch (error) {
    logger.error(`Error toggling like on post: ${error}`);
    return null;
  }
};

// Retweet a Post
export const retweetPost = async (
  postId: string,
  userId: string
): Promise<{ post: IPost | null; deleted?: boolean }> => {
  try {
    const deletedPost = await Post.findOneAndDelete({
      postedBy: userId,
      retweetData: postId,
    });

    if (deletedPost) {
      // Also remove this post from user's retweets array
      await User.findByIdAndUpdate(
        userId,
        { $pull: { retweets: new mongoose.Types.ObjectId(postId) } }
      );

      // Transform media URLs in the deleted post and add comment count
      return { post: await transformPostMediaUrls(deletedPost, false), deleted: true };
    }

    // Update the original post to add this user to retweetUsers
    await Post.findByIdAndUpdate(
      postId,
      { $addToSet: { retweetUsers: new mongoose.Types.ObjectId(userId) } }
    );

    // Update the user to add this post to their retweets array
    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { retweets: new mongoose.Types.ObjectId(postId) } }
    );

    // Get the original post to copy its content and media
    const originalPost = await Post.findById(postId);
    if (!originalPost) {
      logger.error(`Original post not found: ${postId}`);
      return { post: null };
    }

    // Create the retweet with content and media from the original post
    const repost = await Post.create({
      postedBy: userId,
      retweetData: postId,
      content: originalPost.content,  // Copy the content
      media: originalPost.media,      // Copy the media URLs
      mediaType: originalPost.mediaType, // Copy the media type
      visibility: originalPost.visibility // Copy the visibility setting
    });

    // Populate the repost with related data
    await repost.populate({
      path: "postedBy"
    });

    // Populate retweetData and its nested fields
    await repost.populate({
      path: "retweetData",
      populate: [
        { path: "postedBy" },
        { path: "replyTo" },
        { path: "retweetUsers" }
      ]
    });

    // Create notification for the original post owner
    if (originalPost.postedBy) {
      const postOwnerId = originalPost.postedBy.toString();

      // Don't send notification if the user is retweeting their own post
      if (postOwnerId !== userId) {
        try {
          await insertNotification(
            new mongoose.Types.ObjectId(postOwnerId),
            new mongoose.Types.ObjectId(userId),
            NotificationTypes.RETWEET,
            new mongoose.Types.ObjectId(postId)
          );
          logger.info(`Created retweet notification for user ${postOwnerId}`);
        } catch (notificationError) {
          logger.error(`Error creating retweet notification: ${notificationError}`);
        }
      }
    }

    // Transform media URLs in the repost and add comment count
    return { post: await transformPostMediaUrls(repost, false), deleted: false };
  } catch (error) {
    logger.error(`Error retweeting post: ${error}`);
    return { post: null }; // Return null if there is an error
  }
};

// Soft Delete a Post
export const deletePost = async (postId: string): Promise<boolean> => {
  try {
    const post = await Post.findById(postId);
    if (!post) return false;

    post.isDeleted = true;
    post.deletedAt = new Date();
    await post.save();
    return true;
  } catch (error) {
    logger.error(`Error deleting post: ${error}`);
    return false;
  }
};

// Pin/Unpin a Post
export const pinPost = async (
  postId: string,
  userId: string,
  pinned: boolean
): Promise<void> => {
  try {
    await Post.updateMany({ postedBy: userId }, { pinned: false });
    await Post.findByIdAndUpdate(postId, { pinned });
  } catch (error) {
    logger.error(`Error pinning post: ${error}`);
    return;
  }
};

// Update a Post
export const updatePost = async (
  postId: string,
  userId: string,
  updateData: Partial<IPost>
): Promise<IPost | null> => {
  try {
    // Find the post and verify ownership
    const post = await Post.findOne({
      _id: postId,
      postedBy: userId,
      isDeleted: false
    });

    if (!post) {
      logger.error(`Post not found or user does not have permission to update`);
      return null;
    }

    // Update only allowed fields
    if (updateData.content !== undefined) {
      post.content = updateData.content;
    }

    if (updateData.media !== undefined) {
      post.media = updateData.media;
    }

    if (updateData.mediaType !== undefined) {
      post.mediaType = updateData.mediaType;
    }

    if (updateData.visibility !== undefined) {
      post.visibility = updateData.visibility;
    }

    // Save the updated post
    await post.save();

    // Return the updated post with populated fields
    const updatedPost = await Post.findById(postId)
      .populate("postedBy")
      .populate("retweetData")
      .populate("replyTo");

    // Transform media URLs to full URLs and add comment count
    return await transformPostMediaUrls(updatedPost, false);
  } catch (error) {
    logger.error(`Error updating post: ${error}`);
    return null;
  }
};

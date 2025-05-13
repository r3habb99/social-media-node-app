import mongoose from "mongoose";
import { Comment, User, Post } from "../entities";
import { IComment } from "../interfaces";
import { logger } from "../services";
import { getFullMediaUrl } from "../utils/mediaUrl";
import { insertNotification } from "./NotificationService.queries";
import { NotificationTypes } from "../constants";

/**
 * Helper function to transform profile picture URLs in comments
 */
const transformCommentMediaUrls = (commentObj: any): IComment => {
  if (!commentObj) return commentObj;

  // Transform profile picture in author if it exists
  if (commentObj.author && commentObj.author.profilePic) {
    commentObj.author.profilePic = getFullMediaUrl(commentObj.author.profilePic);
  }

  // Transform profile picture in replyTo.author if it exists
  if (commentObj.replyTo && commentObj.replyTo.author && commentObj.replyTo.author.profilePic) {
    commentObj.replyTo.author.profilePic = getFullMediaUrl(commentObj.replyTo.author.profilePic);
  }

  return commentObj as unknown as IComment;
};

/**
 * Helper function to transform an array of comments
 */
const transformCommentsMediaUrls = (comments: IComment[]): IComment[] => {
  return comments.map(comment => transformCommentMediaUrls(comment)).filter(Boolean) as IComment[];
};

/**
 * Create a new comment
 */
export const createComment = async (
  postId: string,
  authorId: string,
  content: string,
  replyToId?: string
): Promise<IComment> => {
  try {
    const commentData: Partial<IComment> = {
      postId: new mongoose.Types.ObjectId(postId),
      author: new mongoose.Types.ObjectId(authorId),
      content,
    };

    // If this is a reply to another comment
    if (replyToId) {
      commentData.replyTo = new mongoose.Types.ObjectId(replyToId);
    }

    const comment = await Comment.create(commentData);

    // Populate the author field
    await comment.populate("author");

    // Populate replyTo if it exists
    if (comment.replyTo) {
      await comment.populate({
        path: "replyTo",
        populate: { path: "author" }
      });
    }

    // Create notification for the post owner
    try {
      // Get the post to find its owner
      const post = await Post.findById(postId);

      if (post) {
        const postOwnerId = post.postedBy.toString();

        // Don't send notification if the commenter is the post owner
        if (postOwnerId !== authorId) {
          // If this is a reply to a comment, use REPLY notification type
          const notificationType = replyToId ? NotificationTypes.REPLY : NotificationTypes.COMMENT;

          // Create notification
          await insertNotification(
            new mongoose.Types.ObjectId(postOwnerId),
            new mongoose.Types.ObjectId(authorId),
            notificationType,
            comment._id as unknown as mongoose.Types.ObjectId
          );

          logger.info(`Created ${notificationType} notification for user ${postOwnerId}`);
        }
      }
    } catch (notificationError) {
      // Log error but don't fail the comment creation
      logger.error(`Error creating notification for comment: ${notificationError}`);
    }

    // Transform profile picture URLs
    return transformCommentMediaUrls(comment);
  } catch (error) {
    logger.error(`Error creating comment: ${error}`);
    throw error;
  }
};

/**
 * Get comments for a post with pagination
 */
export const getCommentsForPost = async (
  postId: string,
  page = 1,
  limit = 10,
  parentOnly = true
): Promise<{ comments: IComment[]; total: number; hasMore: boolean }> => {
  try {
    const skip = (page - 1) * limit;

    // Query to get only parent comments (not replies) or all comments
    const query: any = {
      postId: new mongoose.Types.ObjectId(postId),
      isDeleted: false
    };

    // If parentOnly is true, only get comments that are not replies
    if (parentOnly) {
      query.replyTo = { $exists: false };
    }

    // Get total count for pagination
    const total = await Comment.countDocuments(query);

    // Get comments with pagination
    const comments = await Comment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit + 1) // Get one extra to check if there are more
      .populate("author")
      .populate({
        path: "replyTo",
        populate: { path: "author" }
      })
      .exec();

    // Check if there are more comments
    const hasMore = comments.length > limit;

    // Remove the extra comment if there are more
    const paginatedComments = hasMore ? comments.slice(0, limit) : comments;

    // Transform profile picture URLs
    return {
      comments: transformCommentsMediaUrls(paginatedComments),
      total,
      hasMore
    };
  } catch (error) {
    logger.error(`Error getting comments for post: ${error}`);
    return { comments: [], total: 0, hasMore: false };
  }
};

/**
 * Get replies to a comment
 */
export const getRepliesForComment = async (
  commentId: string,
  page = 1,
  limit = 10
): Promise<{ replies: IComment[]; total: number; hasMore: boolean }> => {
  try {
    const skip = (page - 1) * limit;

    // Query to get replies to a specific comment
    const query = {
      replyTo: new mongoose.Types.ObjectId(commentId),
      isDeleted: false
    };

    // Get total count for pagination
    const total = await Comment.countDocuments(query);

    // Get replies with pagination
    const replies = await Comment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit + 1) // Get one extra to check if there are more
      .populate("author")
      .populate({
        path: "replyTo",
        populate: { path: "author" }
      })
      .exec();

    // Check if there are more replies
    const hasMore = replies.length > limit;

    // Remove the extra reply if there are more
    const paginatedReplies = hasMore ? replies.slice(0, limit) : replies;

    // Transform profile picture URLs
    return {
      replies: transformCommentsMediaUrls(paginatedReplies),
      total,
      hasMore
    };
  } catch (error) {
    logger.error(`Error getting replies for comment: ${error}`);
    return { replies: [], total: 0, hasMore: false };
  }
};

/**
 * Update a comment
 */
export const updateComment = async (
  commentId: string,
  authorId: string,
  content: string
): Promise<IComment | null> => {
  try {
    // Find the comment and verify ownership
    const comment = await Comment.findOne({
      _id: commentId,
      author: authorId,
      isDeleted: false
    });

    if (!comment) {
      logger.error(`Comment not found or user does not have permission to update`);
      return null;
    }

    // Update the content
    comment.content = content;

    // Save the updated comment
    await comment.save();

    // Return the updated comment with populated fields
    const updatedComment = await Comment.findById(commentId)
      .populate("author")
      .populate({
        path: "replyTo",
        populate: { path: "author" }
      });

    // Transform profile picture URLs
    return transformCommentMediaUrls(updatedComment);
  } catch (error) {
    logger.error(`Error updating comment: ${error}`);
    return null;
  }
};

/**
 * Delete a comment (soft delete)
 */
export const deleteComment = async (
  commentId: string,
  authorId: string
): Promise<boolean> => {
  try {
    // Find the comment and verify ownership
    const comment = await Comment.findOne({
      _id: commentId,
      author: authorId,
      isDeleted: false
    });

    if (!comment) {
      logger.error(`Comment not found or user does not have permission to delete`);
      return false;
    }

    // Soft delete the comment
    comment.isDeleted = true;
    comment.deletedAt = new Date();

    // Save the updated comment
    await comment.save();

    return true;
  } catch (error) {
    logger.error(`Error deleting comment: ${error}`);
    return false;
  }
};

/**
 * Toggle like on a comment
 */
export const toggleLikeComment = async (
  commentId: string,
  userId: string
): Promise<IComment | null> => {
  try {
    const comment = await Comment.findById(commentId);
    if (!comment || comment.isDeleted) return null;

    const isLiked = comment.likes.includes(new mongoose.Types.ObjectId(userId));
    const option = isLiked ? "$pull" : "$addToSet";

    // Update the comment's likes array
    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      { [option]: { likes: new mongoose.Types.ObjectId(userId) } },
      { new: true }
    )
    .populate("author")
    .populate({
      path: "replyTo",
      populate: { path: "author" }
    });

    // Transform profile picture URLs
    return transformCommentMediaUrls(updatedComment);
  } catch (error) {
    logger.error(`Error toggling like on comment: ${error}`);
    return null;
  }
};

/**
 * Count comments for a post
 */
export const countCommentsForPost = async (postId: string): Promise<number> => {
  try {
    return await Comment.countDocuments({
      postId: new mongoose.Types.ObjectId(postId),
      isDeleted: false
    });
  } catch (error) {
    logger.error(`Error counting comments for post: ${error}`);
    return 0;
  }
};

import { Response } from "express";
import { AuthRequest, logger, sendResponse, createNotification } from "../services";
import {
  createComment,
  getCommentsForPost,
  getRepliesForComment,
  updateComment,
  deleteComment,
  toggleLikeComment,
  getPostById,
} from "../queries";
import { HttpResponseMessages, HttpStatusCodes, NotificationTypes } from "../constants";

/**
 * Create a new comment on a post
 */
export const handleCreateComment = async (req: AuthRequest, res: Response) => {
  try {
    const { postId, content, replyToId } = req.body;

    if (!postId || !content) {
      logger.error("Post ID and content are required");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: HttpResponseMessages.BAD_REQUEST,
        data: { comment: null, message: "Post ID and content are required" },
      });
    }

    const comment = await createComment(postId, req.user!.id, content, replyToId);
    logger.info("Comment created successfully");

    // Send real-time notification
    try {
      // Get post details to find the post owner
      const post = await getPostById(postId);

      if (post && post.postedBy && post.postedBy._id) {
        const postOwnerId = post.postedBy._id.toString();

        // Don't send notification if the commenter is the post owner
        if (postOwnerId !== req.user!.id) {
          // Determine notification type
          const notificationType = replyToId ? NotificationTypes.REPLY : NotificationTypes.COMMENT;

          // Create and send notification
          await createNotification(
            postOwnerId,
            req.user!.id,
            notificationType,
            postId,
            content.length > 50 ? content.substring(0, 50) + '...' : content
          );

          logger.info(`${notificationType} notification sent to user ${postOwnerId}`);
        }
      }
    } catch (notificationError) {
      // Log error but don't fail the comment creation
      logger.error("Error sending notification:", notificationError);
    }

    return sendResponse({
      res,
      statusCode: HttpStatusCodes.CREATED,
      message: "Comment created successfully",
      data: comment,
    });
  } catch (error) {
    logger.error("Error creating comment", error);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error: error,
    });
  }
};

/**
 * Get comments for a post with pagination
 */
export const handleGetCommentsForPost = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const parentOnly = req.query.parentOnly !== 'false'; // Default to true if not specified

    if (!postId) {
      logger.error("Post ID is required");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: HttpResponseMessages.BAD_REQUEST,
        data: { comments: [], message: "Post ID is required" },
      });
    }

    const result = await getCommentsForPost(postId, page, limit, parentOnly);
    logger.info(`Retrieved ${result.comments.length} comments for post ${postId}`);

    return sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: HttpResponseMessages.SUCCESS,
      data: {
        comments: result.comments,
        pagination: {
          total: result.total,
          page,
          limit,
          hasMore: result.hasMore,
        },
      },
    });
  } catch (error) {
    logger.error("Error getting comments for post", error);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error: error,
    });
  }
};

/**
 * Get replies for a comment with pagination
 */
export const handleGetRepliesForComment = async (req: AuthRequest, res: Response) => {
  try {
    const { commentId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!commentId) {
      logger.error("Comment ID is required");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: HttpResponseMessages.BAD_REQUEST,
        data: { replies: [], message: "Comment ID is required" },
      });
    }

    const result = await getRepliesForComment(commentId, page, limit);
    logger.info(`Retrieved ${result.replies.length} replies for comment ${commentId}`);

    return sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: HttpResponseMessages.SUCCESS,
      data: {
        replies: result.replies,
        pagination: {
          total: result.total,
          page,
          limit,
          hasMore: result.hasMore,
        },
      },
    });
  } catch (error) {
    logger.error("Error getting replies for comment", error);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error: error,
    });
  }
};

/**
 * Update a comment
 */
export const handleUpdateComment = async (req: AuthRequest, res: Response) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!commentId || !content) {
      logger.error("Comment ID and content are required");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: HttpResponseMessages.BAD_REQUEST,
        data: { comment: null, message: "Comment ID and content are required" },
      });
    }

    const updatedComment = await updateComment(commentId, req.user!.id, content);

    if (!updatedComment) {
      logger.error("Comment not found or user does not have permission to update");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.NOT_FOUND,
        message: HttpResponseMessages.NOT_FOUND,
        data: { comment: null, message: "Comment not found or you don't have permission to update it" },
      });
    }

    logger.info(`Comment ${commentId} updated successfully`);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: "Comment updated successfully",
      data: updatedComment,
    });
  } catch (error) {
    logger.error("Error updating comment", error);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error: error,
    });
  }
};

/**
 * Delete a comment
 */
export const handleDeleteComment = async (req: AuthRequest, res: Response) => {
  try {
    const { commentId } = req.params;

    if (!commentId) {
      logger.error("Comment ID is required");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: HttpResponseMessages.BAD_REQUEST,
        data: { message: "Comment ID is required" },
      });
    }

    const deleted = await deleteComment(commentId, req.user!.id);

    if (!deleted) {
      logger.error("Comment not found or user does not have permission to delete");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.NOT_FOUND,
        message: HttpResponseMessages.NOT_FOUND,
        data: { message: "Comment not found or you don't have permission to delete it" },
      });
    }

    logger.info(`Comment ${commentId} deleted successfully`);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: "Comment deleted successfully",
      data: { deleted: true },
    });
  } catch (error) {
    logger.error("Error deleting comment", error);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error: error,
    });
  }
};

/**
 * Like/unlike a comment
 */
export const handleLikeComment = async (req: AuthRequest, res: Response) => {
  try {
    const { commentId } = req.params;

    if (!commentId) {
      logger.error("Comment ID is required");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: HttpResponseMessages.BAD_REQUEST,
        data: { comment: null, message: "Comment ID is required" },
      });
    }

    const updatedComment = await toggleLikeComment(commentId, req.user!.id);

    if (!updatedComment) {
      logger.error("Comment not found");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.NOT_FOUND,
        message: HttpResponseMessages.NOT_FOUND,
        data: { comment: null },
      });
    }

    logger.info(`Comment ${commentId} like toggled successfully`);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: HttpResponseMessages.SUCCESS,
      data: updatedComment,
    });
  } catch (error) {
    logger.error("Error liking comment", error);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error: error,
    });
  }
};

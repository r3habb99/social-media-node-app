import { Response } from "express";
import { AuthRequest, logger, sendResponse, createNotification } from "../services";
import {
  createPost,
  deletePost,
  getPostById,
  getPosts,
  retweetPost,
  toggleLikePost,
  updatePost,
} from "../queries";
import { HttpResponseMessages, HttpStatusCodes, NotificationTypes } from "../constants";
import { IPost } from "../interfaces";
import { getFullMediaUrl } from "../utils/mediaUrl";

// Get all posts with pagination
export const handleGetPosts = async (req: AuthRequest, res: Response) => {
  try {
    // Extract pagination parameters
    const { max_id, since_id, limit } = req.query;

    // Create search object from remaining query parameters
    let searchObj: any = { ...req.query };

    // Remove pagination parameters from search object
    delete searchObj.max_id;
    delete searchObj.since_id;
    delete searchObj.limit;

    // Process special filters
    if (typeof searchObj.isReply === "string") {
      searchObj.replyTo = { $exists: searchObj.isReply === "true" };
      delete searchObj.isReply;
    }

    if (typeof searchObj.search === "string") {
      searchObj.content = { $regex: searchObj.search, $options: "i" };
      delete searchObj.search;
    }

    // Create pagination options
    const paginationOptions = {
      max_id: max_id as string | undefined,
      since_id: since_id as string | undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined
    };

    // Get posts with pagination
    const result = await getPosts(searchObj, paginationOptions);
    logger.info("Posts fetched successfully with pagination");

    return sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: HttpResponseMessages.SUCCESS,
      data: {
        posts: result.posts,
        pagination: result.pagination
      },
    });
  } catch (error) {
    logger.error("Error fetching posts", error);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error: error,
    });
  }
};

// Get a single post by ID
export const handleGetPostById = async (req: AuthRequest, res: Response) => {
  try {
    const post = await getPostById(req.params.id);
    if (!post) {
      logger.error("Post not found");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.NOT_FOUND,
        message: HttpResponseMessages.NOT_FOUND,
        data: { post: null },
      });
    }
    logger.info("Post fetched successfully");
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: HttpResponseMessages.SUCCESS,
      data: post,
    });
  } catch (error) {
    logger.error("Error fetching post", error);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error: error,
    });
  }
};

// Create post
export const handleCreatePost = async (req: AuthRequest, res: Response) => {
  try {
    // Check if there's content or uploaded files
    if (!req.body.content && (!req.files || (req.files as Express.Multer.File[]).length === 0)) {
      logger.error("Either content or media is required");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: HttpResponseMessages.BAD_REQUEST,
        data: { post: null, message: "Either content or media is required" },
      });
    }

    // Process uploaded files if any
    const mediaUrls: string[] = [];
    if (req.files && (req.files as Express.Multer.File[]).length > 0) {
      const files = req.files as Express.Multer.File[];
      logger.info(`Found ${files.length} uploaded files`);
      logger.info(`Request URL: ${req.url}, Original URL: ${req.originalUrl}`);

      // Generate URLs for each uploaded file
      files.forEach(file => {
        // Check if the file is in the post-media directory or others directory
        const directory = file.destination.includes('post-media') ? 'post-media' : 'others';
        const relativePath = `/uploads/${directory}/${file.filename}`;
        const mediaUrl = getFullMediaUrl(relativePath);
        mediaUrls.push(mediaUrl);
        logger.info(`Added media URL: ${mediaUrl} for file: ${file.filename}`);
      });

      logger.info(`Processed ${mediaUrls.length} media files for post`);
    }

    // Determine media type based on the first file (if any)
    let mediaType: "image" | "video" | undefined;
    if (mediaUrls.length > 0 && req.files) {
      const firstFile = (req.files as Express.Multer.File[])[0];
      if (firstFile.mimetype.startsWith('image/')) {
        mediaType = "image";
      } else if (firstFile.mimetype.startsWith('video/')) {
        mediaType = "video";
      }
    }

    const postData = {
      content: req.body.content,
      postedBy: req.user!.id,
      media: [...mediaUrls, ...(req.body.media || [])], // Combine uploaded files with any media URLs in the request
      mediaType,
      visibility: req.body.visibility || "public",
    };

    const newPost = await createPost(postData);
    logger.info("Post created successfully with media");

    return sendResponse({
      res,
      statusCode: HttpStatusCodes.CREATED,
      message: "Post created successfully",
      data: newPost,
    });
  } catch (error) {
    logger.error("Error creating post", error);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error: error,
    });
  }
};

// Like a post
export const handleLikePost = async (req: AuthRequest, res: Response) => {
  try {
    const postId = req.params.id;
    const userId = req.user!.id;
    const updatedPost = await toggleLikePost(postId, userId);

    if (!updatedPost) {
      logger.error("Post not found");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.NOT_FOUND,
        message: HttpResponseMessages.NOT_FOUND,
        data: { post: null },
      });
    }

    // Check if the post was liked (not unliked) by checking if the user's ID is in the likes array
    const isLiked = updatedPost.likes.some(
      likeId => likeId.toString() === userId
    );

    // Send notification if the post was liked and not the user's own post
    if (isLiked && updatedPost.postedBy && updatedPost.postedBy._id.toString() !== userId) {
      try {
        // Create notification data
        const postOwnerId = updatedPost.postedBy._id.toString();
        const postContent = updatedPost.content || '';

        // Send notification
        await createNotification(
          postOwnerId,
          userId,
          NotificationTypes.LIKE,
          postId,
          postContent.substring(0, 50) // Include a snippet of the post content
        );
      } catch (notificationError) {
        // Log error but don't fail the like operation
        logger.error("Error sending like notification:", notificationError);
      }
    }

    return sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: HttpResponseMessages.SUCCESS,
      data: updatedPost,
    });
  } catch (error) {
    logger.error("Error liking post", error);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error: error,
    });
  }
};

// Retweet post
export const handleRetweetPost = async (req: AuthRequest, res: Response) => {
  try {
    const postId = req.params.id;
    const userId = req.user!.id;
    const { post, deleted } = await retweetPost(postId, userId);

    // Only send notification if the post was retweeted (not un-retweeted)
    if (post && !deleted) {
      try {
        // Get the original post to find its owner
        const originalPost = await getPostById(postId);

        if (originalPost && originalPost.postedBy && originalPost.postedBy._id) {
          const postOwnerId = originalPost.postedBy._id.toString();

          // Don't send notification if the user is retweeting their own post
          if (postOwnerId !== userId) {
            const postContent = originalPost.content || '';

            // Send notification
            await createNotification(
              postOwnerId,
              userId,
              NotificationTypes.RETWEET,
              postId,
              postContent.substring(0, 50) // Include a snippet of the post content
            );
          }
        }
      } catch (notificationError) {
        // Log error but don't fail the retweet operation
        logger.error("Error sending real-time retweet notification:", notificationError);
      }
    }

    logger.info("Post retweeted successfully");
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: HttpResponseMessages.SUCCESS,
      data: { post, deleted },
    });
  } catch (error) {
    logger.error("Error retweeting post", error);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error: error,
    });
  }
};

// Soft delete post
export const handleDeletePost = async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await deletePost(req.params.id);
    if (!deleted) {
      logger.error("Post not found");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.NOT_FOUND,
        message: HttpResponseMessages.NOT_FOUND,
        data: { post: null },
      });
    }
    logger.info("Post deleted successfully");
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: HttpResponseMessages.SUCCESS,
      data: "Post deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting post", error);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error: error,
    });
  }
};

// Update post
export const handleUpdatePost = async (req: AuthRequest, res: Response) => {
  try {
    // Process uploaded files if any
    const mediaUrls: string[] = [];
    if (req.files && (req.files as Express.Multer.File[]).length > 0) {
      const files = req.files as Express.Multer.File[];
      logger.info(`Found ${files.length} uploaded files for update`);

      // Generate URLs for each uploaded file
      files.forEach(file => {
        // Check if the file is in the post-media directory or others directory
        const directory = file.destination.includes('post-media') ? 'post-media' : 'others';
        const relativePath = `/uploads/${directory}/${file.filename}`;
        const mediaUrl = getFullMediaUrl(relativePath);
        mediaUrls.push(mediaUrl);
        logger.info(`Added media URL: ${mediaUrl} for file: ${file.filename}`);
      });

      logger.info(`Processed ${mediaUrls.length} media files for post update`);
    }

    // Determine media type based on the first file (if any)
    let mediaType: "image" | "video" | undefined;
    if (mediaUrls.length > 0 && req.files) {
      const firstFile = (req.files as Express.Multer.File[])[0];
      if (firstFile.mimetype.startsWith('image/')) {
        mediaType = "image";
      } else if (firstFile.mimetype.startsWith('video/')) {
        mediaType = "video";
      }
    }

    // Prepare update data
    const updateData: Partial<IPost> = {};

    // Only update content if provided
    if (req.body.content !== undefined) {
      updateData.content = req.body.content;
    }

    // Only update media if new files were uploaded or media was explicitly provided
    if (mediaUrls.length > 0) {
      updateData.media = mediaUrls;
      if (mediaType) {
        updateData.mediaType = mediaType;
      }
    } else if (req.body.media) {
      // If media URLs were provided in the request body
      updateData.media = Array.isArray(req.body.media) ? req.body.media : [req.body.media];
    }

    // Only update visibility if provided
    if (req.body.visibility) {
      updateData.visibility = req.body.visibility;
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      logger.error("No update data provided");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: HttpResponseMessages.BAD_REQUEST,
        data: { post: null, message: "No update data provided" },
      });
    }

    // Update the post
    const updatedPost = await updatePost(req.params.id, req.user!.id, updateData);

    if (!updatedPost) {
      logger.error("Post not found or user does not have permission to update");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.NOT_FOUND,
        message: HttpResponseMessages.NOT_FOUND,
        data: { post: null, message: "Post not found or you don't have permission to update it" },
      });
    }

    logger.info("Post updated successfully");
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: "Post updated successfully",
      data: updatedPost,
    });
  } catch (error) {
    logger.error("Error updating post", error);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error: error,
    });
  }
};

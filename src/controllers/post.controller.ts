import { Response } from "express";
import { AuthRequest, logger, sendResponse } from "../services";
import {
  createPost,
  deletePost,
  getPostById,
  getPosts,
  retweetPost,
  toggleLikePost,
} from "../queries";
import { HttpResponseMessages, HttpStatusCodes } from "../constants";

// Get all posts
export const handleGetPosts = async (req: AuthRequest, res: Response) => {
  try {
    let searchObj: any = { ...req.query };

    if (typeof searchObj.isReply === "string") {
      searchObj.replyTo = { $exists: searchObj.isReply === "true" };
      delete searchObj.isReply;
    }

    if (typeof searchObj.search === "string") {
      searchObj.content = { $regex: searchObj.search, $options: "i" };
      delete searchObj.search;
    }

    const posts = await getPosts(searchObj);
    logger.info("Posts fetched successfully");
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: HttpResponseMessages.SUCCESS,
      data: posts,
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
    console.log("req.body:", req.body);
    console.log("req.files:", req.files);

    // Ensure either content or media exists
    if (
      !req.body.content &&
      (!req.files || (req.files as Express.Multer.File[]).length === 0)
    ) {
      logger.error("Either content or media is required");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: "Either content or media is required",
        data: { post: null },
      });
    }

    const postData = {
      content: req.body.content || "", // If no content, default to empty string
      postedBy: req.user!.id,
      media: req.files
        ? (req.files as Express.Multer.File[]).map((file) => file.path)
        : [],
      mediaType: req.body.mediaType || (req.files?.length ? "image" : ""), // Set mediaType only if media is present
      replyTo: req.body.replyTo || undefined,
      visibility: req.body.visibility || "public",
    };

    const newPost = await createPost(postData);
    logger.info("Post created successfully");

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
      message: "Internal Server Error",
      error: error,
    });
  }
};

// Like a post
export const handleLikePost = async (req: AuthRequest, res: Response) => {
  try {
    const updatedPost = await toggleLikePost(req.params.id, req.user!.id);

    if (!updatedPost) {
      logger.error("Post not found");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.NOT_FOUND,
        message: HttpResponseMessages.NOT_FOUND,
        data: { post: null },
      });
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
    const { post, deleted } = await retweetPost(req.params.id, req.user!.id);

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

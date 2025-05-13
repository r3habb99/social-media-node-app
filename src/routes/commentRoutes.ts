import express from "express";
import { authMiddleware } from "../services";
import { validateRequest } from "../middlewares/validation.middleware";
import {
  handleCreateComment,
  handleGetCommentsForPost,
  handleGetRepliesForComment,
  handleUpdateComment,
  handleDeleteComment,
  handleLikeComment,
} from "../controllers";
import {
  createCommentSchema,
  updateCommentSchema,
  commentPaginationSchema,
} from "../validations/commentSchema";

const router = express.Router();

// Create a new comment
router.post(
  "/",
  authMiddleware,
  validateRequest(createCommentSchema),
  handleCreateComment
);

// Get comments for a post
router.get(
  "/post/:postId",
  authMiddleware,
  validateRequest(commentPaginationSchema, "query"),
  handleGetCommentsForPost
);

// Get replies for a comment
router.get(
  "/replies/:commentId",
  authMiddleware,
  validateRequest(commentPaginationSchema, "query"),
  handleGetRepliesForComment
);

// Update a comment
router.put(
  "/:commentId",
  authMiddleware,
  validateRequest(updateCommentSchema),
  handleUpdateComment
);

// Delete a comment
router.delete(
  "/:commentId",
  authMiddleware,
  handleDeleteComment
);

// Like/unlike a comment
router.put(
  "/:commentId/like",
  authMiddleware,
  handleLikeComment
);

export default router;

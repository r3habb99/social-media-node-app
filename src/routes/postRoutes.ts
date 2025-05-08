import express from "express";
import { authMiddleware, upload } from "../services";
import { validateRequest } from "../middlewares/validation.middleware";
import {
  handleCreatePost,
  handleDeletePost,
  handleGetPostById,
  handleGetPosts,
  handleLikePost,
  handleRetweetPost,
  handleUpdatePost,
} from "../controllers";
import { postSchema, updatePostSchema } from "../validations/postSchema";

const router = express.Router();

router.get("/", authMiddleware, handleGetPosts);
router.get("/:id", authMiddleware, handleGetPostById);
router.post("/", authMiddleware, upload.array("media", 5), validateRequest(postSchema), handleCreatePost);
router.put("/:id", authMiddleware, upload.array("media", 5), validateRequest(updatePostSchema), handleUpdatePost);
router.put("/:id/like", authMiddleware, handleLikePost);
router.post("/:id/retweet", authMiddleware, handleRetweetPost);
router.delete("/:id", authMiddleware, handleDeletePost);

export default router;

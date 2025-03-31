import express from "express";
import { authMiddleware, upload, validate } from "../services";
import {
  handleCreatePost,
  handleDeletePost,
  handleGetPostById,
  handleGetPosts,
  handleLikePost,
  handleRetweetPost,
} from "../controllers";
import { postSchema } from "../validations/postSchema";

const router = express.Router();

router.get("/", authMiddleware, handleGetPosts);
router.get("/:id", authMiddleware, handleGetPostById);
router.post("/", authMiddleware, validate(postSchema), handleCreatePost); //upload.array("media", 1)
router.put("/:id/like", authMiddleware, handleLikePost);
router.post("/:id/retweet", authMiddleware, handleRetweetPost);
router.delete("/:id", authMiddleware, handleDeletePost);

export default router;

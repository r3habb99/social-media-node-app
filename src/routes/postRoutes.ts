import express from "express";
import { authMiddleware, upload } from "../services";
import {
  handleCreatePost,
  handleDeletePost,
  handleGetPostById,
  handleGetPosts,
  handleLikePost,
  handleRetweetPost,
} from "../controllers";

const router = express.Router();

router.get("/", authMiddleware, handleGetPosts);
router.get("/:id", authMiddleware, handleGetPostById);
router.post("/", authMiddleware, upload.array("media"), handleCreatePost);
router.put("/:id/like", authMiddleware, handleLikePost);
router.post("/:id/retweet", authMiddleware, handleRetweetPost);
router.delete("/:id", authMiddleware, handleDeletePost);

export default router;

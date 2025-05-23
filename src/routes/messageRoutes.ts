import express from "express";
import { authMiddleware } from "../services";
import {
  createMessage,
  getMessageID,
  deleteMessage,
  editMessage,
  searchMessagesController,
  getSingleMessage
} from "../controllers";

const router = express.Router();

// Create a new message
router.post("/", authMiddleware, createMessage);

// Search messages - specific routes must come before parameter routes
router.get("/search", authMiddleware, searchMessagesController);

// Get messages for a chat
router.get("/chat", authMiddleware, getMessageID);

// Get a single message by ID
router.get("/:messageId", authMiddleware, getSingleMessage);

// Delete a message
router.delete("/:messageId", authMiddleware, deleteMessage);

// Edit a message
router.put("/:messageId", authMiddleware, editMessage);

export default router;

import express from "express";
import { authMiddleware, upload } from "../services";
import { validateRequest } from "../middlewares/validation.middleware";
import {
  createMessage,
  getMessageID,
  deleteMessage,
  editMessage,
  searchMessagesController,
  getSingleMessage
} from "../controllers";
import { messageSearchQuerySchema } from "../validations/messageSearchSchema";
import { createMessageSchema, editMessageSchema, deleteMessageSchema } from "../validations/messageSchema";

const router = express.Router();

// Create a new message (with optional media upload - up to 5 files)
// Note: Validation is handled in the controller to support both JSON and FormData
router.post("/", authMiddleware, upload.array("media", 5), createMessage);

// Search messages - specific routes must come before parameter routes
router.get("/search", authMiddleware, validateRequest(messageSearchQuerySchema, "query"), searchMessagesController);

// Get messages for a chat
router.get("/chat", authMiddleware, getMessageID);

// Get a single message by ID or all messages for a chat
router.get("/:messageId", authMiddleware, getSingleMessage);

// Delete a message
router.delete("/:messageId", authMiddleware, validateRequest(deleteMessageSchema), deleteMessage);

// Edit a message (with optional media upload - up to 5 files)
// Note: Validation is handled in the controller to support both JSON and FormData
router.put("/:messageId", authMiddleware, upload.array("media", 5), editMessage);

export default router;

import express from "express";
import {
  createChat,
  getChatMessages,
  getUserChats,
  createGroupChat,
  sendMessage,
  addUserToGroupChat,
  removeUserFromGroupChat,
  updateGroupChatName,
  archiveChatController,
  getUnreadMessagesCount,
} from "../controllers";
import { authMiddleware } from "../services";
import { validateRequest } from "../middlewares/validation.middleware";
import {
  createChatSchema,
  createGroupChatSchema,
  sendMessageSchema,
  addUserToGroupSchema,
  removeUserFromGroupSchema,
  updateGroupNameSchema,
  archiveChatSchema,
} from "../validations/chatSchema";

const router = express.Router();

// Create a new individual chat
router.post("/", authMiddleware, validateRequest(createChatSchema), createChat);

// Create a group chat
router.post(
  "/group",
  authMiddleware,
  validateRequest(createGroupChatSchema),
  createGroupChat
);

// Get all chats for the logged-in user
router.get("/", authMiddleware, getUserChats);

// Get messages for a specific chat
router.get("/:chatId/messages", authMiddleware, getChatMessages);

// Send a message in a chat
router.post(
  "/:chatId/message",
  authMiddleware,
  validateRequest(sendMessageSchema),
  sendMessage
);

// Group chat management routes
router.put(
  "/group/add-user",
  authMiddleware,
  validateRequest(addUserToGroupSchema),
  addUserToGroupChat
);
router.put(
  "/group/remove-user",
  authMiddleware,
  validateRequest(removeUserFromGroupSchema),
  removeUserFromGroupChat
);
router.put(
  "/group/update-name",
  authMiddleware,
  validateRequest(updateGroupNameSchema),
  updateGroupChatName
);

// Chat archiving
router.put(
  "/archive",
  authMiddleware,
  validateRequest(archiveChatSchema),
  archiveChatController
);

// Get unread message counts
router.get("/unread", authMiddleware, getUnreadMessagesCount);

export default router;

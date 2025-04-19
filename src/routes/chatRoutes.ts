import express from "express";
import { createChat, getChatMessages, getUserChats, createGroupChat, sendMessage } from "../controllers";
import { authMiddleware } from "../services";

const router = express.Router();

// Create a new individual chat
router.post("/", authMiddleware, createChat);

// Create a group chat
router.post("/group", authMiddleware, createGroupChat);

// Get all chats for the logged-in user
router.get("/", authMiddleware, getUserChats);

// Get messages for a specific chat
router.get("/:chatId/messages", authMiddleware, getChatMessages);

// Send a message in a chat
router.post("/:chatId/message", authMiddleware, sendMessage);

export default router;

import express from "express";
import { createChat, getChatMessages, getUserChats } from "../controllers";
import { authMiddleware } from "../services";

const router = express.Router();

router.post("/", authMiddleware, createChat);
router.get("/", authMiddleware, getUserChats);
router.get("/:chatId/messages", authMiddleware, getChatMessages);

export default router;

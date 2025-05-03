import express from "express";
import { authMiddleware } from "../services";
import { createMessage, getMessageID, deleteMessage, editMessage, searchMessagesController } from "../controllers";

const router = express.Router();

router.post("/", authMiddleware, createMessage);
router.get("/id", authMiddleware, getMessageID);
router.delete("/:messageId", authMiddleware, deleteMessage);
router.put("/:messageId", authMiddleware, editMessage);
router.get("/search", authMiddleware, searchMessagesController);

export default router;

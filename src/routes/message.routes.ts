import express from "express";
import { authMiddleware } from "../services";
import { createMessage, getMessageID } from "../controllers";

const router = express.Router();

router.post("/", authMiddleware, createMessage);
router.get("/id", authMiddleware, getMessageID);

export default router;

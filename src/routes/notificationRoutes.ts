import express from "express";
import { authMiddleware } from "../services";
import {
  handleGetLatestNotification,
  handleGetNotifications,
  handleGetNotificationById,
  handleMarkAllNotificationsAsOpened,
  handleMarkNotificationAsOpened,
} from "../controllers";

const router = express.Router();

router.get("/", authMiddleware, handleGetNotifications);
router.get("/latest", authMiddleware, handleGetLatestNotification);
router.get("/:id", authMiddleware, handleGetNotificationById);
router.put("/:id/markAsOpened", authMiddleware, handleMarkNotificationAsOpened);
router.put("/markAsOpened", authMiddleware, handleMarkAllNotificationsAsOpened);

export default router;

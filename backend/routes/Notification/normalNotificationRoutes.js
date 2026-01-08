import express from "express";
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from "../../controller/Notification/normalNotificationController.js";

const router = express.Router();

router.get("/api/normal-notifications/:emp_id", getUserNotifications);
router.put("/api/normal-notifications/read", markNotificationRead);
router.put("/api/normal-notifications/read-all", markAllNotificationsRead);

export default router;

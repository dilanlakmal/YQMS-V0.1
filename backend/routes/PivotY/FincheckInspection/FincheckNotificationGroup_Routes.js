import express from "express";
import {
  getNotificationGroup,
  addNotificationMembers,
  removeNotificationMember
} from "../../../controller/PivotY/FincheckInspection/FincheckNotificationGroup_Controller.js";

const router = express.Router();

router.get("/api/fincheck-notification-group/list", getNotificationGroup);
router.post("/api/fincheck-notification-group/add", addNotificationMembers);
router.delete(
  "/api/fincheck-notification-group/delete/:id",
  removeNotificationMember
);

export default router;

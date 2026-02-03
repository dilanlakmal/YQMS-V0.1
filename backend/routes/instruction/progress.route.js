import express from "express";
import ProgressController from "../../controller/instruction/progress.controller.js";

const router = express.Router();

router.get("/:userId", ProgressController.getProgressByUser);
router.get("/:userId/:toLang", ProgressController.getProgressByUserLanguage);
router.patch("/update/:userId/:progressId/status", ProgressController.updateStatus);
router.patch("/:userId/:progressId", ProgressController.updateProgress);

export default router;
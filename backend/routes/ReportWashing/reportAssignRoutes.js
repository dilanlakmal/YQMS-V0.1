import express from "express";
import { getAssignControl, saveAssignControl } from "../../controller/ReportWashing/reportAssignController.js";

const router = express.Router();

router.get("/api/assign-control", getAssignControl);
router.post("/api/assign-control", saveAssignControl);

export default router;

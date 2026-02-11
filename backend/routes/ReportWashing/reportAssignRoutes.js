import express from "express";
import { getAssignControl, saveAssignControl, updateAssignControl } from "../../controller/ReportWashing/reportAssignController.js";

const router = express.Router();

router.get("/api/assign-control", getAssignControl);
router.post("/api/assign-control", saveAssignControl);
router.put("/api/assign-control/:id", updateAssignControl);

export default router;

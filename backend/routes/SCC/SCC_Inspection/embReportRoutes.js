import express from "express";
import { saveEMBReport } from "../../../controller/SCC/SCC_Inspection/embReportController.js";

const router = express.Router();

router.post("/api/scc/emb-report", saveEMBReport);

export default router;

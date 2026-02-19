import express from "express";
import { getMarkerRatioData } from "../../controller/SQL/FCSystemController.js";

const router = express.Router();

router.get("/api/fc-system/marker-ratio", getMarkerRatioData);

export default router;

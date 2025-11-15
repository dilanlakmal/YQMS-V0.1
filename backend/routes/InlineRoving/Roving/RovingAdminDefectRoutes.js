import express from "express";
import {
  getSewingDefects,
  getDefectDefinition,
  searchUsers,
  getSewingDefectOptiond,
  addSevingDefect,
  deleteSewingDefect
} from "../../../controller/InlineRoving/Roving/RovingAdminDefctController.js";

const router = express.Router();

router.get("/api/sewing-defects", getSewingDefects);
router.get("/api/defect-definitions", getDefectDefinition);
router.get("/api/roving-users/search-by-empid", searchUsers);
router.get("/api/sewing-defects/options", getSewingDefectOptiond);
router.post("/api/sewing-defects", addSevingDefect);
router.delete("/api/sewing-defects/:code", deleteSewingDefect);

export default router;

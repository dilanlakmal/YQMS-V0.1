import express from "express";
import {
  CreateTemplate,
  GetTemplates,
  UpdateTemplate,
  DeleteTemplate,
  GetCategoriesForSelection
} from "../../../controller/PivotY/QATemplates/QATemplatesReport_Controller.js";

const router = express.Router();

router.post("/api/qa-sections-templates", CreateTemplate);
router.get("/api/qa-sections-templates", GetTemplates);
router.put("/api/qa-sections-templates/:id", UpdateTemplate);
router.delete("/api/qa-sections-templates/:id", DeleteTemplate);

// Helper to populate the modal
router.get("/api/qa-sections-templates/categories", GetCategoriesForSelection);

export default router;

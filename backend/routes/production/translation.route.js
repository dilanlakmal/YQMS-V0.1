
import express from "express";
import azureTranslateController from "../../controller/production/instruction/translation.controller.js";

const router = express.Router();

/**
 * POST /translation
 * Triggers the Azure Document Translation workflow.
 */
router.post("/translation", azureTranslateController);

export default router;

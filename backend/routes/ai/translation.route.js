
import express from "express";
import azureTranslateController, { getLanguages } from "../../controller/ai/instruction/translation.controller.js";

const router = express.Router();

/**
 * GET /languages
 * Returns supported languages for translation.
 */
router.get("/languages", getLanguages);

/**
 * POST /translation
 * Triggers the Azure Document Translation workflow.
 */
router.post("/translation", azureTranslateController);

export default router;

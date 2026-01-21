
import express from "express";
import documentController from "../../controller/production/instruction/document.controller.js";
import pageExtractor, { getPageLang } from "../../controller/production/instruction/extraction/page.extraction.controller.js";
import { updateProduction } from "../../controller/production/production.controller.js";
import { uploadPdf } from "../../middleware/fileUpload.js";

const router = express.Router();

/**
 * @route   POST /api/ai/production/instruction/extraction/document
 * @desc    Upload start document for processing
 * @access  Private (TODO: Add Auth)
 */
router.post("/document", uploadPdf.single("file"), documentController);

/**
 * @route   POST /api/ai/production/instruction/extraction/page-extraction
 * @desc    Extract pages from the uploaded document
 */
router.post("/page-extraction", pageExtractor);

/**
 * @route   GET /api/ai/production/instruction/extraction/page-language
 * @desc    Detect language of the page
 */
router.get("/page-language", getPageLang);

/**
 * @route   POST /api/ai/production/instruction/extraction/update-production/:id
 * @desc    Update production record manually
 */
router.post("/update-production/:id", updateProduction);

export default router;

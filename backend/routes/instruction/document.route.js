import documentController from "../../controller/instruction/document.controller.js";
import express from "express";
import { uploadPdf } from "../../middleware/fileUpload.js";


const router = express.Router();

// Specific/Static routes first to avoid parameter collision
router.get("/languages", documentController.translate.getSupportedLanguages);
router.post("/detect", documentController.translate.detectLanguage);
router.post("/translate", documentController.translate.translate);
router.post("/translate/static", documentController.translate.translateStaticContent);
router.post("/upload", uploadPdf.single("file"), documentController.upload);

// Storage routes
router.get("/storage/:container", documentController.storage.getBlobsByContainer);
router.delete("/storage/:container", documentController.storage.deleteBlobsByContainer);

// Extract routes
router.post("/extract/:docId", documentController.extract.extractFields);
router.patch("/instruction/:docId", documentController.translate.updateInstruction);

// Resource-specific routes with parameters
router.post("/:userId/convert/:docId", documentController.extract.convertPdfToImage);
router.get("/:userId/instruction/:docId", documentController.extract.getInstruction);

// New Instruction Endpoints
router.get("/instruction/:instructionId/html", documentController.translate.getHTMLFile);
router.get("/instruction/:instructionId/translated/:languageCode", documentController.translate.getInstructionTranslated);
router.patch("/:userId/active/:docId", documentController.setActiveDocument);

// Generic User routes last
router.get("/:userId", documentController.getDocsByUser);
router.delete("/:userId", documentController.deleteAllByUser);
router.delete("/:userId/:docId", documentController.deleteOneByUser);


export default router;


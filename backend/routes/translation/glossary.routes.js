import express from "express";
import glossaryController from "../../controller/translation/glossary.controller.js";

const router = express.Router();

// CRUD operations
router.post("/", glossaryController.addEntry);
router.get("/", glossaryController.getEntries);
router.delete("/:id", glossaryController.deleteEntry);

// Bulk operations
router.post("/export", glossaryController.exportFromInstruction);

export default router;

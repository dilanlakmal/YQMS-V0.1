import documentController from "../../controller/instruction/document.controller.js";
import express from "express";
import { uploadPdf } from "../../middleware/fileUpload.js";


const router = express.Router();

router.post("/upload", uploadPdf.single("file"), documentController.upload);
router.get("/:userId", documentController.getDocsByUser);
router.delete("/:userId", documentController.deleteAllByUser);
router.delete("/:userId/:docId", documentController.deleteOneByUser);
router.patch("/:userId/active/:docId", documentController.setActiveDocument);
router.get("/storage/:container", documentController.storage.getBlobsByContainer);
router.delete("/storage/:container", documentController.storage.deleteBlobsByContainer);


export default router;


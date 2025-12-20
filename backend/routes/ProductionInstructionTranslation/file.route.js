import express from "express";
import { splitPDF, convertPdf } from "../../controller/ProductionInstructionTranslation/file.controller.js";


const router = express.Router();

router.post("/pdf/split", splitPDF);
router.get("/pdf/to/json", convertPdf);

export default router;



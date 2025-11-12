import express from "express";
import translateText from "../../controller/translate-text/translateTextController.js";

const router = express.Router();

// POST /api/translate-text - Translate text
router.post("/api/translate-text", translateText);

export default router;
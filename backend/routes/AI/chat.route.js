import express from "express";

import { chat, models } from "../../controller/AI/chat.controller.js";

const router = express.Router();

router.post("/", chat)
router.get("/", models)

export default router;
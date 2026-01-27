import express from "express";

import { chat, models } from "../../controller/ai/chatbot/chat.controller.js";

const router = express.Router();

router.post("/", chat)
router.get("/", models)

export default router;
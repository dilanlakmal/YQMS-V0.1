import express from "express";

import { getChatWithOllama } from "../../controller/AI/chat.controller.js";

const router = express.Router();

router.post("/", getChatWithOllama)

export default router;
import express from "express";

import { chat } from "../../controller/AI/chat.controller.js";

const router = express.Router();

router.post("/", chat)

export default router;
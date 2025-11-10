
import express from 'express';
import { askQuesctionAI } from '../../controller/AI/AIChatBotController.js';
const router = express.Router();

router.post('/api/ai/ask', askQuesctionAI); 

export default router;
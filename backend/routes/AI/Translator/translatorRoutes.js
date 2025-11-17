
import express from 'express';
import { askToTranslate} from '../../../controller/AI/Translator/translatorController.js';
const router = express.Router();

router.post('/api/translate', askToTranslate); 

export default router;
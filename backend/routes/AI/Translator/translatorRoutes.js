
import express from 'express';
import { askToTranslate,
  extractTextFromImage,
  translateWithGemini,
} from '../../../controller/AI/Translator/translatorController.js';
import {
   tanslatorImage
} from "../../../helpers/helperFunctions.js";
const router = express.Router();

router.post('/api/translate', askToTranslate); 
router.post('/api/translator/ocr',tanslatorImage.single('image'), extractTextFromImage); 
router.post('/api/translate-gemini', tanslatorImage.single('file'), translateWithGemini);


export default router; 
import express from 'express';
import { 
    getMeasurementDataByStyle, 
    getMatchingStyleNos,
    getTemplateByBuyer,
    getTemplateByStyleNo, 
} from '../../controller/Measurement/measurementController.js';

const router = express.Router();

router.get('/api/measurement/styles/search', getMatchingStyleNos);
router.get('/api/measurement/:styleNo', getMeasurementDataByStyle);
router.get('/api/measurement/buyer-template/:buyerName', getTemplateByBuyer); // Kept for other potential uses
router.get('/api/measurement/template-by-style/:styleNo', getTemplateByStyleNo); // New endpoint

export default router;

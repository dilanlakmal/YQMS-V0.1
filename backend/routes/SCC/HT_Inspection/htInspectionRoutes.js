import express from 'express';
import {
   saveHtInspectionReport,
   loadHtInspectionReport,
} from '../../../controller/SCC/HT_Inspection/htInspectionController.js'

const router = express.Router();

router.get('/api/scc/ht-inspection-report',  saveHtInspectionReport);
router.get('/api/scc/ht-inspection-report',  loadHtInspectionReport);


export default router;
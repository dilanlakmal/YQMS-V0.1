import express from 'express';
import {
   saveHtInspectionReport,
   loadHtInspectionReport,
} from '../../../controller/SCC/SCC_Inspection/htInspectionController.js'

const router = express.Router();

router.post('/api/scc/ht-inspection-report',  saveHtInspectionReport);
router.get('/api/scc/ht-inspection-report',  loadHtInspectionReport);


export default router;

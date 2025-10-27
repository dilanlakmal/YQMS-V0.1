import express from 'express';
import {
   saveEMBReport,
} from '../../../controller/SCC/EMB_Report/embReportController.js'

const router = express.Router();

router.get('/api/scc/emb-report',  saveEMBReport);


export default router;
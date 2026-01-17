import express from 'express';
import {
    getFailedReports,
    markAsDownloaded
} from '../../../controller/PivotY/P88Data/p88failedReportController.js';
import { downloadSingleReportDirect } from '../../../controller/PivotY/P88Data/downoloadP88ReportController.js';

const router = express.Router();

router.get('/api/p88failedReport/failed-reports', getFailedReports);
router.post('/api/p88failedReport/failed-reports/mark-downloaded', markAsDownloaded);
router.post('/api/p88failedReport/download-single', downloadSingleReportDirect);

export default router;

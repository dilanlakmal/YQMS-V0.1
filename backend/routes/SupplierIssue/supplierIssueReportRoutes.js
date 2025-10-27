import express from 'express';
import {
   getSupplierIssueReport,
   saveSupplierIssueReport,
   getSupplierIssueReportSummary,
   getSupplierIssueReportOptions,
} from '../../controller/SupplierIssue/supplierIssueReportController.js';

const router = express.Router();

router.get('/api/supplier-issues/reports/find-existing',  getSupplierIssueReport);
router.post('/api/supplier-issues/reports', saveSupplierIssueReport);
router.get('/api/supplier-issues/reports/summary', getSupplierIssueReportSummary);
router.get('/api/supplier-issues/report-options', getSupplierIssueReportOptions);

export default router;
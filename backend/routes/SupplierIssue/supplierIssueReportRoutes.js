import express from 'express';
import {
   getSupplierIssueReportSummary,
   getSupplierIssueReportOptions,
} from '../../controller/SupplierIssue/supplierIssueReportController.js';

const router = express.Router();

router.get('/api/supplier-issues/reports/summary', getSupplierIssueReportSummary);
router.get('/api/supplier-issues/report-options', getSupplierIssueReportOptions);

export default router;
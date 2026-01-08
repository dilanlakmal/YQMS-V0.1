import express from 'express';
import {
   getSupplierIssueReport,
   saveSupplierIssueReport,
} from '../../controller/SupplierIssue/supplierIssueInspectionController.js';

const router = express.Router();

router.get('/api/supplier-issues/reports/find-existing', getSupplierIssueReport);
router.post('/api/supplier-issues/reports', saveSupplierIssueReport);
export default router;
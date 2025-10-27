import express from 'express';
import {
   getSupplierIssueDefects,
   getSupplierIssueFactoryTypes,
   saveSupplierIssureDefect,
   saveSupplierIssueFactoryType,
   updateSupplierIssueFactoryType,
   deleteSupplierIssueFactoryType,
   saveSupplierIssuesDefect,
   updateSupplierIssueDefect,
   deleteSupplierIssueDefect,
} from '../../controller/SupplierIssue/supplierController.js';

const router = express.Router();

router.get('/api/supplier-issues/defects',  getSupplierIssueDefects);
router.get('/api/supplier-issues/defects/:factoryType', getSupplierIssueFactoryTypes);
router.post('/api/supplier-issues/defects', saveSupplierIssureDefect);
router.post('/api/supplier-issues/defects/:factoryType/factories', saveSupplierIssueFactoryType);
router.put('/api/supplier-issues/defects/:factoryType/factories', updateSupplierIssueFactoryType);
router.delete('/api/supplier-issues/defects/:factoryType/factories', deleteSupplierIssueFactoryType);
router.post('/api/supplier-issues/defects/:factoryType/defects', saveSupplierIssuesDefect);
router.put('/api/supplier-issues/defects/:factoryType/defects/:defectId', updateSupplierIssueDefect);
router.delete('/api/supplier-issues/defects/:factoryType/defects/:defectId',deleteSupplierIssueDefect);

export default router;
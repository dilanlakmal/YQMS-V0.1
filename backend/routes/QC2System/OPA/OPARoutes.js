import express from 'express';
import {
  getOPAId,
  getOPADefectId,
  getLastOPAId,
  saveOPA,
  getOPARecords,
  getOpaFilterOptions,
  getUserOPATasks,
} from '../../../controller/QC2System/OPA/OPAController.js';

const router = express.Router();

router.get('/api/check-opa-exists/:bundleId', getOPAId);
router.get('/api/check-defect-card-opa/:defectPrintId', getOPADefectId);
router.get('/api/last-opa-record-id/:emp_id', getLastOPAId);
router.post('/api/save-opa', saveOPA);
router.get('/api/opa-records', getOPARecords);
router.get('/api/opa-records/distinct-filters', getOpaFilterOptions);
router.get("/api/opa-records/user-opa-tasks/:emp_id", getUserOPATasks);

export default router;
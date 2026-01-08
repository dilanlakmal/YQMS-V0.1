import express from 'express';
import {
  checkUserAccess,
  getAccessSummary,
  getUniqueTaskNumbers,
  getUserTaskAccess,
} from '../../../controller/QC2System/IEAdmin/IEQCRolerManagementController.js';

const router = express.Router();

router.get('/api/ie/role-management/access-check', checkUserAccess);
router.get('/api/ie/role-management/summary',getAccessSummary);
router.get('/api/ie/tasks-by-department', getUniqueTaskNumbers);
router.get('/api/ie/user-task-access/:emp_id', getUserTaskAccess);

export default router;
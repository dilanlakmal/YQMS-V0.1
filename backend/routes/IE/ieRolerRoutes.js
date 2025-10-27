import express from 'express';
import {
  checkUserAccess,
  getAccessSummary,
  getUserTaskAccess,
} from '../../controller/IE/ieRoleController.js';

const router = express.Router();

router.get('/api/ie/role-management/access-check', checkUserAccess);
router.get('/api/ie/role-management/summary',getAccessSummary);
router.get('/api/ie/user-task-access/:emp_id', getUserTaskAccess);

export default router;
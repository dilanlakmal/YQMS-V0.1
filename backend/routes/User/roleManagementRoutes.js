import express from 'express';
import {
  manageRole,
  getUserRoles,
  getRoleManagement,
  registerSuperAdmin,
  deleteSuperAdmin,
} from '../../Controller/User/roleManagementController.js';

const router = express.Router();
router.post('/api/role-management', manageRole);
router.get('/api/user-roles/:empId', getUserRoles);
router.get('/api/role-management', getRoleManagement);
router.post('/api/role-management/super-admin', registerSuperAdmin);
router.delete('/api/role-management/super-admin/:empId',deleteSuperAdmin);

export default router;
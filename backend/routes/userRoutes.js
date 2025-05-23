import express from 'express';
import {
  searchUser,
  getUserDetails,
  getJobTitles,
  getUsersByJobTitle,
  manageRole,
  getUserRoles,
  getRoleManagement,
  registerSuperAdmin,
  deleteSuperAdmin,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getUsersPaginated,
  getSections,
  getUserByEmpId,
  getQc2FilterOptions,
  getQcInlineRovingQcIds,
  getDigitalMeasurementFilterOptions,
  getBuyerList,
  getWashingAutocomplete,
  getIroningAutocomplete,
  getOpaAutocomplete,
} from '../Controller/UserController/userController.js';

const router = express.Router();

router.get('/api/search-user', searchUser);
router.get('/api/user-details', getUserDetails);
router.get('/api/job-titles', getJobTitles);
router.get('/api/users-by-job-title', getUsersByJobTitle);
router.post('/api/role-management', manageRole);
router.get('/api/user-roles/:empId', getUserRoles);
router.get('/api/role-management', getRoleManagement);
router.post('/api/role-management/super-admin', registerSuperAdmin);
router.delete('/api/role-management/super-admin/:empId', deleteSuperAdmin);
router.get('/users', getAllUsers); 
router.post('/users', createUser); 
router.put('/users/:id', updateUser); 
router.delete('/users/:id', deleteUser); 
router.get('/api/users-paginated', getUsersPaginated);
router.get('/api/sections', getSections);
router.get('/api/user-by-emp-id', getUserByEmpId);
router.get('/api/qc2-inspection-pass-bundle/filter-options', getQc2FilterOptions);
router.get('/api/qc-inline-roving-qc-ids', getQcInlineRovingQcIds);
router.get('/api/filter-options', getDigitalMeasurementFilterOptions);
router.get('/api/buyers', getBuyerList);
router.get('/api/washing-autocomplete', getWashingAutocomplete);
router.get('/api/ironing-autocomplete', getIroningAutocomplete);
router.get('/api/opa-autocomplete', getOpaAutocomplete);

export default router;
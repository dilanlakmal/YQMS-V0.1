import express from 'express';
import {
  searchUser,
  getUserDetails,
  getJobTitles,
  getUsersByJobTitle,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getUsersPaginated,
  getSections,
  getUserByEmpId,
  getUserByEmpIdForInspector,
  searchUsersByEmpIdOrName,
  getWorkingUsers
} from '../../controller/User/userController.js';

const router = express.Router();

router.get('/api/search-users', searchUser);
router.get('/api/user-details', getUserDetails);
router.get('/api/job-titles', getJobTitles);
router.get('/api/users-by-job-title', getUsersByJobTitle);

router.get('/api/users', getAllUsers); 
router.post('/api/users', createUser); 
router.put('/api/users/:id', updateUser); 
router.delete('/api/users/:id', deleteUser); 
router.get('/api/users-paginated', getUsersPaginated);
router.get('/api/sections', getSections);
router.get('/api/user-by-emp-id', getUserByEmpId);
router.get('/api/users/:emp_id', getUserByEmpIdForInspector);
router.get('/api/users/search', searchUsersByEmpIdOrName);
router.get('/api/users', getWorkingUsers);

export default router;
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
} from '../../Controller/User/userController.js';

const router = express.Router();

router.get('/api/search-user', searchUser);
router.get('/api/user-details', getUserDetails);
router.get('/api/job-titles', getJobTitles);
router.get('/api/users-by-job-title', getUsersByJobTitle);

router.get('/users', getAllUsers); 
router.post('/users', createUser); 
router.put('/users/:id', updateUser); 
router.delete('/users/:id', deleteUser); 
router.get('/api/users-paginated', getUsersPaginated);
router.get('/api/sections', getSections);
router.get('/api/user-by-emp-id', getUserByEmpId);

export default router;
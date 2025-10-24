import express from 'express';
import {
  saveTask,
  getFilterOptions,
  updateTask,
  deleteTask,
} from '../../controller/IE/ieController.js';

const router = express.Router();

router.post('/api/ie/tasks', saveTask);
router.get('/api/ie/tasks/filter-options', getFilterOptions);
router.put('/api/ie/tasks/:id', updateTask);
router.delete('/api/ie/tasks/:id', deleteTask);

export default router;
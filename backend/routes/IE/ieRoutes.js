import express from 'express';
import {
  saveTask,
  getFilterOptions,
  updateTask,
  deleteTask,
  getAllFilterOptions,
  getWorkerData,
  getAllAssignedTasks,
  updateWorkerTasks,
  assignTasksToAllWorkers,
  getBulkAssignmentSummary,
  getUniqueTaskNumbers,
} from '../../controller/IE/ieController.js';

const router = express.Router();

router.post('/api/ie/tasks', saveTask);
router.get('/api/ie/tasks/filter-options', getFilterOptions);
router.put('/api/ie/tasks/:id', updateTask);
router.delete('/api/ie/tasks/:id', deleteTask);
router.get('/api/ie/worker-assignment/filter-options', getAllFilterOptions);
router.post('/api/ie/worker-assignment/workers', getWorkerData);
router.get('/api/ie/worker-assignment/all-tasks', getAllAssignedTasks);
router.put('/api/ie/worker-assignment/tasks/:emp_id', updateWorkerTasks);
router.post('/api/ie/bulk-assignment/by-job-title', assignTasksToAllWorkers);
router.get('/api/ie/bulk-assignment/summary', getBulkAssignmentSummary);
router.get('/api/ie/tasks-by-department', getUniqueTaskNumbers);

export default router;
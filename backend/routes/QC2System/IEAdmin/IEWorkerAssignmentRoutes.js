import express from 'express';
import {
  getAllFilterOptions,
  getWorkerData,
  getAllAssignedTasks,
  updateWorkerTasks,
  assignTasksToAllWorkers,
  getBulkAssignmentSummary,
} from '../../../controller/QC2System/IEAdmin/IEWorkerAssignementController.js';

const router = express.Router();

router.get('/api/ie/worker-assignment/filter-options', getAllFilterOptions);
router.post('/api/ie/worker-assignment/workers', getWorkerData);
router.get('/api/ie/worker-assignment/all-tasks', getAllAssignedTasks);
router.put('/api/ie/worker-assignment/tasks/:emp_id', updateWorkerTasks);
router.post('/api/ie/bulk-assignment/by-job-title', assignTasksToAllWorkers);
router.get('/api/ie/bulk-assignment/summary', getBulkAssignmentSummary);

export default router;
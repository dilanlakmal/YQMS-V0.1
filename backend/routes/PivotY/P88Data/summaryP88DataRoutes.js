import express from 'express';
import {
  getAllInspections,
  getDashboardStats,
  searchInspections,
  getInspectionsByGroup,
  getInspectionById,
  getFilterOptions
} from '../../../controller/PivotY/P88Data/summaryP88DataController.js';

const router = express.Router();

// GET /api/p88-data - Get all inspections with filtering and pagination
router.get('/api/p88-data/filter-options', getFilterOptions);
router.get('/api/p88-data', getAllInspections);
router.get('/api/p88-data/dashboard', getDashboardStats);
router.get('/api/p88-data/search', searchInspections);
router.get('/api/p88-data/group/:groupNumber', getInspectionsByGroup);
router.get('/api/p88-data/:id', getInspectionById);

export default router;

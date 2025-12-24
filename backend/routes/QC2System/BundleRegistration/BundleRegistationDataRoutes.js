import express from 'express';
import {

  editBundleData,
  getUserBatchers,
  fetchFilteredBundleData,
  getDistinctFilters,
} from '../../../controller/QC2System/BundleRegistration/BundleRegistrationDataController.js';

const router = express.Router();

router.put('/api/update-bundle-data/:id', editBundleData);
router.get('/api/filtered-bundle-data', fetchFilteredBundleData);
router.get('/api/bundle-data/distinct-filters', getDistinctFilters);
router.get('/api/user-batches', getUserBatchers);


export default router;
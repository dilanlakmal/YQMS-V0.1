import express from 'express';
import {
  searchQC2OrderData,
  fetchColorsAndSizes,
  getDistinctReprintFilters,
} from '../../../controller/QC2System/BundleRegistration/BundleRegistrationReprintController.js';

const router = express.Router();

router.get('/api/reprint-search', searchQC2OrderData);
router.get('/api/reprint-colors-sizes/:mono', fetchColorsAndSizes);
router.get('/api/reprint-distinct-filters', getDistinctReprintFilters);

export default router;
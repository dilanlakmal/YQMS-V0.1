import express from 'express';
import {
  getUniqueValues,
  getFilteredData,
} from '../../controller/DownloadData/downloadDataController.js';

const router = express.Router();

router.get('/api/unique-values', getUniqueValues);
router.get('/api/download-data', getFilteredData);

export default router;
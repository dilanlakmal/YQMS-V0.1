import express from 'express';
import {
  searchMoNumbers,
  getMeasurementPoints,
  getUniquePanelIndexNames,
  updateMeasurementPoint,
  deleteMeasurementPoint,
} from '../../../controller/Cutting/Cutting_Admin_MeasurementPoint/cuttingMeasurementPointEditController.js';

const router = express.Router();


router.get('/api/cutting-measurement-mo-numbers', searchMoNumbers);
router.get('/api/cutting-measurement-points', getMeasurementPoints);
router.get('/api/cutting-measurement-panel-index-names-by-mo', getUniquePanelIndexNames);
router.put('/api/update-measurement-point/:id', updateMeasurementPoint);
router.delete('/api/delete-measurement-point/:id', deleteMeasurementPoint);

export default router;
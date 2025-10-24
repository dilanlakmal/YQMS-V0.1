import express from 'express';
import {
  getCutMeasurmentPanel,
  getPanelIndexNames,
  getMaxPanelIndex,
  saveMeasurementPoint,
  searchMoNumbers,
  getMeasurementPoints,
  getUniquePanelIndexNames,
  updateMeasurementPoint,
} from '../../controller/Cutting/cuttingMeasurementController.js';

const router = express.Router();

router.get('/api/cutting-measurement-panels', getCutMeasurmentPanel);
router.get('/api/cutting-measurement-panel-index-names', getPanelIndexNames);
router.get('/api/cutting-measurement-max-panel-index', getMaxPanelIndex);
router.post('/api/save-measurement-point', saveMeasurementPoint);
router.get('/api/cutting-measurement-mo-numbers', searchMoNumbers);
router.get('/api/cutting-measurement-points', getMeasurementPoints);
router.get('/api/cutting-measurement-panel-index-names-by-mo', getUniquePanelIndexNames);
router.put('/api/update-measurement-point/:id', updateMeasurementPoint);

export default router;
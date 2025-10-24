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
  getMeasurementIssues,
  deleteMeasurementPoint,
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
router.get('/api/cutting-report-measurement-issues/:id', getMeasurementIssues);
router.delete('/api/delete-measurement-point/:id', deleteMeasurementPoint);

export default router;
import express from 'express';
import {
  getCutMeasurmentPanel,
  getPanelIndexNames,
  getMaxPanelIndex,
  saveMeasurementPoint,
} from '../../../controller/Cutting/Cutting_Admin_MeasurementPoint/cuttingMeasurementPointController.js';

const router = express.Router();

router.get('/api/cutting-measurement-panels', getCutMeasurmentPanel);
router.get('/api/cutting-measurement-panel-index-names', getPanelIndexNames);
router.get('/api/cutting-measurement-max-panel-index', getMaxPanelIndex);
router.post('/api/save-measurement-point', saveMeasurementPoint);

export default router;
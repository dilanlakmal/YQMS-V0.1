import express from 'express';
import {
  getCuttingFilterMo,
  getCuttingFilterTable,
  getCuttingFilterBuyer,
  getCuttingFiltergarment,
  getCuttingPart,
  getGarmentTypeTrend,
  getMeasurementPointsTrend,
  getFabricDefectTrend,
  getTopMeasurementIssues,
  getTopDefectIssues,
} from '../../../controller/Cutting/Cutting_Trend/cuttingTrendController.js';

const router = express.Router();

router.get('/api/cutting/filter-options/mo-numbers', getCuttingFilterMo);
router.get('/api/cutting/filter-options/table-numbers', getCuttingFilterTable);
router.get('/api/cutting/filter-options/buyers', getCuttingFilterBuyer);
router.get('/api/cutting/filter-options/garment-types', getCuttingFiltergarment);
router.get('/api/cutting/part-names', getCuttingPart);
router.get('/api/cutting/trend/garment-type', getGarmentTypeTrend);
router.get('/api/cutting/trend/measurement-points', getMeasurementPointsTrend);
router.get('/api/cutting/trend/fabric-defects', getFabricDefectTrend);
router.get('/api/cutting/trend/top-measurement-issues', getTopMeasurementIssues);
router.get('/api/cutting/trend/top-defect-issues', getTopDefectIssues);

export default router;
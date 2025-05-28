import express from 'express';
import {
  getFilterOptions,
  getBuyerSpecOrderDetails,
  getPaginatedMONos,
  getMeasurementSummary,
  getPaginatedMeasurementSummary,
  getMeasurementDetailsByMono,
  updateMeasurementValue,
  deleteMeasurementRecord,
} from '../../Controller/DigitalMeasurement/measurementController.js';

const router = express.Router();

router.get('/api/filter-options', getFilterOptions);
router.get('/api/buyer-spec-order-details/:mono', getBuyerSpecOrderDetails);
router.get('/api/paginated-monos', getPaginatedMONos);
router.get('/api/measurement-summary', getMeasurementSummary);
router.get('/api/measurement-summary-per-mono', getPaginatedMeasurementSummary);
router.get('/api/measurement-details/:mono', getMeasurementDetailsByMono);
router.put('/api/update-measurement-value', updateMeasurementValue);
router.delete('/api/delete-measurement-record', deleteMeasurementRecord);

export default router;
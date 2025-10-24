import express from 'express';
import {
  getQCRovingReports,
  getFilteredQCRovingReports,
  getQCInlineRovingMOs,
  // getQCInlineRovingBuyers,
  // getQCInlineRovingOperations,
  // getQCInlineRovingQCIDs,
  saveQCInlineRovingData,
  // getInspectionNumber,
  getCompletedInspectOperators,
  getBuyerStatus,
  getFilterQCInlineRoving,
  searchMoNumbers,
  getInlineOrderDetails,
} from '../../controller/QCInlineRoving/qcinlineRovingController.js';


const router = express.Router();

router.get('/api/qc-inline-roving-reports',  getQCRovingReports );
router.get('/api/qc-inline-roving-reports-filtered',  getFilteredQCRovingReports );
router.get('/api/qc-inline-roving-mo-nos',  getQCInlineRovingMOs );
// router.get('/api/qc-inline-roving-buyers',  getQCInlineRovingBuyers );
// router.get('/api/qc-inline-roving-operations',  getQCInlineRovingOperations );
// router.get('/api/qc-inline-roving-qc-ids',  getQCInlineRovingQCIDs );
router.post('/api/save-qc-inline-roving', saveQCInlineRovingData );
// router.get('/api/qc-inline-roving/inspection-time-info',  getInspectionNumber );
router.get('/api/inspections-completed',  getCompletedInspectOperators );
router.get('/api/buyer-by-mo',  getBuyerStatus );
router.get('/api/qc-inline-roving-reports/filtered',  getFilterQCInlineRoving );
router.get('/api/inline-orders-mo-numbers',  searchMoNumbers );
router.get('/api/inline-orders-details',  getInlineOrderDetails );

export default router;
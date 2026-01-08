import express from 'express';
import {
  // deleteSewingDefect,
  getAllDefectDetails,
  getAllBuyers,
  updateBuyerStatuses,
} from '../../../controller/InlineRoving/Roving/RovingAdminDefectBuyerStatusController.js';

const router = express.Router();

// router.delete('/api/sewing-defects/:defectCode', deleteSewingDefect);
router.get('/api/defects/all-details', getAllDefectDetails);
router.get('/api/buyers', getAllBuyers);
router.post('/api/sewing-defects/buyer-statuses', updateBuyerStatuses);

export default router;
import express from 'express';
import {
  getSewingDefects,
  deleteSewingDefect,
  getAllDefectDetails,
  getAllBuyers,
  updateBuyerStatuses
} from '../../Controller/Defects/sewingDefectController.js';

const router = express.Router();

router.get('/api/sewing-defects', getSewingDefects);
router.delete('/api/sewing-defects/:defectCode', deleteSewingDefect);
router.get('/api/defects/all-details', getAllDefectDetails);
router.get('/api/buyers', getAllBuyers);
router.post('/api/sewing-defects/buyer-statuses', updateBuyerStatuses);

export default router;
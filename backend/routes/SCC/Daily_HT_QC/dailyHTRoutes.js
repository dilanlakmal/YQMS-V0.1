import express from 'express';
import {
  getActiveMos,
  getMoDetailsForRegistration,
  getSpecsForRegistration,
} from '../../../controller/SCC/Daily_HT_QC/dailyHTController.js'

const router = express.Router();

router.get('/api/scc/ht-first-output/search-active-mos', getActiveMos);
router.get('/api/scc/ht-first-output/mo-details-for-registration', getMoDetailsForRegistration);
router.get('/api/scc/ht-first-output/specs-for-registration', getSpecsForRegistration);

export default router;
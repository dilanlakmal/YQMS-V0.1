import express from 'express';
import {
  saveBuyerSpecTemplate,
  getBuyerSpecMoNos,
  getBuyerSpecData,
  updateBuyerSpecTemplate,
} from '../../controller/Common/DTOrdersBuyerSpecController.js';

const router = express.Router();

router.post('/api/buyer-spec-templates', saveBuyerSpecTemplate);
router.get('/api/buyer-spec-templates/mo-options', getBuyerSpecMoNos);
router.get('/api/edit-specs-data/:moNo', getBuyerSpecData);
router.put('/api/buyer-spec-templates/:moNo', updateBuyerSpecTemplate);

export default router;
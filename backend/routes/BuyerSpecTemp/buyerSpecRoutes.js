import express from 'express';
import {
  saveBuyerSpecTemplate,
  getBuyerSpecMoNos,
  getBuyerSpecData,
  updateBuyerSpecTemplate,
} from '../../controller/BuyerSpecTemp/buyerSpecController.js';

const router = express.Router();

router.get('/api/buyer-spec-templates', saveBuyerSpecTemplate);
router.get('/api/buyer-spec-templates/mo-options', getBuyerSpecMoNos);
router.get('/api/edit-specs-data/:moNo', getBuyerSpecData);
router.put('/api/buyer-spec-templates/:moNo', updateBuyerSpecTemplate);

export default router;
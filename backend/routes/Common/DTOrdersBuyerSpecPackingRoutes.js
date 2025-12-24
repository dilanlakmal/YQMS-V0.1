import express from "express";
import {
  saveBuyerSpecTemplateM2,
  getBuyerSpecMoNosM2,
  getBuyerSpecDataM2,
  updateBuyerSpecTemplateM2
} from "../../controller/Common/DTOrdersBuyerSpecPackingController.js";

const router = express.Router();

router.post("/api/buyer-spec-templates-m2", saveBuyerSpecTemplateM2);
router.get("/api/buyer-spec-templates-m2/mo-options", getBuyerSpecMoNosM2);
router.get("/api/edit-specs-data-m2/:moNo", getBuyerSpecDataM2);
router.put("/api/buyer-spec-templates-m2/:moNo", updateBuyerSpecTemplateM2);

export default router;

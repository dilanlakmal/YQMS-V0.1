import express from "express";
import {
    getMoNoSearchWashing,
    getOrderDetailsWashing,
    getOrderSizesWashing,
    getWashingOrderDetailsStrict,
    getMeasurmentSpecWashing
} from "../../controller/Common/WashingOrdersController.js";

const router = express.Router();

router.get("/api/washing/search-mono", getMoNoSearchWashing);
router.get("/api/washing/order-details/:mono", getOrderDetailsWashing);
router.get("/api/washing/strict-order-details/:moNo", getWashingOrderDetailsStrict);
router.get("/api/washing/order-sizes/:mono/:color", getOrderSizesWashing);
router.get("/api/washing/measurement-specs/:orderNo", getMeasurmentSpecWashing);

export default router;
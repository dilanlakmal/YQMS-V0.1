import express from "express";
import {
    getMoNoSearchWashing,
    getOrderDetailsWashing,
    getOrderSizesWashing
} from "../../controller/Common/WashingOrdersController.js";

const router = express.Router();

router.get("/api/washing/search-mono", getMoNoSearchWashing);
router.get("/api/washing/order-details/:mono", getOrderDetailsWashing);
router.get("/api/washing/order-sizes/:mono/:color", getOrderSizesWashing);

export default router;
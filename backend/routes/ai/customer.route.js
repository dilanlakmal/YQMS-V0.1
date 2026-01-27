import { getBuyerName } from "../../controller/ai/instruction/customer/customer.controller.js";
import express from "express";


const router = express.Router();


router.get("/name", getBuyerName)

export default router;
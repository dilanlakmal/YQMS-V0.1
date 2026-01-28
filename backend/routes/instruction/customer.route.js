import express from "express";
import customer from "../../controller/instruction/customer.controller.js";


const router = express.Router();


router.get("/", customer.getBuyerName);

export default router;
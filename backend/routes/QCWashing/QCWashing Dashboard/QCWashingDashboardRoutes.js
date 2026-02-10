import express from 'express';
import {
   getWashingDashboardData
} from "../../../controller/QCWashing/QCWashing Dashboard/QCWashingDashboardController.js";

const router = express.Router();

router.get('/api/qc-washing/dashboard', getWashingDashboardData);

export default router;
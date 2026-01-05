import express from 'express';
import {
  getCoverPageOverview,
  // getSavedOrders,
  getSavedOrdersList,
  downloadCoverSheetPDF,
} from "../../../controller/YDT/CoverPage/overViewController.js";

const router = express.Router();

// router.get('/api/coverPage/orders', getSavedOrders);``
router.get('/api/coverPage/orders', getSavedOrdersList);
router.get('/api/coverPage/overview/:id', getCoverPageOverview);
router.get('/api/coverPage/download-pdf/:id', downloadCoverSheetPDF);

export default router;

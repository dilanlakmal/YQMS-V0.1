import express from 'express';
import {
  searchOrderNo,
  getOrderDetails,
  saveCoverPageData,
  getCoverPageData,
  getAllCoverPages,
  deleteCoverPage,
  getCoverPagesByOrder,
  uploadCoverPageImageHandler,
} from '../../../controller/YDT/CoverPage/CoverPageController.js';
import { uploadCoverPageImage } from '../../../helpers/helperFunctions.js';

const router = express.Router();

//Search order numbers from dt_orders collection
router.get('/api/coverPage/orders/search',  searchOrderNo );
router.get('/api/coverPage/orders/:orderNo',  getOrderDetails);

//Modify coverpage data
router.post('/api/coverPage/save', uploadCoverPageImage.single('image'), saveCoverPageData);
router.get('/api/coverPage/order/:orderNo', getCoverPagesByOrder);
router.get('/api/coverPage/:orderNo/:poNumber?', getCoverPageData);
router.get('/api/coverPage', getAllCoverPages);
router.delete('/api/coverPage/:orderNo/:poNumber', deleteCoverPage);
router.post('/api/coverPage/upload-image', uploadCoverPageImage.single('image'), uploadCoverPageImageHandler);

export default router;

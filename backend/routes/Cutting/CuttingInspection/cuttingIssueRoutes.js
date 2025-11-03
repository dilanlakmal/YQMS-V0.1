import express from 'express';
import {
  getCuttingIssues,
  uploadCuttingImage,
} from '../../../controller/Cutting/CuttingInspection/cuttingIssueController.js';
import {
  cutting_upload,
} from "../../../helpers/helperFunctions.js";

const router = express.Router();

router.get('/api/cutting-issues', getCuttingIssues);
router.post('/api/upload-cutting-image',cutting_upload.single("image"), uploadCuttingImage);

export default router;
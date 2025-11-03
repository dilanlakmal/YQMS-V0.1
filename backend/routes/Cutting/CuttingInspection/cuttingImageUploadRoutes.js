import express from 'express';
import {
  uploadImage,
} from '../../../controller/Cutting/CuttingInspection/cuttingImageUploadController.js';
import { cutting_upload } from '../../../helpers/helperFunctions.js';

const router = express.Router();

router.post('/api/upload-cutting-image', cutting_upload.single('image'), uploadImage);

export default router;
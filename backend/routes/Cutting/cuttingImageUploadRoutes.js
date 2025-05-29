import express from 'express';
import {
  uploadImage,
} from '../../Controller/Cutting/cuttingImageUploadController.js';
import { cuttingUpload } from '../../Middleware/Cutting/fileUploadMiddleware.js';

const router = express.Router();

router.post('/api/upload-cutting-image', cuttingUpload.single('image'), uploadImage);

export default router;
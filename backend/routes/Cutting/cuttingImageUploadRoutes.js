import express from 'express';
import {
  uploadImage,
} from '../../Controller/Cutting/cuttingImageUploadController.js';
import { cuttingUpload } from '../../Middleware/Cutting/fileUploadMiddleware.js';

const router = express.Router();

router.get('/api/upload-cutting-image', cuttingUpload.single('imageFile'), uploadImage);

export default router;
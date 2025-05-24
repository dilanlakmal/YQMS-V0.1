import express from 'express';
import {
  uploadImage,
} from '../../Controller/Cutting/cuttingImageUploadController.js';

const router = express.Router();

router.get('/api/upload-cutting-image', uploadImage);

export default router;
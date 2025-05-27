import express from 'express';
import {
  uploadSccImage,
} from '../../Controller/SCC/sccImageUploadController.js';
import { sccUploadMiddleware } from '../../Middleware/SCC/sccImageUploadMiddleware.js';

const router = express.Router();

router.post('/api/scc/upload-image', sccUploadMiddleware, uploadSccImage);


export default router;
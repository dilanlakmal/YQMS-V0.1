import express from 'express';
import {
  // saveQCImage,
  saveRovingImage,
} from '../../Controller/QCInlineRoving/qcInlineImageUploadController.js';
import { 
  // qcUploadMiddleware,
    rovingUploadMiddleware,
 } from '../../Middleware/QCInlineRoving/QcRovingImageUploadMiddleware.js';

const router = express.Router();

// router.post('/api/upload-qc-image', qcUploadMiddleware, saveQCImage );
router.post('/api/roving/upload-roving-image',rovingUploadMiddleware.single("imageFile"), saveRovingImage );
export default router; 
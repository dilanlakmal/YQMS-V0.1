import express from 'express';
import {
  // saveQCImage,
  saveRovingImage,
} from '../../../controller/InlineRoving/Roving/RovingImageUploadController.js';
import { 
  // qcUploadMiddleware,
    rovingUpload,
 } from '../../../helpers/helperFunctions.js';

const router = express.Router();

// router.post('/api/upload-qc-image', qcUploadMiddleware, saveQCImage );
router.post('/api/roving/upload-roving-image',rovingUpload.single("imageFile"), saveRovingImage );
export default router; 
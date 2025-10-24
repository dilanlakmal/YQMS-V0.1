import express from 'express';
import {
  uploadSccImage,
} from '../../controller/SCC/sccImageUploadController.js';
import {  sccUpload } from '../../Helpers/helperFunctions.js';

const router = express.Router();

router.post('/api/scc/upload-image',   sccUpload.single("imageFile"), uploadSccImage);


export default router;
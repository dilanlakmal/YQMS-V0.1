import express from 'express';
import {
  uploadSccImage,
} from '../../../controller/SCC/SCC_Inspection/sccImageUploadController.js';
import {  sccUpload } from '../../../helpers/helperFunctions.js';

const router = express.Router();

router.post('/api/scc/upload-image',sccUpload.single("imageFile"), uploadSccImage);


export default router;
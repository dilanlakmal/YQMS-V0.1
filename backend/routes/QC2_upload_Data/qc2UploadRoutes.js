import express from 'express';
import {
   saveqc2UploadData,
} from '../../controller/QC2_Upload_date/qc2uploadController.js';

const router = express.Router();

router.get('/api/upload-qc2-data',  saveqc2UploadData);

export default router;
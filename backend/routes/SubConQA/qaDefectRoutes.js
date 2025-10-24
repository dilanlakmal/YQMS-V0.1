import express from 'express';
import {
  getStanderdDefect,
  saveQaImageUpload,
} from '../../controller/SubConQC/qcController.js';

import { qaImageUpload } from "../../Helpers/helperFunctions.js";

const router = express.Router();

router.get('/api/qa-standard-defects', getStanderdDefect);
router.get('/api/subcon-qa/upload-image',  qaImageUpload.single("imageFile"), saveQaImageUpload);

export default router;
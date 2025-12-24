import express from 'express';
import {
  saveAuditImage,
} from '../../controller/Audit/AuditUploadImageController.js';
import {
  audit_image_upload,
} from '../../helpers/helperFunctions.js';

const router = express.Router();

router.post('/api/audit/upload-image', audit_image_upload.single("auditImage"), saveAuditImage);


export default router;
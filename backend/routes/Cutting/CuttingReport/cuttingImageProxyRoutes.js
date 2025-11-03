import express from 'express';
import {
  proxyPDF,
} from '../../../controller/Cutting/CuttingReport/cuttingImageProxyController.js';

const router = express.Router();


router.get('/api/image-proxy', proxyPDF);

export default router;
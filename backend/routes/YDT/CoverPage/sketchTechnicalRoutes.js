import express from 'express';
import {
  saveSketchTechnical,
  getSketchTechnicalByOrder,
  updateSketchTechnical,
  getSketchTechnicalById,
  deleteSketchTechnical
} from '../../../controller/YDT/CoverPage/sketchTechnicalController.js';

const router = express.Router();

router.post('/api/coverPage/sketch-technical/save', saveSketchTechnical);
router.get('/api/coverPage/sketch-technical/order/:orderNo', getSketchTechnicalByOrder);
router.put('/api/coverPage/sketch-technical/:orderNo/:sketchTechnicalId', updateSketchTechnical);
router.get('/api/coverPage/sketch-technical/order/:orderNo/sketch/:sketchTechnicalId', getSketchTechnicalById);
router.delete('/api/coverPage/sketch-technical/order/:orderNo/sketch/:sketchTechnicalId', deleteSketchTechnical);
export default router;
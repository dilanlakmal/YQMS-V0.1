import express from 'express';
import {
  getSubConSewingFactory,
  saveSubConSewingFactory,
  updateSubConSewingFactory,
  deleteSubConSewingFactory,
} from '../../controller/SubConQC/qcFactoryManagementController.js';

const router = express.Router();

router.get('/api/subcon-sewing-factories-manage', getSubConSewingFactory);
router.post('/api/subcon-sewing-factories-manage', saveSubConSewingFactory);
router.put('/api/subcon-sewing-factories-manage/:id', updateSubConSewingFactory);
router.delete('/api/subcon-sewing-factories-manage/:id', deleteSubConSewingFactory);

export default router;
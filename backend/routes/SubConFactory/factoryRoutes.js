import express from 'express';
import {
  getAllSubFactory,
  addSubFactory,
  updateSubFactory,
  deleteSubFactory,
  getAllSubConQCList,
  addSpecificSubConQCList,
  updateSpecificSubConQCList,
  deleteSpecificSubConQCList,
} from '../../controller/SubConFactory/factoryController.js';

const router = express.Router();

router.get('/api/subcon-factories', getAllSubFactory);
router.post('/api/subcon-factories', addSubFactory);
router.put('/api/subcon-factories/:id', updateSubFactory);
router.delete('/api/subcon-factories/:id', deleteSubFactory);
router.get('/api/subcon-sewing-factories-manage/qcs/all', getAllSubConQCList);
router.post('/api/subcon-sewing-factories-manage/:factoryId/qcs', addSpecificSubConQCList);
router.put('/api/subcon-sewing-factories-manage/qcs/:qcMongoId', updateSpecificSubConQCList);
router.delete('/api/subcon-sewing-factories-manage/qcs/:qcMongoId', deleteSpecificSubConQCList);

export default router;
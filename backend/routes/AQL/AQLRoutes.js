import express from 'express';
import {
  getAQLMapings,
  getSampleSizeCodeLetter,
  getAQLDetails,
} from '../../controller/AQL/AQLController.js';

const router = express.Router();

router.get('/api/aqlmappings', getAQLMapings);
router.get('/api/samplesizecodeletters', getSampleSizeCodeLetter);
router.get('/api/aql-details', getAQLDetails);

export default router;
import express from 'express';
import {
  getCuttingIssues,
} from '../../Controller/Cutting/cuttingIssueController.js';

const router = express.Router();

router.get('/api/cutting-issues', getCuttingIssues);

export default router;
import express from 'express';
import {
  getAllAccessoryIssues,
  addAccessoryIssue,
  updateAccessoryIssue,
  deleteAccessoryIssue,
} from '../../Controller/AccessoryIssue/accessoryIssuesController.js';

const router = express.Router();

router.get('/api/accessory-issues', getAllAccessoryIssues);
router.post('/api/accessory-issues', addAccessoryIssue);
router.put('/api/accessory-issues/:id', updateAccessoryIssue);
router.delete('/api/accessory-issues/:id', deleteAccessoryIssue);

export default router;
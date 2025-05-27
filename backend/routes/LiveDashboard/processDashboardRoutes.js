import express from 'express';
import {
  getWashingAutocomplete,
  getIroningAutocomplete,
  getOpaAutocomplete,
  getWashingSummary,
  getIroningSummary,
  getOpaSummary,
} from '../../Controller/LiveDashboard/processDashboardController.js';

const router = express.Router();

router.get('/api/washing-autocomplete', getWashingAutocomplete);
router.get('/api/ironing-autocomplete', getIroningAutocomplete);
router.get('/api/opa-autocomplete', getOpaAutocomplete);
router.get('/api/washing-summary', getWashingSummary);
router.get('/api/ironing-summary', getIroningSummary);
router.get('/api/opa-summary', getOpaSummary);


export default router;
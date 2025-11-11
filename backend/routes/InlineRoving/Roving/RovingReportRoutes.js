import express from 'express';
import {
  getFilterQCInlineRoving,
  getQCRovingReports,
  getFilteredQCRovingReports,
  getQCInlineRovingMOs,

} from '../../../controller/InlineRoving/Roving/RovingReportsController.js';


const router = express.Router();

router.get('/api/qc-inline-roving-reports/filtered',  getFilterQCInlineRoving );
router.get('/api/qc-inline-roving-reports',  getQCRovingReports );
router.get('/api/qc-inline-roving-reports-filtered',  getFilteredQCRovingReports );
router.get('/api/qc-inline-roving-mo-nos',  getQCInlineRovingMOs );


export default router;
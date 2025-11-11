import express from 'express';
import {
  getAllAuditCheckpoints,
  getUniqueSectionTitles,
  getUniqueMainTopics,
  createAuditCheckPoint,
  updateAuditCheckPoint,
  deleteAuditCheckPoint,
  addRequirementToCheckpoint,
  updateRequirementInCheckpoint,
  deleteRequirementFromCheckpoint,
} from '../../controller/Audit/AuditAdminController.js';


const router = express.Router();

router.get('/api/audit-checkpoints', getAllAuditCheckpoints);
router.get('/api/audit-checkpoints/unique-section-titles', getUniqueSectionTitles);
router.get('/api/audit-checkpoints/unique-main-topics', getUniqueMainTopics);
router.post('/api/audit-checkpoints', createAuditCheckPoint);
router.put('/api/audit-checkpoints/:id', updateAuditCheckPoint);
router.delete('/api/audit-checkpoints/:id', deleteAuditCheckPoint);
router.post('/api/audit-checkpoints/:checkpointId/requirements', addRequirementToCheckpoint);
router.put('/api/audit-checkpoints/:checkpointId/requirements/:requirementId', updateRequirementInCheckpoint);
router.delete('/api/audit-checkpoints/:checkpointId/requirements/:requirementId', deleteRequirementFromCheckpoint);


export default router;
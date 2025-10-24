import express from 'express';
import {
 getDefectDefinition,
 searchUsers,
} from '../../controller/Roving/rovingController.js';

const router = express.Router();

router.get('/api/defect-definitions', getDefectDefinition);
router.get('/api/users/search-by-empid', searchUsers);

export default router;
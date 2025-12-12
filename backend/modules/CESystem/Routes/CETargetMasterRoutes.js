import express from "express";
import {
    getAllTargetMasters,
    getTargetMasterById,
    createTargetMaster,
    updateTargetMaster,
    deleteTargetMaster,
    importTargetMaster
} from "../Controllers/CETargetMasterController.js";

const router = express.Router();

// Target Master routes
router.get("/api/ce-target-master/target-master", getAllTargetMasters);
router.get("/api/ce-target-master/target-master/:id", getTargetMasterById);
router.post("/api/ce-target-master/target-master", createTargetMaster);
router.post("/api/ce-target-master/target-master/import", importTargetMaster);
router.put("/api/ce-target-master/target-master/:id", updateTargetMaster);
router.delete("/api/ce-target-master/target-master/:id", deleteTargetMaster);

export default router;

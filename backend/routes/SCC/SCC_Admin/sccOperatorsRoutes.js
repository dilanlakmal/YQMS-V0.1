import express from "express";
import {
  getOperators,
  saveOperator,
  removeOperator,
  getOperatorByMachineNo
} from "../../../controller/SCC/SCC_Admin/sccOperatorsController.js";

const router = express.Router();

router.get("/api/scc/operators/:type", getOperators);
router.post("/api/scc/operators/:type", saveOperator);
router.delete("/api/scc/operators/:type/:machineNo", removeOperator);
router.get(
  "/api/scc/operator-by-machine/:type/:machineNo",
  getOperatorByMachineNo
);

export default router;

import express from "express";
import {
  // Buyer
  getAllBuyerNames,
  getBuyerNameById,
  createBuyerName,
  updateBuyerName,
  deleteBuyerName,
  // Cost Price
  getAllCostPrices,
  getCostPriceById,
  createCostPrice,
  updateCostPrice,
  deleteCostPrice,
  // Department
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDistinctDepartmentTypes,
  // Machine
  getAllMachines,
  getMachineById,
  createMachine,
  updateMachine,
  deleteMachine,
  // Target Sample
  getAllTargetSamples,
  getTargetSampleById,
  createTargetSample,
  updateTargetSample,
  deleteTargetSample,
  // Fabric Type
  getAllFabricTypes,
  getFabricTypeById,
  createFabricType,
  updateFabricType,
  deleteFabricType,
  // Rework Name
  getAllReworkNames,
  getReworkNameById,
  createReworkName,
  updateReworkName,
  deleteReworkName,
  // Worker Black List
  getAllWorkerBlackLists,
  getWorkerBlackListById,
  createWorkerBlackList,
  updateWorkerBlackList,
  deleteWorkerBlackList,
  // Main Reason
  getAllMainReasons,
  getMainReasonById,
  createMainReason,
  updateMainReason,
  deleteMainReason,
  // Set Grade
  getAllSetGrades,
  getSetGradeById,
  createSetGrade,
  updateSetGrade,
  deleteSetGrade,
  // Manager Worker
  getAllManagerWorkers,
  getManagerWorkerById,
  createManagerWorker,
  updateManagerWorker,
  deleteManagerWorker,
  // Month Off
  getAllMonthOffs,
  getMonthOffById,
  createMonthOff,
  updateMonthOff,
  deleteMonthOff,
  // Skill Of Worker
  getAllSkillOfWorkers,
  getSkillOfWorkerById,
  createSkillOfWorker,
  updateSkillOfWorker,
  deleteSkillOfWorker
} from "../Controllers/CEMasterController.js";

const router = express.Router();

// Buyer routes
router.get("/api/ce-master/buyer-name", getAllBuyerNames);
router.get("/api/ce-master/buyer-name/:id", getBuyerNameById);
router.post("/api/ce-master/buyer-name", createBuyerName);
router.put("/api/ce-master/buyer-name/:id", updateBuyerName);
router.delete("/api/ce-master/buyer-name/:id", deleteBuyerName);

// Cost Price routes
router.get("/api/ce-master/cost-price", getAllCostPrices);
router.get("/api/ce-master/cost-price/:id", getCostPriceById);
router.post("/api/ce-master/cost-price", createCostPrice);
router.put("/api/ce-master/cost-price/:id", updateCostPrice);
router.delete("/api/ce-master/cost-price/:id", deleteCostPrice);

// Department routes
router.get("/api/ce-master/department", getAllDepartments);
router.get("/api/ce-master/department/distinct/types", getDistinctDepartmentTypes);
router.get("/api/ce-master/department/:id", getDepartmentById);
router.post("/api/ce-master/department", createDepartment);
router.put("/api/ce-master/department/:id", updateDepartment);
router.delete("/api/ce-master/department/:id", deleteDepartment);

// Machine routes
router.get("/api/ce-master/machine", getAllMachines);
router.get("/api/ce-master/machine/:id", getMachineById);
router.post("/api/ce-master/machine", createMachine);
router.put("/api/ce-master/machine/:id", updateMachine);
router.delete("/api/ce-master/machine/:id", deleteMachine);

// Target Sample routes
router.get("/api/ce-master/target-sample", getAllTargetSamples);
router.get("/api/ce-master/target-sample/:id", getTargetSampleById);
router.post("/api/ce-master/target-sample", createTargetSample);
router.put("/api/ce-master/target-sample/:id", updateTargetSample);
router.delete("/api/ce-master/target-sample/:id", deleteTargetSample);


// Fabric Type routes
router.get("/api/ce-master/fabric-type", getAllFabricTypes);
router.get("/api/ce-master/fabric-type/:id", getFabricTypeById);
router.post("/api/ce-master/fabric-type", createFabricType);
router.put("/api/ce-master/fabric-type/:id", updateFabricType);
router.delete("/api/ce-master/fabric-type/:id", deleteFabricType);

// Rework Name routes
router.get("/api/ce-master/rework-name", getAllReworkNames);
router.get("/api/ce-master/rework-name/:id", getReworkNameById);
router.post("/api/ce-master/rework-name", createReworkName);
router.put("/api/ce-master/rework-name/:id", updateReworkName);
router.delete("/api/ce-master/rework-name/:id", deleteReworkName);

// Worker Black List routes
router.get("/api/ce-master/worker-blacklist", getAllWorkerBlackLists);
router.get("/api/ce-master/worker-blacklist/:id", getWorkerBlackListById);
router.post("/api/ce-master/worker-blacklist", createWorkerBlackList);
router.put("/api/ce-master/worker-blacklist/:id", updateWorkerBlackList);
router.delete("/api/ce-master/worker-blacklist/:id", deleteWorkerBlackList);

// Main Reason routes
router.get("/api/ce-master/main-reason", getAllMainReasons);
router.get("/api/ce-master/main-reason/:id", getMainReasonById);
router.post("/api/ce-master/main-reason", createMainReason);
router.put("/api/ce-master/main-reason/:id", updateMainReason);
router.delete("/api/ce-master/main-reason/:id", deleteMainReason);

// Set Grade routes
router.get("/api/ce-master/set-grade", getAllSetGrades);
router.get("/api/ce-master/set-grade/:id", getSetGradeById);
router.post("/api/ce-master/set-grade", createSetGrade);
router.put("/api/ce-master/set-grade/:id", updateSetGrade);
router.delete("/api/ce-master/set-grade/:id", deleteSetGrade);

// Manager Worker routes
router.get("/api/ce-master/manager-worker", getAllManagerWorkers);
router.get("/api/ce-master/manager-worker/:id", getManagerWorkerById);
router.post("/api/ce-master/manager-worker", createManagerWorker);
router.put("/api/ce-master/manager-worker/:id", updateManagerWorker);
router.delete("/api/ce-master/manager-worker/:id", deleteManagerWorker);

// Month Off routes
router.get("/api/ce-master/month-off", getAllMonthOffs);
router.get("/api/ce-master/month-off/:id", getMonthOffById);
router.post("/api/ce-master/month-off", createMonthOff);
router.put("/api/ce-master/month-off/:id", updateMonthOff);
router.delete("/api/ce-master/month-off/:id", deleteMonthOff);

// Skill Of Worker routes
router.get("/api/ce-master/skill-of-worker", getAllSkillOfWorkers);
router.get("/api/ce-master/skill-of-worker/:id", getSkillOfWorkerById);
router.post("/api/ce-master/skill-of-worker", createSkillOfWorker);
router.put("/api/ce-master/skill-of-worker/:id", updateSkillOfWorker);
router.delete("/api/ce-master/skill-of-worker/:id", deleteSkillOfWorker);

export default router;


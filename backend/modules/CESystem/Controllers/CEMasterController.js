import { ymProdConnection, UserMain } from "../../../controller/MongoDB/dbConnectionController.js";
import jwt from "jsonwebtoken";
import createBuyerModel from "../Models/Master/Buyer.js";
import createCostPriceModel from "../Models/Master/CostPrice.js";
import createDepartmentModel from "../Models/Master/Department.js";
import createMachineModel from "../Models/Master/Machine.js";
import createTargetSampleModel from "../Models/Master/TargetSample.js";
import createFabricTypeModel from "../Models/Master/FabricType.js";
import createReworkNameModel from "../Models/Master/ReworkName.js";
import createWorkerBlackListModel from "../Models/Master/WorkerBlackList.js";
import createMainReasonModel from "../Models/Master/MainReason.js";
import createSetGradeModel from "../Models/Master/SetGrade.js";
import createManagerWorkerModel from "../Models/Master/ManagerWorker.js";
import createMonthOffModel from "../Models/Master/MonthOff.js";
import createSkillOfWorkerModel from "../Models/Master/SkillOfWorker.js";

// Initialize models
const Buyer = createBuyerModel(ymProdConnection);
const CostPrice = createCostPriceModel(ymProdConnection);
const Department = createDepartmentModel(ymProdConnection);
const Machine = createMachineModel(ymProdConnection);
const TargetSample = createTargetSampleModel(ymProdConnection);
const FabricType = createFabricTypeModel(ymProdConnection);
const ReworkName = createReworkNameModel(ymProdConnection);
const WorkerBlackList = createWorkerBlackListModel(ymProdConnection);
const MainReason = createMainReasonModel(ymProdConnection);
const SetGrade = createSetGradeModel(ymProdConnection);
const ManagerWorker = createManagerWorkerModel(ymProdConnection);
const MonthOff = createMonthOffModel(ymProdConnection);
const SkillOfWorker = createSkillOfWorkerModel(ymProdConnection);

// Generic CRUD functions
const createCRUDHandlers = (Model, modelName) => {
  // GET all
  const getAll = async (req, res) => {
    try {
      const data = await Model.find();
      res.json(data);
    } catch (error) {
      console.error(`Error fetching ${modelName}:`, error);
      res.status(500).json({ message: `Failed to fetch ${modelName}` });
    }
  };

  // GET by ID
  const getById = async (req, res) => {
    try {
      const { id } = req.params;
      const data = await Model.findById(id);
      if (!data) {
        return res.status(404).json({ message: `${modelName} not found` });
      }
      res.json(data);
    } catch (error) {
      console.error(`Error fetching ${modelName}:`, error);
      res.status(500).json({ message: `Failed to fetch ${modelName}` });
    }
  };

  // POST create
  const create = async (req, res) => {
    try {
      const newData = new Model(req.body);
      const savedData = await newData.save();
      res.status(201).json(savedData);
    } catch (error) {
      console.error(`Error creating ${modelName}:`, error);
      res.status(500).json({
        message: `Failed to create ${modelName}`,
        error: error.message
      });
    }
  };

  // PUT update
  const update = async (req, res) => {
    try {
      const { id } = req.params;
      const updatedData = await Model.findByIdAndUpdate(
        id,
        req.body,
        { new: true, runValidators: true }
      );
      if (!updatedData) {
        return res.status(404).json({ message: `${modelName} not found` });
      }
      res.json(updatedData);
    } catch (error) {
      console.error(`Error updating ${modelName}:`, error);
      res.status(500).json({
        message: `Failed to update ${modelName}`,
        error: error.message
      });
    }
  };

  // DELETE
  const remove = async (req, res) => {
    try {
      const { id } = req.params;
      const deletedData = await Model.findByIdAndDelete(id);
      if (!deletedData) {
        return res.status(404).json({ message: `${modelName} not found` });
      }
      res.json({ message: `${modelName} deleted successfully` });
    } catch (error) {
      console.error(`Error deleting ${modelName}:`, error);
      res.status(500).json({ message: `Failed to delete ${modelName}` });
    }
  };

  return { getAll, getById, create, update, remove };
};

// Buyer
const buyerHandlers = createCRUDHandlers(Buyer, "Buyer");
export const getAllBuyerNames = buyerHandlers.getAll;
export const getBuyerNameById = buyerHandlers.getById;
export const createBuyerName = buyerHandlers.create;
export const updateBuyerName = buyerHandlers.update;
export const deleteBuyerName = buyerHandlers.remove;

// Cost Price
const costPriceHandlers = createCRUDHandlers(CostPrice, "CostPrice");
export const getAllCostPrices = costPriceHandlers.getAll;
export const getCostPriceById = costPriceHandlers.getById;
export const createCostPrice = costPriceHandlers.create;
export const updateCostPrice = costPriceHandlers.update;
export const deleteCostPrice = costPriceHandlers.remove;

// Department
const departmentHandlers = createCRUDHandlers(Department, "Department");
export const getAllDepartments = departmentHandlers.getAll;
export const getDepartmentById = departmentHandlers.getById;
export const createDepartment = departmentHandlers.create;
export const updateDepartment = departmentHandlers.update;
export const deleteDepartment = departmentHandlers.remove;

// Get distinct Department Types
export const getDistinctDepartmentTypes = async (req, res) => {
  try {
    const distinctTypes = await Department.distinct("Dept_Type");
    // Filter out null, undefined, and empty strings
    const filteredTypes = distinctTypes.filter(type => type && type.trim() !== "");
    res.json(filteredTypes);
  } catch (error) {
    console.error("Error fetching distinct department types:", error);
    res.status(500).json({ message: "Failed to fetch distinct department types" });
  }
};

// Machine
const machineHandlers = createCRUDHandlers(Machine, "Machine");
export const getAllMachines = machineHandlers.getAll;
export const getMachineById = machineHandlers.getById;
export const createMachine = machineHandlers.create;
export const updateMachine = machineHandlers.update;
export const deleteMachine = machineHandlers.remove;

// Target Sample
const targetSampleHandlers = createCRUDHandlers(TargetSample, "TargetSample");
export const getAllTargetSamples = targetSampleHandlers.getAll;
export const getTargetSampleById = targetSampleHandlers.getById;
export const createTargetSample = targetSampleHandlers.create;
export const updateTargetSample = targetSampleHandlers.update;
export const deleteTargetSample = targetSampleHandlers.remove;


// Fabric Type
const fabricTypeHandlers = createCRUDHandlers(FabricType, "FabricType");
export const getAllFabricTypes = fabricTypeHandlers.getAll;
export const getFabricTypeById = fabricTypeHandlers.getById;
export const createFabricType = fabricTypeHandlers.create;
export const updateFabricType = fabricTypeHandlers.update;
export const deleteFabricType = fabricTypeHandlers.remove;

// Rework Name
const reworkNameHandlers = createCRUDHandlers(ReworkName, "ReworkName");
export const getAllReworkNames = reworkNameHandlers.getAll;
export const getReworkNameById = reworkNameHandlers.getById;
export const createReworkName = reworkNameHandlers.create;
export const updateReworkName = reworkNameHandlers.update;
export const deleteReworkName = reworkNameHandlers.remove;

// Worker Black List
const workerBlackListHandlers = createCRUDHandlers(WorkerBlackList, "WorkerBlackList");
export const getAllWorkerBlackLists = workerBlackListHandlers.getAll;
export const getWorkerBlackListById = workerBlackListHandlers.getById;
export const createWorkerBlackList = workerBlackListHandlers.create;
export const updateWorkerBlackList = workerBlackListHandlers.update;
export const deleteWorkerBlackList = workerBlackListHandlers.remove;

// Main Reason
const mainReasonHandlers = createCRUDHandlers(MainReason, "MainReason");
export const getAllMainReasons = mainReasonHandlers.getAll;
export const getMainReasonById = mainReasonHandlers.getById;
export const createMainReason = mainReasonHandlers.create;
export const updateMainReason = mainReasonHandlers.update;
export const deleteMainReason = mainReasonHandlers.remove;

// Set Grade
const setGradeHandlers = createCRUDHandlers(SetGrade, "SetGrade");
export const getAllSetGrades = setGradeHandlers.getAll;
export const getSetGradeById = setGradeHandlers.getById;
export const createSetGrade = setGradeHandlers.create;
export const updateSetGrade = setGradeHandlers.update;
export const deleteSetGrade = setGradeHandlers.remove;

// Manager Worker
const managerWorkerHandlers = createCRUDHandlers(ManagerWorker, "ManagerWorker");
export const getAllManagerWorkers = managerWorkerHandlers.getAll;
export const getManagerWorkerById = managerWorkerHandlers.getById;
export const createManagerWorker = managerWorkerHandlers.create;
export const updateManagerWorker = managerWorkerHandlers.update;
export const deleteManagerWorker = managerWorkerHandlers.remove;

// Month Off
const monthOffHandlers = createCRUDHandlers(MonthOff, "MonthOff");
export const getAllMonthOffs = monthOffHandlers.getAll;
export const getMonthOffById = monthOffHandlers.getById;

// Custom create handler for MonthOff to auto-set PreparedBy
export const createMonthOff = async (req, res) => {
  try {
    // Get user name from JWT token
    let preparedBy = "Admin"; // Default fallback
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database
        const user = await UserMain.findById(decodedToken.userId);

        if (user) {
          preparedBy = user.name || user.eng_name || "Admin";
        }
      }
    } catch (error) {
      console.error("Error getting user from token:", error);
      // Use default "Admin" if token parsing fails
    }

    // Set PreparedBy automatically
    const dataWithPreparedBy = {
      ...req.body,
      PreparedBy: preparedBy
    };

    const newData = new MonthOff(dataWithPreparedBy);
    const savedData = await newData.save();
    res.status(201).json(savedData);
  } catch (error) {
    console.error("Error creating MonthOff:", error);
    res.status(500).json({
      message: "Failed to create MonthOff",
      error: error.message
    });
  }
};

export const updateMonthOff = monthOffHandlers.update;
export const deleteMonthOff = monthOffHandlers.remove;

// Skill Of Worker
const skillOfWorkerHandlers = createCRUDHandlers(SkillOfWorker, "SkillOfWorker");
export const getAllSkillOfWorkers = skillOfWorkerHandlers.getAll;
export const getSkillOfWorkerById = skillOfWorkerHandlers.getById;
export const createSkillOfWorker = skillOfWorkerHandlers.create;
export const updateSkillOfWorker = skillOfWorkerHandlers.update;
export const deleteSkillOfWorker = skillOfWorkerHandlers.remove;


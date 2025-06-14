import bcrypt from "bcrypt";
import {
  UserMain,                
} from "../../Config/mongodb.js";
import  {  getOperatorModel } from "../../Helpers/helperFunction.js";

// Endpoint to fetch operators for a specific type (HT, FU, Elastic)
export const getOperators = async (req, res) => {
  try {
    const { type } = req.params;
    const OperatorModel = getOperatorModel(type);

    if (!OperatorModel) {
      return res.status(400).json({ error: "Invalid operator type" });
    }

    const operators = await OperatorModel.find()
      .populate({
        path: "emp_reference",
        select: "emp_id eng_name face_photo", // Fields to populate from User model
        model: UserMain // Explicitly specify model if on different connection
      })
      .lean();
    res.json(operators);
  } catch (error) {
    console.error(`Error fetching ${req.params.type} operators:`, error);
    res.status(500).json({ error: "Failed to fetch operators" });
  }
};

// Endpoint to save/update an operator
export const saveOperator = async (req, res) => {
  try {
    const { type } = req.params;
    const { machineNo, emp_id } = req.body;

    if (!machineNo || !emp_id) {
      return res
        .status(400)
        .json({ error: "Machine No and Employee ID are required" });
    }

    const OperatorModel = getOperatorModel(type);
    if (!OperatorModel) {
      return res.status(400).json({ error: "Invalid operator type" });
    }

    const user = await UserMain.findOne({ emp_id })
      .select("_id emp_id eng_name face_photo") // Added emp_id for logging
      .lean();

    if (!user) {
      return res
        .status(404)
        .json({ error: `User with emp_id ${emp_id} not found.` });
    }

    const operatorData = {
      machineNo,
      emp_id, // This is the emp_id of the user
      emp_eng_name: user.eng_name, // This should be the string name
      emp_face_photo: user.face_photo,
      emp_reference: user._id
    };

    const updatedOperator = await OperatorModel.findOneAndUpdate(
      { machineNo: machineNo },
      operatorData,
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    ).populate({
      // Populate after update/insert to return full data
      path: "emp_reference",
      select: "emp_id eng_name face_photo",
      model: UserMain
    });

    res.status(200).json(updatedOperator);
  } catch (error) {
    console.error(
      `[POST /api/scc/operators/${type}] Error saving/updating operator:`,
      error
    );
    if (error.code === 11000) {
      return res.status(409).json({
        error: `Operator for Machine No ${req.body.machineNo} might already exist or another unique constraint violated.`
      });
    }
    res.status(500).json({ error: "Failed to save/update operator" });
  }
};

// Endpoint to remove an operator (optional, if needed)
export const removeOperator = async (req, res) => {
  try {
    const { type, machineNo } = req.params;
    const OperatorModel = getOperatorModel(type);

    if (!OperatorModel) {
      return res.status(400).json({ error: "Invalid operator type" });
    }

    const result = await OperatorModel.deleteOne({ machineNo });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ error: "Operator not found or already removed" });
    }

    res.status(200).json({ message: "Operator removed successfully" });
  } catch (error) {
    console.error(
      `Error removing ${req.params.type} operator ${req.params.machineNo}:`,
      error
    );
    res.status(500).json({ error: "Failed to remove operator" });
  }
};

export const getOperatorByMachineNo = async (req, res) => {
  try {
    const { type, machineNo } = req.params;
    const OperatorModel = getOperatorModel(type); // SCCHTOperator, SCCFUOperator, etc.

    if (!OperatorModel) {
      return res.status(400).json({ error: "Invalid operator type" });
    }
    if (!machineNo) {
      return res.status(400).json({ error: "Machine No is required" });
    }

    // Find the operator assigned to this machine
    const assignedOperator = await OperatorModel.findOne({ machineNo })
      .populate({
        path: "emp_reference", // Path in SCCHTOperator schema etc.
        select: "emp_id eng_name face_photo", // Fields from User model
        model: UserMain // Specify UserMain model
      })
      .lean();

    if (!assignedOperator) {
      return res
        .status(404)
        .json({ message: "OPERATOR_NOT_FOUND", data: null });
    }

    // Structure the response to be easily consumable by the frontend for OperatorData
    const operatorDetails = {
      emp_id: assignedOperator.emp_id, // emp_id from the scc_xx_operator doc
      emp_eng_name: assignedOperator.emp_eng_name, // name from scc_xx_operator doc
      emp_face_photo: assignedOperator.emp_face_photo, // photo from scc_xx_operator doc
      emp_reference_id: assignedOperator.emp_reference?._id // _id from populated User (if exists)
    };

    // If emp_reference was successfully populated, prefer its details for consistency
    if (assignedOperator.emp_reference) {
      operatorDetails.emp_id =
        assignedOperator.emp_reference.emp_id || assignedOperator.emp_id; // Prefer populated
      operatorDetails.emp_eng_name =
        assignedOperator.emp_reference.eng_name ||
        assignedOperator.emp_eng_name;
      operatorDetails.emp_face_photo =
        assignedOperator.emp_reference.face_photo ||
        assignedOperator.emp_face_photo;
    }

    res.json({ data: operatorDetails });
  } catch (error) {
    console.error(
      `[API /api/scc/operator-by-machine] Error fetching operator by machine:`,
      error
    );
    res.status(500).json({ error: "Failed to fetch operator details" });
  }
};
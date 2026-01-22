import { ymProdConnection, UserMain } from "../../../controller/MongoDB/dbConnectionController.js";
import jwt from "jsonwebtoken";
import createTargetMasterModel from "../Models/TargetMaster/TargetMaster.js";

// Initialize model
const TargetMaster = createTargetMasterModel(ymProdConnection);

// Generic CRUD functions
const createCRUDHandlers = (Model, modelName) => {
    // GET all
    const getAll = async (req, res) => {
        try {
            const data = await Model.find()
                .populate("Fabric_Type", "Fabric_Type")
                .populate("Machine_Code", "Machine_Code");
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
            const data = await Model.findById(id)
                .populate("Fabric_Type", "Fabric_Type")
                .populate("Machine_Code", "Machine_Code");
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

// Target Master
const targetMasterHandlers = createCRUDHandlers(TargetMaster, "TargetMaster");

// Custom create handler for TargetMaster to auto-set Prepared_By
export const createTargetMaster = async (req, res) => {
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

        // Set Prepared_By automatically if not provided
        const dataWithPreparedBy = {
            ...req.body,
            Prepared_By: req.body.Prepared_By || preparedBy
        };

        const newData = new TargetMaster(dataWithPreparedBy);
        const savedData = await newData.save();
        res.status(201).json(savedData);
    } catch (error) {
        console.error("Error creating TargetMaster:", error);
        res.status(500).json({
            message: "Failed to create TargetMaster",
            error: error.message
        });
    }
};

// Import handler for importing multiple TargetMaster records
export const importTargetMaster = async (req, res) => {
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

        // Validate that req.body is an array
        if (!Array.isArray(req.body)) {
            return res.status(400).json({
                message: "Request body must be an array of records"
            });
        }

        // Add Prepared_By to each record
        const recordsWithPreparedBy = req.body.map(record => ({
            ...record,
            Prepared_By: record.Prepared_By || preparedBy
        }));

        // Bulk insert
        const savedData = await TargetMaster.insertMany(recordsWithPreparedBy, {
            ordered: false // Continue on error
        });

        res.status(201).json({
            message: `Successfully imported ${savedData.length} records`,
            data: savedData
        });
    } catch (error) {
        console.error("Error bulk creating TargetMaster:", error);

        // Handle partial success in bulk insert
        if (error.writeErrors) {
            const successCount = error.insertedDocs?.length || 0;
            const failCount = error.writeErrors.length;

            return res.status(207).json({
                message: `Partially successful: ${successCount} inserted, ${failCount} failed`,
                inserted: error.insertedDocs,
                errors: error.writeErrors.map(e => ({
                    index: e.index,
                    message: e.errmsg
                }))
            });
        }

        res.status(500).json({
            message: "Failed to bulk create TargetMaster",
            error: error.message
        });
    }
};

export const getAllTargetMasters = targetMasterHandlers.getAll;
export const getTargetMasterById = targetMasterHandlers.getById;
export const updateTargetMaster = targetMasterHandlers.update;
export const deleteTargetMaster = targetMasterHandlers.remove;

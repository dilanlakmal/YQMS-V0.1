import {
SubconFactory,  
SubconSewingFactory,            
} from "../MongoDB/dbConnectionController.js";
import mongoose from "mongoose";


// GET - Fetch all sub-con factories
export const getAllSubFactory = async (req, res) => {
  try {
      const factories = await SubconFactory.find({}).sort({ no: 1 }).lean();
      res.json(factories);
    } catch (error) {
      console.error("Error fetching sub-con factories:", error);
      res.status(500).json({ message: "Server error fetching factories" });
    }
};

// POST - Add a new sub-con factory
export const addSubFactory = async (req, res) => {
  try {
    const { no, factory } = req.body;

    if (no === undefined || no === null || !factory) {
      return res
        .status(400)
        .json({ message: "Factory No and Name are required." });
    }
    if (isNaN(parseInt(no)) || parseInt(no) <= 0) {
      return res
        .status(400)
        .json({ message: "Factory No must be a positive number." });
    }

    const existingFactoryByNo = await SubconFactory.findOne({ no: Number(no) });
    if (existingFactoryByNo) {
      return res
        .status(409)
        .json({ message: `Factory No '${no}' already exists.` });
    }

    const existingFactoryByName = await SubconFactory.findOne({ factory });
    if (existingFactoryByName) {
      return res
        .status(409)
        .json({ message: `Factory name '${factory}' already exists.` });
    }

    const newFactory = new SubconFactory({
      no: Number(no),
      factory
    });
    await newFactory.save();

    res.status(201).json({
      message: "Sub-con factory added successfully",
      factory: newFactory
    });
  } catch (error) {
    console.error("Error adding sub-con factory:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Duplicate entry. Factory No or Name might already exist."
      });
    }
    res
      .status(500)
      .json({ message: "Failed to add sub-con factory", error: error.message });
  }
};

// PUT - Update an existing sub-con factory by ID
export const updateSubFactory = async (req, res) => {
  try {
      const { id } = req.params;
      const { no, factory } = req.body;
  
      if (no === undefined || no === null || !factory) {
        return res
          .status(400)
          .json({ message: "Factory No and Name are required for update." });
      }
      if (isNaN(parseInt(no)) || parseInt(no) <= 0) {
        return res
          .status(400)
          .json({ message: "Factory No must be a positive number." });
      }
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid factory ID format." });
      }
  
      // Check for duplicates, excluding the current document being updated
      const existingFactoryByNo = await SubconFactory.findOne({
        no: Number(no),
        _id: { $ne: id }
      });
      if (existingFactoryByNo) {
        return res.status(409).json({
          message: `Factory No '${no}' already exists for another factory.`
        });
      }
  
      const existingFactoryByName = await SubconFactory.findOne({
        factory,
        _id: { $ne: id }
      });
      if (existingFactoryByName) {
        return res.status(409).json({
          message: `Factory name '${factory}' already exists for another factory.`
        });
      }
  
      const updatedFactory = await SubconFactory.findByIdAndUpdate(
        id,
        { no: Number(no), factory },
        { new: true, runValidators: true }
      );
  
      if (!updatedFactory) {
        return res.status(404).json({ message: "Sub-con factory not found." });
      }
  
      res.status(200).json({
        message: "Sub-con factory updated successfully",
        factory: updatedFactory
      });
    } catch (error) {
      console.error("Error updating sub-con factory:", error);
      if (error.code === 11000) {
        return res.status(409).json({
          message: "Update failed due to duplicate Factory No or Name."
        });
      }
      res.status(500).json({
        message: "Failed to update sub-con factory",
        error: error.message
      });
    }
};

// DELETE - Delete a sub-con factory by ID
export const deleteSubFactory = async (req, res) => {
  try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid factory ID format." });
      }
  
      const deletedFactory = await SubconFactory.findByIdAndDelete(id);
      if (!deletedFactory) {
        return res.status(404).json({ message: "Sub-con factory not found." });
      }
  
      res.status(200).json({ message: "Sub-con factory deleted successfully" });
    } catch (error) {
      console.error("Error deleting sub-con factory:", error);
      res.status(500).json({
        message: "Failed to delete sub-con factory",
        error: error.message
      });
    }
};

// GET: Fetch a flattened list of all QCs from all factories for the management table
export const getAllSubConQCList = async (req, res) => {
  try {
      const factories = await SubconSewingFactory.find({
        "qcList.0": { $exists: true }
      }).lean();
  
      const allQCs = factories.flatMap((factory) =>
        factory.qcList.map((qc) => ({
          factoryId: factory._id,
          factoryName: factory.factory,
          qcMongoId: qc._id, // Mongoose subdocument ID
          qcIndex: qc.qcIndex,
          qcID: qc.qcID,
          qcName: qc.qcName
        }))
      );
  
      res.json(allQCs);
    } catch (error) {
      console.error("Error fetching all QCs:", error);
      res.status(500).json({ error: "Failed to fetch QC list" });
    }
};

// POST: Add a new QC to a specific factory's qcList
export const addSpecificSubConQCList = async (req, res) => {
  const { factoryId } = req.params;
    const { qcID, qcName } = req.body;

    try {
      const factory = await SubconSewingFactory.findById(factoryId);
      if (!factory) {
        return res.status(404).json({ error: "Factory not found." });
      }

      // Check for duplicate qcID within the same factory
      if (factory.qcList.some((qc) => qc.qcID === qcID)) {
        return res
          .status(409)
          .json({ error: "This QC ID already exists for this factory." });
      }

      const newQcIndex =
        factory.qcList.length > 0
          ? Math.max(...factory.qcList.map((q) => q.qcIndex)) + 1
          : 1;

      const newQc = {
        qcIndex: newQcIndex,
        qcID,
        qcName
      };

      factory.qcList.push(newQc);
      await factory.save();

      res.status(201).json(factory.qcList[factory.qcList.length - 1]); // Return the newly added QC
    } catch (error) {
      console.error("Error adding QC:", error);
      res.status(500).json({ error: "Failed to add QC" });
    }
};

// PUT: Update a specific QC in a factory's qcList
export const updateSpecificSubConQCList = async (req, res) => {
  const { qcMongoId } = req.params;
    const { qcID, qcName } = req.body;

    try {
      const factory = await SubconSewingFactory.findOne({
        "qcList._id": qcMongoId
      });
      if (!factory) {
        return res.status(404).json({ error: "QC not found in any factory." });
      }

      const qcToUpdate = factory.qcList.id(qcMongoId);
      qcToUpdate.qcID = qcID;
      qcToUpdate.qcName = qcName;

      await factory.save();
      res.json(qcToUpdate);
    } catch (error) {
      console.error("Error updating QC:", error);
      res.status(500).json({ error: "Failed to update QC" });
    }
};

// DELETE: Remove a specific QC from a factory's qcList
export const deleteSpecificSubConQCList = async (req, res) => {
  const { qcMongoId } = req.params;

    try {
      const result = await SubconSewingFactory.updateOne(
        { "qcList._id": qcMongoId },
        { $pull: { qcList: { _id: qcMongoId } } }
      );

      if (result.nModified === 0) {
        return res.status(404).json({ error: "QC not found." });
      }

      res.json({ message: "QC deleted successfully." });
    } catch (error) {
      console.error("Error deleting QC:", error);
      res.status(500).json({ error: "Failed to delete QC" });
    }
};
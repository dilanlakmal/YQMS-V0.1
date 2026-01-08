import {
  EMBDefect,
} from "../../MongoDB/dbConnectionController.js";
import mongoose from "mongoose";

// GET - Fetch all EMB defects
export const getEMBDefects = async (req, res) => {
    try {
      const defects = await EMBDefect.find({}).sort({ no: 1 }).lean();
      res.json(defects);
    } catch (error) {
      console.error("Error fetching EMB defects:", error);
      res.status(500).json({ message: "Server error fetching EMB defects" });
    }
};

// POST - Add a new EMB defect
export const addEMBDefect = async (req, res) => {
  try {
      const { no, defectNameEng, defectNameKhmer, defectNameChine } = req.body;

      // --- Added validation from your example ---
      if (no === undefined || no === null || !defectNameEng || !defectNameKhmer) {
        return res.status(400).json({
          message: "Defect No, English Name, and Khmer Name are required."
        });
      }
      if (isNaN(parseInt(no)) || parseInt(no) <= 0) {
        return res
          .status(400)
          .json({ message: "Defect No must be a positive number." });
      }

      const existingDefectByNo = await EMBDefect.findOne({ no: Number(no) });
      if (existingDefectByNo) {
        return res
          .status(409)
          .json({ message: `EMB Defect No '${no}' already exists.` });
      }
      const existingDefectByName = await EMBDefect.findOne({ defectNameEng });
      if (existingDefectByName) {
        return res.status(409).json({
          message: `EMB Defect name (English) '${defectNameEng}' already exists.`
        });
      }
      // --- End of validation ---

      const newDefect = new EMBDefect({
        no: Number(no),
        defectNameEng,
        defectNameKhmer,
        defectNameChine: defectNameChine || ""
      });
      await newDefect.save();
      res
        .status(201)
        .json({ message: "EMB defect added successfully", defect: newDefect });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          message: "Duplicate entry. Defect No or Name might already exist."
        });
      }
      console.error("Error adding EMB defect:", error);
      res
        .status(500)
        .json({ message: "Failed to add EMB defect", error: error.message });
    }
};

// PUT - Update an existing EMB defect by ID
export const updateEMBDefect = async (req, res) => {
  try {
      const { id } = req.params;
      const { no, defectNameEng, defectNameKhmer, defectNameChine } = req.body;

      if (no === undefined || no === null || !defectNameEng || !defectNameKhmer) {
        return res.status(400).json({
          message:
            "Defect No, English Name, and Khmer Name are required for update."
        });
      }
      if (isNaN(parseInt(no)) || parseInt(no) <= 0) {
        return res
          .status(400)
          .json({ message: "Defect No must be a positive number." });
      }
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid EMB defect ID format." });
      }

      const existingDefectByNo = await EMBDefect.findOne({
        no: Number(no),
        _id: { $ne: id }
      });
      if (existingDefectByNo) {
        return res.status(409).json({
          message: `EMB Defect No '${no}' already exists for another defect.`
        });
      }
      const existingDefectByName = await EMBDefect.findOne({
        defectNameEng,
        _id: { $ne: id }
      });
      if (existingDefectByName) {
        return res.status(409).json({
          message: `EMB Defect name (English) '${defectNameEng}' already exists for another defect.`
        });
      }

      const updatedDefect = await EMBDefect.findByIdAndUpdate(
        id,
        {
          no: Number(no),
          defectNameEng,
          defectNameKhmer,
          defectNameChine: defectNameChine || ""
        },
        { new: true, runValidators: true }
      );

      if (!updatedDefect) {
        return res.status(404).json({ message: "EMB Defect not found." });
      }
      res.status(200).json({
        message: "EMB defect updated successfully",
        defect: updatedDefect
      });
    } catch (error) {
      console.error("Error updating EMB defect:", error);
      if (error.code === 11000) {
        return res.status(409).json({
          message: "Update failed due to duplicate EMB Defect No or Name."
        });
      }
      res
        .status(500)
        .json({ message: "Failed to update EMB defect", error: error.message });
    }
};

// DELETE - Delete an EMB defect by ID
export const deleteEMBDefect = async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid EMB defect ID format." });
      }
      const deletedDefect = await EMBDefect.findByIdAndDelete(id);
      if (!deletedDefect) {
        return res.status(404).json({ message: "EMB Defect not found." });
      }
      res.status(200).json({ message: "EMB defect deleted successfully" });
    } catch (error) {
      console.error("Error deleting EMB defect:", error);
      res
        .status(500)
        .json({ message: "Failed to delete EMB defect", error: error.message });
    }
};

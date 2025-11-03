import {
  SCCScratchDefect,                
} from "../../MongoDB/dbConnectionController.js";
import mongoose from "mongoose";

// GET - Fetch all SCC scratch defects
export const getAllScratchDefects = async (req, res) => {
  try {
      const defects = await SCCScratchDefect.find({}).sort({ no: 1 }).lean();
      res.json(defects); // Send as a direct array
    } catch (error) {
      console.error("Error fetching SCC scratch defects:", error);
      res.status(500).json({ message: "Server error fetching scratch defects" });
    }
};

// POST - Add a new SCC scratch defect
export const addScratchDefect = async (req, res) => {
  try {
      const { no, defectNameEng, defectNameKhmer, defectNameChinese } = req.body;
  
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
  
      const existingDefectByNo = await SCCScratchDefect.findOne({
        no: Number(no)
      });
      if (existingDefectByNo) {
        return res
          .status(409)
          .json({ message: `Scratch Defect No '${no}' already exists.` });
      }
      const existingDefectByName = await SCCScratchDefect.findOne({
        defectNameEng
      });
      if (existingDefectByName) {
        return res.status(409).json({
          message: `Scratch Defect name (English) '${defectNameEng}' already exists.`
        });
      }
  
      const newScratchDefect = new SCCScratchDefect({
        no: Number(no),
        defectNameEng,
        defectNameKhmer,
        defectNameChinese: defectNameChinese || ""
      });
      await newScratchDefect.save();
      res.status(201).json({
        message: "SCC scratch defect added successfully",
        defect: newScratchDefect
      });
    } catch (error) {
      console.error("Error adding SCC scratch defect:", error);
      if (error.code === 11000) {
        return res.status(409).json({
          message:
            "Duplicate entry. Scratch Defect No or Name might already exist."
        });
      }
      res.status(500).json({
        message: "Failed to add SCC scratch defect",
        error: error.message
      });
    }
};

// PUT - Update an existing SCC scratch defect by ID
export const updateScratchDefect = async (req, res) => {
  try {
      const { id } = req.params;
      const { no, defectNameEng, defectNameKhmer, defectNameChinese } = req.body;
  
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
        return res
          .status(400)
          .json({ message: "Invalid scratch defect ID format." });
      }
  
      const existingDefectByNo = await SCCScratchDefect.findOne({
        no: Number(no),
        _id: { $ne: id }
      });
      if (existingDefectByNo) {
        return res.status(409).json({
          message: `Scratch Defect No '${no}' already exists for another defect.`
        });
      }
      const existingDefectByName = await SCCScratchDefect.findOne({
        defectNameEng,
        _id: { $ne: id }
      });
      if (existingDefectByName) {
        return res.status(409).json({
          message: `Scratch Defect name (English) '${defectNameEng}' already exists for another defect.`
        });
      }
  
      const updatedScratchDefect = await SCCScratchDefect.findByIdAndUpdate(
        id,
        {
          no: Number(no),
          defectNameEng,
          defectNameKhmer,
          defectNameChinese: defectNameChinese || ""
        },
        { new: true, runValidators: true }
      );
  
      if (!updatedScratchDefect) {
        return res.status(404).json({ message: "SCC Scratch Defect not found." });
      }
      res.status(200).json({
        message: "SCC scratch defect updated successfully",
        defect: updatedScratchDefect
      });
    } catch (error) {
      console.error("Error updating SCC scratch defect:", error);
      if (error.code === 11000) {
        return res.status(409).json({
          message: "Update failed due to duplicate Scratch Defect No or Name."
        });
      }
      res.status(500).json({
        message: "Failed to update SCC scratch defect",
        error: error.message
      });
    }
};

// DELETE - Delete an SCC scratch defect by ID
export const deleteScratchDefect = async (req, res) => {
  try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res
          .status(400)
          .json({ message: "Invalid scratch defect ID format." });
      }
      const deletedScratchDefect = await SCCScratchDefect.findByIdAndDelete(id);
      if (!deletedScratchDefect) {
        return res.status(404).json({ message: "SCC Scratch Defect not found." });
      }
      res
        .status(200)
        .json({ message: "SCC scratch defect deleted successfully" });
    } catch (error) {
      console.error("Error deleting SCC scratch defect:", error);
      res.status(500).json({
        message: "Failed to delete SCC scratch defect",
        error: error.message
      });
    }
};
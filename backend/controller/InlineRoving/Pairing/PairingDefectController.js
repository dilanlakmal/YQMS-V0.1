import {
 PairingDefect,
} from "../../MongoDB/dbConnectionController.js";
import mongoose from "mongoose";


// GET - Fetch all Pairing Defects
export const getAllPaaring = async (req, res) => {
  try {
      const defects = await PairingDefect.find({}).sort({ no: 1 }).lean(); // Fetch all defects, sorted by 'no'
      res.json(defects);
    } catch (error) {
      console.error("Error fetching Pairing defects:", error);
      res.status(500).json({ message: "Server error fetching defects" });
    }
};

// POST - Add a new Pairing defect
export const addParing = async (req, res) => {
  try {
    const { no, defectNameEng, defectNameKhmer, defectNameChinese } = req.body;

    // Validate required fields
    if (
      no === undefined ||
      no === null ||
      !defectNameEng ||
      !defectNameKhmer ||
      !defectNameChinese
    ) {
      return res.status(400).json({
        message:
          "Defect No, English Name, Khmer Name, and Chinese Name are required."
      });
    }
    if (isNaN(parseInt(no)) || parseInt(no) <= 0) {
      return res
        .status(400)
        .json({ message: "Defect No must be a positive number." });
    }

    // Check for duplicate 'no'
    const existingDefectByNo = await PairingDefect.findOne({ no: Number(no) });
    if (existingDefectByNo) {
      return res
        .status(409)
        .json({ message: `Defect No '${no}' already exists.` });
    }
    // Check for duplicate English name
    const existingDefectByName = await PairingDefect.findOne({ defectNameEng });
    if (existingDefectByName) {
      return res.status(409).json({
        message: `Defect name (English) '${defectNameEng}' already exists.`
      });
    }

    const newPairingDefect = new PairingDefect({
      no: Number(no),
      defectNameEng,
      defectNameKhmer,
      defectNameChinese
    });
    await newPairingDefect.save();
    res.status(201).json({
      message: "Pairing defect added successfully",
      defect: newPairingDefect
    });
  } catch (error) {
    console.error("Error adding Pairing defect:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Duplicate entry. Defect No or Name might already exist."
      });
    }
    res
      .status(500)
      .json({ message: "Failed to add Pairing defect", error: error.message });
  }
};

// PUT - Update an existing Pairing defect by ID
export const updateParing = async (req, res) => {
    try {
    const { id } = req.params;
    const { no, defectNameEng, defectNameKhmer, defectNameChinese } = req.body;

    // Validate required fields
    if (
      no === undefined ||
      no === null ||
      !defectNameEng ||
      !defectNameKhmer ||
      !defectNameChinese
    ) {
      return res.status(400).json({
        message:
          "Defect No, English Name, Khmer Name, and Chinese Name are required for update."
      });
    }
    if (isNaN(parseInt(no)) || parseInt(no) <= 0) {
      return res
        .status(400)
        .json({ message: "Defect No must be a positive number." });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid defect ID format." });
    }

    // Check for duplicate 'no' (excluding the current document being updated)
    const existingDefectByNo = await PairingDefect.findOne({
      no: Number(no),
      _id: { $ne: id }
    });
    if (existingDefectByNo) {
      return res.status(409).json({
        message: `Defect No '${no}' already exists for another defect.`
      });
    }
    // Check for duplicate English name (excluding the current document)
    const existingDefectByName = await PairingDefect.findOne({
      defectNameEng,
      _id: { $ne: id }
    });
    if (existingDefectByName) {
      return res.status(409).json({
        message: `Defect name (English) '${defectNameEng}' already exists for another defect.`
      });
    }

    const updatedPairingDefect = await PairingDefect.findByIdAndUpdate(
      id,
      {
        no: Number(no),
        defectNameEng,
        defectNameKhmer,
        defectNameChinese
      },
      { new: true, runValidators: true }
    );

    if (!updatedPairingDefect) {
      return res.status(404).json({ message: "Pairing Defect not found." });
    }
    res.status(200).json({
      message: "Pairing defect updated successfully",
      defect: updatedPairingDefect
    });
  } catch (error) {
    console.error("Error updating Pairing defect:", error);
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: "Update failed due to duplicate Defect No or Name." });
    }
    res.status(500).json({
      message: "Failed to update Pairing defect",
      error: error.message
    });
  }
};

// DELETE - Delete a Pairing defect by ID
export const deleteParing = async (req, res) => {
  try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid defect ID format." });
      }

      const deletedPairingDefect = await PairingDefect.findByIdAndDelete(id);
      if (!deletedPairingDefect) {
        return res.status(404).json({ message: "Pairing Defect not found." });
      }
      res.status(200).json({ message: "Pairing defect deleted successfully" });
    } catch (error) {
      console.error("Error deleting Pairing defect:", error);
      res.status(500).json({
        message: "Failed to delete Pairing defect",
        error: error.message
      });
    }
};

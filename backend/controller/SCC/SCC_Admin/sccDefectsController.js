import {
  SCCDefect,
  PrintingDefect,
  EMBDefect,
} from "../../MongoDB/dbConnectionController.js";
import mongoose from "mongoose";

export const getSccDefects = async (req, res) => {
    try {
    const defects = await SCCDefect.find({}).sort({ no: 1 }).lean(); // Fetch all defects, sorted by 'no'
    res.json(defects);
  } catch (error) {
    console.error("Error fetching SCC defects:", error);
    res.status(500).json({ message: "Server error fetching defects" });
  }
};

// POST - Add a new SCC defect
export const addSccDefect = async (req, res) => {
    try {
    const { no, defectNameEng, defectNameKhmer, defectNameChinese } = req.body;

    // Validate required fields (Chinese name is optional)
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

    // Check for duplicate 'no'
    const existingDefectByNo = await SCCDefect.findOne({ no: Number(no) });
    if (existingDefectByNo) {
      return res
        .status(409)
        .json({ message: `Defect No '${no}' already exists.` });
    }
    // Check for duplicate English name (optional, but good for data integrity)
    const existingDefectByName = await SCCDefect.findOne({ defectNameEng });
    if (existingDefectByName) {
      return res.status(409).json({
        message: `Defect name (English) '${defectNameEng}' already exists.`
      });
    }

    const newSccDefect = new SCCDefect({
      no: Number(no),
      defectNameEng,
      defectNameKhmer,
      defectNameChinese: defectNameChinese || "" // Save empty string if not provided
    });
    await newSccDefect.save();
    res
      .status(201)
      .json({ message: "SCC defect added successfully", defect: newSccDefect });
  } catch (error) {
    console.error("Error adding SCC defect:", error);
    if (error.code === 11000) {
      // Mongoose duplicate key error (if unique index is on more than just 'no')
      return res.status(409).json({
        message: "Duplicate entry. Defect No or Name might already exist."
      });
    }
    res
      .status(500)
      .json({ message: "Failed to add SCC defect", error: error.message });
  }
};

// PUT - Update an existing SCC defect by ID
export const updateSccDefect = async (req, res) => {
    try {
        const { id } = req.params;
        const { no, defectNameEng, defectNameKhmer, defectNameChinese } = req.body;

        // Validate required fields (Chinese name is optional)
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
          return res.status(400).json({ message: "Invalid defect ID format." });
        }

        // Check for duplicate 'no' (excluding the current document being updated)
        const existingDefectByNo = await SCCDefect.findOne({
          no: Number(no),
          _id: { $ne: id }
        });
        if (existingDefectByNo) {
          return res.status(409).json({
            message: `Defect No '${no}' already exists for another defect.`
          });
        }
        // Check for duplicate English name (excluding the current document)
        const existingDefectByName = await SCCDefect.findOne({
          defectNameEng,
          _id: { $ne: id }
        });
        if (existingDefectByName) {
          return res.status(409).json({
            message: `Defect name (English) '${defectNameEng}' already exists for another defect.`
          });
        }

        const updatedSccDefect = await SCCDefect.findByIdAndUpdate(
          id,
          {
            no: Number(no),
            defectNameEng,
            defectNameKhmer,
            defectNameChinese: defectNameChinese || "" // Save empty string if not provided
            // timestamps: true in schema will automatically update updated_at
          },
          { new: true, runValidators: true }
        );

        if (!updatedSccDefect) {
          return res.status(404).json({ message: "SCC Defect not found." });
        }
        res.status(200).json({
          message: "SCC defect updated successfully",
          defect: updatedSccDefect
        });
      } catch (error) {
        console.error("Error updating SCC defect:", error);
        if (error.code === 11000) {
          return res
            .status(409)
            .json({ message: "Update failed due to duplicate Defect No or Name." });
        }
        res
          .status(500)
          .json({ message: "Failed to update SCC defect", error: error.message });
      }
};

// DELETE - Delete an SCC defect by ID
export const deleteSccDefect = async (req, res) => {
    try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid defect ID format." });
    }

    const deletedSccDefect = await SCCDefect.findByIdAndDelete(id);
    if (!deletedSccDefect) {
      return res.status(404).json({ message: "SCC Defect not found." });
    }
    res.status(200).json({ message: "SCC defect deleted successfully" });
  } catch (error) {
    console.error("Error deleting SCC defect:", error);
    res
      .status(500)
      .json({ message: "Failed to delete SCC defect", error: error.message });
  }
};

// GET - Fetch all Printing defects
export const getPrintingDefects = async (req, res) => {
  try {
      const defects = await PrintingDefect.find({}).sort({ no: 1 }).lean();
      res.json(defects);
    } catch (error) {
      console.error("Error fetching Printing defects:", error);
      res.status(500).json({ message: "Server error fetching Printing defects" });
    }
};

//GET - all combined defects
export const getAllCombinedDefects = async (req, res) => {
  try {
      const [embDefects, printingDefects] = await Promise.all([
        EMBDefect.find({}).sort({ no: 1 }).lean(),
        PrintingDefect.find({}).sort({ no: 1 }).lean()
      ]);

      const allDefects = [...embDefects, ...printingDefects].sort(
        (a, b) => a.no - b.no
      );

      res.json(allDefects);
    } catch (error) {
      console.error("Error fetching all defects:", error);
      res.status(500).json({ message: "Server error fetching all defects" });
    }
};
import mongoose from "mongoose";
import path from "path";
import fs from 'fs';
import {
  QC2Defects,
} from "../../MongoDB/dbConnectionController.js";

import {__backendDir } from "../../../Config/appConfig.js";

/* ------------------------------
   End Points - QC2 Defects
------------------------------ */

// GET - Fetch all QC2 defects
export const getAllQC2Defects = async (req, res) => {
    try {
      const defects = await QC2Defects.find({}).sort({ code: 1 }).lean();
      res.json(defects);
    } catch (error) {
      console.error("Error fetching QC2 defects:", error);
      res.status(500).json({ message: "Server error fetching defects" });
    }
};

// POST - Add a new QC2 defect
export const addQC2Defect = async (req, res) => {
    try {
      const { code, defectLetter, english, khmer } = req.body;
      if (code === undefined || !defectLetter || !english || !khmer) {
        return res.status(400).json({
          message: "Code, Defect Letter, English & Khmer names are required."
        });
      }
      const existingByCode = await QC2Defects.findOne({ code });
      if (existingByCode) {
        return res
          .status(409)
          .json({ message: `Defect code '${code}' already exists.` });
      }
      const newDefect = new QC2Defects(req.body);
      await newDefect.save();
      res
        .status(201)
        .json({ message: "QC2 defect added successfully", defect: newDefect });
    } catch (error) {
      console.error("Error adding QC2 defect:", error);
      if (error.code === 11000)
        return res
          .status(409)
          .json({ message: "Duplicate entry. Defect code or name might exist." });
      res
        .status(500)
        .json({ message: "Failed to add QC2 defect", error: error.message });
    }
};

// PUT - Update an existing QC2 defect by ID
export const updateQC2Defect = async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid defect ID format." });
      }
      const updatedDefect = await QC2Defects.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true
      });
      if (!updatedDefect) {
        return res.status(404).json({ message: "QC2 Defect not found." });
      }
      res.status(200).json({
        message: "QC2 defect updated successfully",
        defect: updatedDefect
      });
    } catch (error) {
      console.error("Error updating QC2 defect:", error);
      if (error.code === 11000)
        return res
          .status(409)
          .json({ message: "Update failed due to duplicate code or name." });
      res
        .status(500)
        .json({ message: "Failed to update QC2 defect", error: error.message });
    }
};

// DELETE - Delete a QC2 defect by ID
export const deleteQC2Defect = async (req, res) => {
  try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid defect ID format." });
      }
      const defect = await QC2Defects.findById(id);
      if (!defect) {
        return res.status(404).json({ message: "QC2 Defect not found." });
      }
      // Delete associated image file before deleting the record
      if (defect.image) {
        const imagePath = path.join(
          "storage",
          defect.image.replace("/storage/", "")
        );
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
      await QC2Defects.findByIdAndDelete(id);
      res.status(200).json({
        message: "QC2 defect and associated image deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting QC2 defect:", error);
      res
        .status(500)
        .json({ message: "Failed to delete QC2 defect", error: error.message });
    }
};

/* -------------------------------------
   NEW End Point - QC2 Defect Categories
------------------------------------- */

export const saveQC2Image = async (req, res) => {
  try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No image file provided." });
      }

      const uploadPath = path.join(
        __backendDir,
        "public",
        "storage",
        "qc2_images"
      );
      //await fs.promises.mkdir(uploadPath, { recursive: true });

      const fileExtension = path.extname(req.file.originalname);
      const newFilename = `qc2-defect-${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${fileExtension}`;

      const fullFilePath = path.join(uploadPath, newFilename);
      await fs.promises.writeFile(fullFilePath, req.file.buffer);

      // Return the relative URL path for the database
      const relativeUrl = `/storage/qc2_images/${newFilename}`;

      res.status(200).json({ success: true, url: relativeUrl });
    } catch (error) {
      console.error("Error in /api/qc2-defects/upload-image:", error);
      res
        .status(500)
        .json({ success: false, message: "Server error during image upload." });
    }
};

export const editQC2Image = async (req, res) => {
  try {
        const { id } = req.params;

        if (!req.file) {
          return res
            .status(400)
            .json({ success: false, message: "No new image file provided." });
        }
        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid defect ID." });
        }

        const defect = await QC2Defects.findById(id);
        if (!defect) {
          return res
            .status(404)
            .json({ success: false, message: "Defect not found." });
        }

        // --- Delete the old image file if it exists ---
        if (defect.image) {
          const oldImagePath = path.join(__backendDir, "public", defect.image);
          if (fs.existsSync(oldImagePath)) {
            await fs.promises.unlink(oldImagePath);
          }
        }

        // --- Save the new image file ---
        const uploadPath = path.join(
          __backendDir,
          "public",
          "storage",
          "qc2_images"
        );
        const fileExtension = path.extname(req.file.originalname);
        const newFilename = `qc2-defect-${Date.now()}-${Math.round(
          Math.random() * 1e9
        )}${fileExtension}`;
        const fullFilePath = path.join(uploadPath, newFilename);
        await fs.promises.writeFile(fullFilePath, req.file.buffer);

        // --- Update the database with the new path ---
        const newRelativeUrl = `/storage/qc2_images/${newFilename}`;
        defect.image = newRelativeUrl;
        const updatedDefect = await defect.save();

        res.status(200).json({
          success: true,
          message: "Image replaced successfully.",
          defect: updatedDefect
        });
      } catch (error) {
        console.error("Error replacing defect image:", error);
        res.status(500).json({
          success: false,
          message: "Server error while replacing image."
        });
      }
};

export const deleteQC2Image = async (req, res) => {
  try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid defect ID." });
      }

      const defect = await QC2Defects.findById(id);
      if (!defect) {
        return res
          .status(404)
          .json({ success: false, message: "Defect not found." });
      }

      if (!defect.image) {
        return res
          .status(200)
          .json({ success: true, message: "No image to delete." });
      }

      // --- Delete the image file from the filesystem ---
      const imagePath = path.join(__backendDir, "public", defect.image);
      if (fs.existsSync(imagePath)) {
        await fs.promises.unlink(imagePath);
      }

      // --- Update the database to remove the image path ---
      defect.image = ""; // Set to empty string or null
      const updatedDefect = await defect.save();

      res.status(200).json({
        success: true,
        message: "Image deleted successfully.",
        defect: updatedDefect
      });
    } catch (error) {
      console.error("Error deleting defect image:", error);
      res
        .status(500)
        .json({ success: false, message: "Server error while deleting image." });
    }
};

// GET - Fetch all unique QC2 defect categories
export const getAllQC2DefectCategories = async (req, res) => {
   try {
       const categories = await QC2Defects.distinct("categoryEnglish");

       res.json(categories.sort());
     } catch (error) {
       console.error("Error fetching QC2 defect categories:", error);
       res
         .status(500)
         .json({ message: "Server error fetching defect categories" });
     }
};
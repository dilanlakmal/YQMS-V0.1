import path from "path";
import { promises as fsPromises } from "fs";
import sharp from "sharp";
import { API_BASE_URL, __backendDir } from "../../../Config/appConfig.js";
import { sanitize } from "../../../helpers/helperFunctions.js";
import {
  QCAccuracyReportModel,
  QADefectsModel,
  QAStandardDefectsModel
} from "../../MongoDB/dbConnectionController.js";

export const saveQAAccuracyImage = async (req, res) => {
  try {
    const { imageType, moNo, qcId, date } = req.body;
    const imageFile = req.file;

    if (!imageFile) {
      return res
        .status(400)
        .json({ success: false, message: "No image file provided." });
    }
    if (!imageType || !moNo || !qcId || !date) {
      return res.status(400).json({
        success: false,
        message: "Missing required metadata for image."
      });
    }

    // Define the target path for QA Accuracy images
    const qaAccuracyUploadPath = path.join(
      __backendDir,
      "public",
      "storage",
      "qa_accuracy"
    );
    // Ensure the directory exists
    await fsPromises.mkdir(qaAccuracyUploadPath, { recursive: true });

    // Sanitize metadata for a unique and safe filename
    const sanitizedImageType = sanitize(imageType); // 'defect' or 'additional'
    const sanitizedMoNo = sanitize(moNo);
    const sanitizedQcId = sanitize(qcId);
    const sanitizedDate = sanitize(date.split("T")[0]); // Use YYYY-MM-DD part of date

    const imagePrefix = `${sanitizedImageType}_${sanitizedMoNo}_${sanitizedDate}_${sanitizedQcId}_`;

    const newFilename = `${imagePrefix}${Date.now()}.webp`;
    const finalDiskPath = path.join(qaAccuracyUploadPath, newFilename);

    // Process and save the image using sharp
    await sharp(imageFile.buffer)
      .resize({
        width: 1024,
        height: 1024,
        fit: "inside",
        withoutEnlargement: true
      })
      .webp({ quality: 80 })
      .toFile(finalDiskPath);

    const publicUrl = `${API_BASE_URL}/storage/qa_accuracy/${newFilename}`;

    res.json({ success: true, filePath: publicUrl });
  } catch (error) {
    console.error("Error in /api/qa-accuracy/upload-image:", error);
    res.status(500).json({
      success: false,
      message: "Server error during image processing."
    });
  }
};

// GET - Fetch all QA defects for the dropdown (lightweight version)
export const getQADefectsForDropdown = async (req, res) => {
  try {
    const defects = await QADefectsModel.find({})
      .sort({ code: 1 })
      .select("code english khmer chinese statusByBuyer") // Select only necessary fields
      .lean();
    res.json(defects);
  } catch (error) {
    console.error("Error fetching QA defects list:", error);
    res.status(500).json({ message: "Server error fetching QA defects list" });
  }
};

// --- FIX #2: NEW ENDPOINT TO FETCH STANDARD DEFECTS FOR THE FORM ---
export const getStandardDefectsForForm = async (req, res) => {
  try {
    const defects = await QAStandardDefectsModel.find({})
      .sort({ code: 1 })
      .lean(); // Use lean for performance
    res.json(defects);
  } catch (error) {
    console.error("Error fetching standard defects list:", error);
    res
      .status(500)
      .json({ message: "Server error fetching standard defects list" });
  }
};

// POST - Save a new QC Accuracy Inspection Report
export const saveQCAccuracyReport = async (req, res) => {
  try {
    // Basic validation
    const requiredFields = [
      "reportDate",
      "qcInspector",
      "scannedQc",
      "reportType",
      "moNo",
      "totalCheckedQty",
      "result"
    ];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res
          .status(400)
          .json({ message: `Missing required field: ${field}` });
      }
    }

    const newReport = new QCAccuracyReportModel(req.body);
    await newReport.save();

    res.status(201).json({
      message: "QC Accuracy report saved successfully!",
      report: newReport
    });
  } catch (error) {
    console.error("Error saving QC Accuracy report:", error);
    res
      .status(500)
      .json({ message: "Failed to save report", error: error.message });
  }
};

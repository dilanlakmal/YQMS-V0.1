import {
  QAStandardDefectsModel,
  SubconSewingQAReport
} from "../../MongoDB/dbConnectionController.js";
import path from "path";
import { __backendDir } from "../../../Config/appConfig.js";
import { sanitize } from "../../../helpers/helperFunctions.js";
import sharp from "sharp";
import {
  generateSubconQAReportID,
  getBuyerFromMoNumber
} from "../../../helpers/helperFunctions.js";

// 1. ENDPOINT: Search for QA Standard Defects
export const getStanderdDefect = async (req, res) => {
  try {
    const { searchTerm } = req.query;
    if (!searchTerm) {
      return res.json([]);
    }

    const searchNumber = parseInt(searchTerm, 10);
    const query = isNaN(searchNumber)
      ? {
          $or: [
            { english: { $regex: searchTerm, $options: "i" } },
            { khmer: { $regex: searchTerm, $options: "i" } }
          ]
        }
      : { code: searchNumber };

    const defects = await QAStandardDefectsModel.find(query)
      .limit(20)
      .sort({ code: 1 });
    res.json(defects);
  } catch (error) {
    console.error("Error fetching QA standard defects:", error);
    res.status(500).json({ error: "Failed to fetch QA defects" });
  }
};

// 2. ENDPOINT: Image Upload for QA Module
export const saveQaImageUpload = async (req, res) => {
  try {
    const {
      reportType,
      factory,
      lineNo,
      moNo,
      color,
      qcId,
      imageType,
      sectionName
    } = req.body; // imageType can be 'defect', 'spi', etc.
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({ message: "No image file provided." });
    }
    if (!moNo || !qcId || !imageType) {
      return res.status(400).json({ message: "Missing required metadata." });
    }

    const uploadPath = path.join(
      __backendDir,
      "public",
      "storage",
      "sub-con-qc1"
    );
    //await fsPromises.mkdir(uploadPath, { recursive: true });

    const sanitizedReportType = sanitize(reportType);
    const sanitizedFactory = sanitize(factory);
    const sanitizedlineNo = sanitize(lineNo);
    const sanitizedMoNo = sanitize(moNo);
    const sanitizedColor = sanitize(color);
    const sanitizedQcId = sanitize(qcId);
    const sanitizedImageType = sanitize(imageType);
    const sanitizedSection = sanitize(sectionName || "");

    const timestamp = Date.now();
    const newFilename = `${sanitizedImageType}${
      sanitizedSection ? `_${sanitizedSection}` : ""
    }_${sanitizedReportType}_${sanitizedFactory}_${sanitizedlineNo}_${sanitizedMoNo}_${sanitizedColor}_${sanitizedQcId}_${timestamp}.webp`;
    const finalDiskPath = path.join(uploadPath, newFilename);

    await sharp(imageFile.buffer)
      .resize({
        width: 1024,
        height: 1024,
        fit: "inside",
        withoutEnlargement: true
      })
      .webp({ quality: 80 })
      .toFile(finalDiskPath);

    const relativeUrl = `/storage/sub-con-qc1/${newFilename}`;
    res.json({ success: true, filePath: relativeUrl });
  } catch (error) {
    console.error("Error in Sub-Con QA image upload:", error);
    res.status(500).json({ message: "Server error during image processing." });
  }
};

// 3. ENDPOINT: Save a new QA Sample Report (MODIFIED)
export const saveSubconQAReport = async (req, res) => {
  try {
    const reportData = req.body;
    const { qcData, ...headerData } = reportData;

    // --- Calculate totals from the qcData array ---
    let totalCheckedQty = 0;
    let totalRejectPcs = 0;
    let totalOverallDefectQty = 0;

    qcData.forEach((qc) => {
      totalCheckedQty += Number(qc.checkedQty) || 0;
      totalRejectPcs += Number(qc.rejectPcs) || 0;
      totalOverallDefectQty += Number(qc.totalDefectQty) || 0;
    });

    const startOfDay = new Date(headerData.inspectionDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const reportID = await generateSubconQAReportID();
    const buyer = getBuyerFromMoNumber(headerData.moNo);

    const newReport = new SubconSewingQAReport({
      ...headerData,
      qcData,
      inspectionDate: startOfDay,
      reportID,
      buyer,
      totalCheckedQty,
      totalRejectPcs,
      totalOverallDefectQty
    });

    await newReport.save();
    res.status(201).json({
      message: "QA Report saved successfully!",
      reportID: reportID
    });
  } catch (error) {
    console.error("Error saving Sub-Con QA report:", error);
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ error: "A report with these exact details already exists." });
    }
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ error: "Validation failed", details: error.message });
    }
    res.status(500).json({ error: "Failed to save QA report" });
  }
};

// 4. ENDPOINT: Find a specific QA report (MODIFIED)
export const getSubConSewingQAReport = async (req, res) => {
  try {
    const { inspectionDate, reportType, factory, lineNo, moNo, color } =
      req.query;

    if (
      !inspectionDate ||
      !reportType ||
      !factory ||
      !lineNo ||
      !moNo ||
      !color
    ) {
      return res
        .status(400)
        .json({ error: "Missing required search parameters." });
    }

    const startOfDay = new Date(inspectionDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(inspectionDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const report = await SubconSewingQAReport.findOne({
      factory,
      reportType,
      lineNo,
      moNo,
      color,
      inspectionDate: { $gte: startOfDay, $lte: endOfDay }
    }).lean();

    res.json(report);
  } catch (error) {
    console.error("Error finding Sub-Con QA report:", error);
    res.status(500).json({ error: "Failed to find QA report" });
  }
};

// 5. ENDPOINT: Update an existing QA report by its ID
export const updateSubConSewingQAReport = async (req, res) => {
  try {
    const { id } = req.params;
    const reportData = req.body;
    const { qcData, ...headerData } = reportData;

    // --- Recalculate totals from the qcData array ---
    let totalCheckedQty = 0;
    let totalRejectPcs = 0;
    let totalOverallDefectQty = 0;

    if (qcData && Array.isArray(qcData)) {
      qcData.forEach((qc) => {
        totalCheckedQty += Number(qc.checkedQty) || 0;
        totalRejectPcs += Number(qc.rejectPcs) || 0;
        totalOverallDefectQty += Number(qc.totalDefectQty) || 0;
      });
    }

    const startOfDay = new Date(headerData.inspectionDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const buyer = getBuyerFromMoNumber(headerData.moNo);

    const updatePayload = {
      ...headerData,
      qcData,
      inspectionDate: startOfDay,
      buyer,
      totalCheckedQty,
      totalRejectPcs,
      totalOverallDefectQty
    };

    const updatedReport = await SubconSewingQAReport.findByIdAndUpdate(
      id,
      updatePayload,
      { new: true, runValidators: true }
    );

    if (!updatedReport) {
      return res.status(404).json({ error: "QA Report not found." });
    }

    res.json({
      message: "QA Report updated successfully!",
      report: updatedReport
    });
  } catch (error) {
    console.error("Error updating Sub-Con QA report:", error);
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ error: "Validation failed", details: error.message });
    }
    res.status(500).json({ error: "Failed to update QA report" });
  }
};

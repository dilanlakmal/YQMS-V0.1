import mongoose from "mongoose";
import {
  ReportWashing,
  ReportHomeWash,
  ReportGarmentWash,
  ReportHTTesting,
  ReportEMBPrinting,
  ReportPullingTest,
  RoleManagment
} from "../MongoDB/dbConnectionController.js";
import { API_BASE_URL, io } from "../../Config/appConfig.js";
import { washingMachineTestUploadPath } from "../../helpers/helperFunctions.js";
import { __backendDir } from "../../Config/appConfig.js";
import sharp from "sharp";
import path from "path";
import fs from "fs";

const ASSET_BASE_PATH = path.resolve(__backendDir, "../public/assets/Wash-bold");

const IMAGE_PROCESS_BATCH_SIZE = 4;

// Process image files in parallel batches (concurrency cap to avoid memory spikes)
const processImageFilesBatch = async (files, typePrefix, ymStyle = "unknown") => {
  const sanitizedYmStyle = (ymStyle || "unknown")
    .replace(/[/\\]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "");
  const results = [];
  for (let i = 0; i < files.length; i += IMAGE_PROCESS_BATCH_SIZE) {
    const batch = files.slice(i, i + IMAGE_PROCESS_BATCH_SIZE);
    const batchPromises = batch.map(async (file) => {
      try {
        const timestamp = Date.now();
        const randomSuffix = Math.round(Math.random() * 1e9);
        const filename = `${typePrefix}-${sanitizedYmStyle}-${timestamp}-${randomSuffix}.webp`;
        const finalDiskPath = path.join(washingMachineTestUploadPath, filename);
        await sharp(file.buffer)
          .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 85 })
          .toFile(finalDiskPath);
        return `${API_BASE_URL}/storage/washing_machine_test/${filename}`;
      } catch (imageError) {
        console.error("Error processing image:", imageError);
        return null;
      }
    });
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.filter(Boolean));
  }
  return results;
};

/* ------------------------------
   End Points - Report Washing
------------------------------ */

// Helper to get model by report type
const getModelByReportType = (reportType) => {
  switch (reportType) {
    case "Home Wash Test": return ReportHomeWash;
    case "Garment Wash Report": return ReportGarmentWash;
    case "HT Testing": return ReportHTTesting;
    case "EMB/Printing Testing": return ReportEMBPrinting;
    case "EMB Testing": return ReportEMBPrinting; // Legacy support
    case "Pulling Test": return ReportPullingTest;
    default: return ReportHomeWash; // Default to Home Wash
  }
};

// Helper to find document across all collections (by _id or qrId) — parallel lookups
const findReportById = async (id) => {
  if (!id || String(id).trim() === "") return { doc: null, model: null };
  const idVal = String(id).trim();
  const models = [ReportHomeWash, ReportGarmentWash, ReportHTTesting, ReportEMBPrinting, ReportPullingTest, ReportWashing];

  const isObjectId = mongoose.Types.ObjectId.isValid(idVal) && String(new mongoose.Types.ObjectId(idVal)) === idVal;

  // Run all lookups in parallel: findById (when valid ObjectId) and findOne by qrId
  const findByIdPromises = isObjectId ? models.map((model) => model.findById(idVal)) : [];
  const findByQrIdPromises = models.map((model) => model.findOne({ qrId: idVal }).lean());

  const [byIdResults, byQrIdResults] = await Promise.all([
    findByIdPromises.length > 0 ? Promise.all(findByIdPromises) : [],
    Promise.all(findByQrIdPromises)
  ]);

  // Prefer findById result (ObjectId match) if found; else use qrId match
  if (isObjectId) {
    for (let i = 0; i < byIdResults.length; i++) {
      if (byIdResults[i]) return { doc: byIdResults[i], model: models[i] };
    }
  }
  for (let i = 0; i < byQrIdResults.length; i++) {
    if (byQrIdResults[i]) return { doc: byQrIdResults[i], model: models[i] };
  }

  return { doc: null, model: null };
};

// Save Report Washing data
export const saveReportWashing = async (req, res) => {
  try {
    const {
      reportType, // Get reportType from body
      ymStyle,
      buyerStyle,
      color,
      po,
      exFtyDate,
      factory,
      reportDate,
      sendToHomeWashingDate,
      notes,
      userId, // Accept userId from frontend (will be stored as report_emp_id)
      userName
    } = req.body;

    // Validate required fields
    if (!ymStyle) {
      return res.status(400).json({
        success: false,
        message: "YM Style is required"
      });
    }

    if (!color || color.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one color must be selected"
      });
    }

    // PO and Ex Fty Date are optional - no validation needed

    // Process uploaded images
    const imagePaths = [];
    const careLabelImagePaths = [];

    if (req.files) {
      if (!fs.existsSync(washingMachineTestUploadPath)) {
        fs.mkdirSync(washingMachineTestUploadPath, { recursive: true });
      }

      const imagesToProcess = Array.isArray(req.files) ? req.files : (req.files.images || []);
      const careLabelFiles = !Array.isArray(req.files) && req.files.careLabelImage
        ? (Array.isArray(req.files.careLabelImage) ? req.files.careLabelImage : [req.files.careLabelImage])
        : [];

      const [mainPaths, carePaths] = await Promise.all([
        imagesToProcess.length > 0 ? processImageFilesBatch(imagesToProcess, "washing-test", ymStyle) : [],
        careLabelFiles.length > 0 ? processImageFilesBatch(careLabelFiles, "care-label", ymStyle) : []
      ]);
      imagePaths.push(...mainPaths);
      careLabelImagePaths.push(...carePaths);
    }

    // Parse JSON fields if they are strings
    const parsedColor = typeof color === "string" ? JSON.parse(color) : color;
    const parsedPO = typeof po === "string" ? JSON.parse(po) : po;
    const parsedExFtyDate = typeof exFtyDate === "string" ? JSON.parse(exFtyDate) : exFtyDate;
    const parseReportSampleSizes = (raw) => {
      if (!raw) return [];
      if (Array.isArray(raw)) return raw.map((s) => String(s).trim()).filter(Boolean);
      if (typeof raw === "string" && raw.trim()) {
        try {
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? parsed.map((s) => String(s).trim()).filter(Boolean) : [];
        } catch (e) {
          return raw.split(",").map((s) => s.trim()).filter(Boolean);
        }
      }
      return [];
    };
    const parsedReportSampleSizes = parseReportSampleSizes(req.body.reportSampleSizes ?? req.body.sampleSize);

    // Helper to safely parse JSON fields
    const safeParseJSON = (data, fallback = []) => {
      if (!data) return fallback;
      if (typeof data === 'object') return data;
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error("Error parsing JSON field:", e);
        return fallback;
      }
    };

    const parsedColorFastnessRows = safeParseJSON(req.body.colorFastnessRows);
    const parsedColorStainingRows = safeParseJSON(req.body.colorStainingRows);
    const parsedShrinkageRows = safeParseJSON(req.body.shrinkageRows);
    const parsedVisualAssessmentRows = safeParseJSON(req.body.visualAssessmentRows);

    // Parse careSymbols if present
    let parsedCareSymbols = {};
    if (req.body.careSymbols) {
      try {
        parsedCareSymbols = typeof req.body.careSymbols === "string" ? JSON.parse(req.body.careSymbols) : req.body.careSymbols;
      } catch (e) {
        console.error("Error parsing careSymbols:", e);
        parsedCareSymbols = req.body.careSymbols;
      }
    }

    // Process careSymbols to create careSymbolsImages (Base64)
    const careSymbolsImages = {};
    if (parsedCareSymbols && typeof parsedCareSymbols === 'object') {
      for (const [key, filename] of Object.entries(parsedCareSymbols)) {
        if (filename && typeof filename === 'string') {
          try {
            const filePath = path.join(ASSET_BASE_PATH, filename);
            if (fs.existsSync(filePath)) {
              const fileBuffer = fs.readFileSync(filePath);
              const base64Image = `data:image/png;base64,${fileBuffer.toString('base64')}`;
              careSymbolsImages[key] = base64Image;
            }
          } catch (err) {
            console.error(`Error reading asset file ${filename}:`, err);
          }
        }
      }
    }

    // Build reportData from explicit req.body fields only — no spread, no delete
    const reportData = {
      reportType: reportType || "Home Wash Test",
      ymStyle: (req.body.ymStyle || req.body.style || "").trim(),
      buyerStyle: (req.body.buyerStyle || "").trim(),
      color: Array.isArray(parsedColor) ? parsedColor : [parsedColor],
      po: Array.isArray(parsedPO) ? parsedPO : [parsedPO],
      exFtyDate: Array.isArray(parsedExFtyDate) ? parsedExFtyDate : [parsedExFtyDate],
      reportSampleSizes: parsedReportSampleSizes,
      factory: (req.body.factory || "").trim(),
      sendToHomeWashingDate: sendToHomeWashingDate ? new Date(sendToHomeWashingDate) : new Date(),
      images: imagePaths,
      careLabelImage: careLabelImagePaths,
      careSymbols: parsedCareSymbols,
      careSymbolsImages: careSymbolsImages,
      colorFastnessRows: parsedColorFastnessRows,
      colorStainingRows: parsedColorStainingRows,
      shrinkageRows: parsedShrinkageRows,
      visualAssessmentRows: parsedVisualAssessmentRows,
      notes: (req.body.notes || "").trim(),
      reporter_emp_id: req.body.reporter_emp_id || req.body.userId || "",
      reporter_status: "done",
      reporter_name: req.body.reporter_name || req.body.userName || "",
      submittedAt: new Date()
    };
    if (reportDate && String(reportDate).trim()) {
      reportData.reportDate = new Date(reportDate);
    } else {
      reportData.reportDate = new Date(); // Fallback to submission time when not provided
    }

    // Copy allowed report-type specific fields from req.body (explicit allowlist)
    // custStyle removed: we use buyerStyle only (same value; avoid storing duplicate)
    const ALLOWED_EXTRA = ["season", "styleDescription", "mainFabric", "liningInserts", "detergent", "washingMethod", "beforeWashComments", "afterWashComments", "finalResult", "checkedBy", "approvedBy", "washType", "fabricColor"];
    for (const key of ALLOWED_EXTRA) {
      const val = req.body[key];
      if (val !== undefined && val !== null) {
        if (key === "fabricColor") reportData[key] = Array.isArray(val) ? val : (typeof val === "string" ? val.split(",").map((s) => s.trim()).filter(Boolean) : []);
        else if (typeof val === "string") reportData[key] = val.trim();
        else reportData[key] = val;
      }
    }

    // Determine Model based on Report Type
    console.log("Saving Report - Type:", reportData.reportType);
    const ReportModel = getModelByReportType(reportData.reportType);
    console.log("Selected Model:", ReportModel.modelName, "Collection:", ReportModel.collection.name);

    // Create and save the report (qrId set via pre-save hook)
    const newReport = new ReportModel(reportData);
    const savedData = await newReport.save();
    console.log("Data Saved Successfully to ID:", savedData._id);

    // Emit socket event for real-time updates
    io.emit("washing-report-created", savedData);

    res.status(201).json({
      success: true,
      message: "Report Washing data saved successfully",
      data: savedData
    });
  } catch (error) {
    console.error("Error saving Report Washing data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save Report Washing data",
      error: error.message,
      details: error.errors
        ? Object.keys(error.errors).map((key) => ({
          field: key,
          message: error.errors[key].message
        }))
        : undefined
    });
  }
};

// Get all Report Washing data
export const getReportWashing = async (req, res) => {
  try {
    const { ymStyle, factory, startDate, endDate, reportType, status, excludeStatus, idOrQr } = req.query;

    // Sanitize pagination parameters
    const limitNum = Math.max(1, parseInt(req.query.limit) || 10);
    const pageNum = Math.max(1, parseInt(req.query.page) || 1);
    const skip = (pageNum - 1) * limitNum;

    let query = {};

    if (ymStyle) {
      query.ymStyle = { $regex: ymStyle, $options: "i" };
    }

    if (factory) {
      query.factory = { $regex: factory, $options: "i" };
    }

    if (req.query.color) {
      query.color = { $regex: req.query.color, $options: "i" };
    }

    if (excludeStatus) {
      query.status = { $ne: excludeStatus };
    } else if (status) {
      query.status = status;
    }

    if (idOrQr && String(idOrQr).trim()) {
      const idVal = String(idOrQr).trim();
      const orConditions = [{ qrId: idVal }];
      if (mongoose.Types.ObjectId.isValid(idVal) && String(new mongoose.Types.ObjectId(idVal)) === idVal) {
        orConditions.push({ _id: new mongoose.Types.ObjectId(idVal) });
      }
      query.$or = orConditions;
    }



    if (startDate || endDate) {
      query.reportDate = {};
      if (startDate) {
        // Start of the day
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.reportDate.$gte = start;
      }
      if (endDate) {
        // End of the day (23:59:59.999)
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.reportDate.$lte = end;
      }
    }

    // Determine which models to query
    let modelsToQuery = [];
    if (reportType) {
      modelsToQuery = [getModelByReportType(reportType)];
    } else {
      // Query all 5 models + legacy
      modelsToQuery = [ReportHomeWash, ReportGarmentWash, ReportHTTesting, ReportEMBPrinting, ReportPullingTest, ReportWashing];
    }

    // Parallel query to all relevant collections
    const countPromises = modelsToQuery.map((model) => model.countDocuments(query));
    const counts = await Promise.all(countPromises);
    const totalRecords = counts.reduce((sum, count) => sum + count, 0);

    let paginatedReports;

    if (modelsToQuery.length === 1) {
      // Single model: use DB-level pagination directly
      paginatedReports = await modelsToQuery[0]
        .find(query)
        .sort({ reportDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();
    } else {
      // Multiple models: fetch enough from each to cover skip+limitNum, merge-sort, then slice
      const fetchLimit = skip + limitNum;
      const findPromises = modelsToQuery.map((model) =>
        model.find(query).sort({ reportDate: -1, createdAt: -1 }).limit(fetchLimit).lean()
      );
      const results = await Promise.all(findPromises);
      const allReports = results.flat();
      allReports.sort((a, b) => {
        const dateA = new Date(a.reportDate || a.createdAt);
        const dateB = new Date(b.reportDate || b.createdAt);
        return dateB - dateA; // Descending
      });
      paginatedReports = allReports.slice(skip, skip + limitNum);
    }

    res.status(200).json({
      success: true,
      data: paginatedReports,
      pagination: {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limitNum),
        currentPage: pageNum,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error("Error fetching Report Washing data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch Report Washing data",
      error: error.message
    });
  }
};

// Get a single Report Washing by ID
export const getReportWashingById = async (req, res) => {
  try {
    const { id } = req.params;

    // Try finding in all collections
    const { doc } = await findReportById(id);

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Report Washing not found"
      });
    }

    res.status(200).json({
      success: true,
      data: doc
    });
  } catch (error) {
    console.error("Error fetching Report Washing by ID:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch Report Washing data",
      error: error.message
    });
  }
};

// Allowed fields for update — only these are copied from req.body (no spread)
// custStyle removed: use buyerStyle only (same value; avoid storing duplicate)
const UPDATE_ALLOWED = ["reportType", "color", "buyerStyle", "po", "exFtyDate", "reportSampleSizes", "factory", "sendToHomeWashingDate", "status", "receivedDate", "receivedAt", "receiver_emp_id", "receivedNotes", "receivedImages", "completedDate", "completedAt", "completionImages", "completionNotes", "completer_emp_id", "checkedBy", "approvedBy", "checkedByName", "approvedByName", "rejectedAt", "rejectedNotes", "reportDate", "colorFastnessRows", "colorStainingRows", "shrinkageRows", "visualAssessmentRows", "careSymbols", "careLabelImageUrls", "season", "styleDescription", "mainFabric", "liningInserts", "detergent", "washingMethod", "beforeWashComments", "afterWashComments", "finalResult", "washType", "fabricColor", "reporter_emp_id", "reporter_name"];

// Update Report Washing by ID
export const updateReportWashing = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {};
    for (const key of UPDATE_ALLOWED) {
      const val = req.body[key];
      if (val === undefined || val === null) continue;
      if (key === "reportDate" && String(val).trim() === "") continue;
      updateData[key] = val;
    }
    if (updateData.reporter_emp_id === undefined && req.body.userId !== undefined) updateData.reporter_emp_id = req.body.userId;
    if (updateData.reporter_name === undefined && req.body.userName !== undefined) updateData.reporter_name = req.body.userName;

    // Find the right model and doc
    const { model: ReportModel, doc: existingReport } = await findReportById(id);

    if (!ReportModel || !existingReport) {
      return res.status(404).json({
        success: false,
        message: "Report Washing not found"
      });
    }

    // Parse JSON fields if they are strings (from FormData)
    if (updateData.color) {
      try {
        const parsedColor = typeof updateData.color === "string" ? JSON.parse(updateData.color) : updateData.color;
        updateData.color = Array.isArray(parsedColor) ? parsedColor : [parsedColor];
      } catch (error) {
        console.error("Error parsing color:", error);
        // Keep original value if parsing fails
      }
    }

    // Detect color change and whether editor is warehouse (for submitter notification).
    // Only run this when the request sent a color field (e.g. Edit form). When the client
    // does not send color (e.g. saving Received status), do not treat as color change or add admin-edit icon.
    const colorWasSent = req.body.color != null;
    const prevColor = Array.isArray(existingReport.color) ? existingReport.color : [];
    const newColor = Array.isArray(updateData.color) ? updateData.color : [];
    const colorChanged = colorWasSent && (
      prevColor.length !== newColor.length ||
      prevColor.some((c, i) => newColor[i] !== c) ||
      newColor.some((c, i) => prevColor[i] !== c)
    );
    const editedByWarehouse = req.body.editedByWarehouse === true || req.body.editedByWarehouse === "true";

    // When warehouse edits colors, append to notificationHistory so history is never lost (notification modal shows full history)
    let notificationHistoryEntry = null;
    if (editedByWarehouse && colorChanged) {
      const now = new Date();
      const rejectedColors = prevColor.filter((c) => !newColor.includes(c));
      updateData.colorEditedByWarehouseAt = now;
      updateData.colorEditedByWarehouseBy = req.body.editorUserId || req.body.editorEmpId || "";
      updateData.colorEditedByWarehouseName = req.body.editorUserName || req.body.editorName || "";
      updateData.colorUncheckedByWarehouse = rejectedColors;
      notificationHistoryEntry = {
        type: "COLOR_UPDATE",
        at: now,
        userId: req.body.editorUserId || req.body.editorEmpId || "",
        userName: req.body.editorUserName || req.body.editorName || "",
        previousColorCount: prevColor.length,
        newColorCount: newColor.length,
        rejectedColors
      };
    }
    // When a non-warehouse user (e.g. reporter) updates the report, set reporter-edit notification and clear warehouse notification
    if (!editedByWarehouse && colorChanged) {
      updateData.colorEditedByWarehouseAt = null;
      updateData.colorEditedByWarehouseBy = "";
      updateData.colorEditedByWarehouseName = "";
      updateData.colorUncheckedByWarehouse = [];
      const now = new Date();
      const rejectedColors = prevColor.filter((c) => !newColor.includes(c));
      updateData.editedByReporterAt = now;
      updateData.editedByReporterBy = req.body.editorUserId || req.body.editorEmpId || "";
      updateData.editedByReporterName = req.body.editorUserName || req.body.editorName || "";
      notificationHistoryEntry = {
        type: "REPORTER_EDIT",
        at: now,
        userId: req.body.editorUserId || req.body.editorEmpId || "",
        userName: req.body.editorUserName || req.body.editorName || "",
        previousColorCount: prevColor.length,
        newColorCount: newColor.length,
        rejectedColors
      };
    }

    // Helper to safely parse JSON fields (duplicate of logic in save, consider hoisting if refactoring)
    const safeParseJSON = (data, fallback = []) => {
      if (!data) return fallback;
      if (typeof data === 'object') return data;
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error("Error parsing JSON field:", e);
        return fallback;
      }
    };

    // Parse complex fields if they exist in updateData
    if (updateData.colorFastnessRows) updateData.colorFastnessRows = safeParseJSON(updateData.colorFastnessRows);
    if (updateData.colorStainingRows) updateData.colorStainingRows = safeParseJSON(updateData.colorStainingRows);
    if (updateData.shrinkageRows) updateData.shrinkageRows = safeParseJSON(updateData.shrinkageRows);
    if (updateData.visualAssessmentRows) updateData.visualAssessmentRows = safeParseJSON(updateData.visualAssessmentRows);


    if (updateData.po) {
      try {
        const parsedPO = typeof updateData.po === "string" ? JSON.parse(updateData.po) : updateData.po;
        updateData.po = Array.isArray(parsedPO) ? parsedPO : [parsedPO];
      } catch (error) {
        console.error("Error parsing po:", error);
        // Keep original value if parsing fails
      }
    }

    if (updateData.exFtyDate) {
      try {
        const parsedExFtyDate = typeof updateData.exFtyDate === "string" ? JSON.parse(updateData.exFtyDate) : updateData.exFtyDate;
        updateData.exFtyDate = Array.isArray(parsedExFtyDate) ? parsedExFtyDate : [parsedExFtyDate];
      } catch (error) {
        console.error("Error parsing exFtyDate:", error);
        // Keep original value if parsing fails
      }
    }

    const rawSizes = updateData.reportSampleSizes ?? updateData.sampleSize;
    if (rawSizes != null) {
      try {
        let parsed = [];
        if (Array.isArray(rawSizes)) {
          parsed = rawSizes.map((s) => String(s).trim()).filter(Boolean);
        } else if (typeof rawSizes === "string" && rawSizes.trim()) {
          try {
            const p = JSON.parse(rawSizes);
            parsed = Array.isArray(p) ? p.map((s) => String(s).trim()).filter(Boolean) : [];
          } catch (e) {
            parsed = rawSizes.split(",").map((s) => s.trim()).filter(Boolean);
          }
        }
        updateData.reportSampleSizes = parsed;
        delete updateData.sampleSize;
      } catch (error) {
        console.error("Error parsing reportSampleSizes:", error);
      }
    }

    if (updateData.careSymbols) {
      try {
        updateData.careSymbols = typeof updateData.careSymbols === "string" ? JSON.parse(updateData.careSymbols) : updateData.careSymbols;

        // Also update careSymbolsImages if careSymbols is being updated
        const careSymbolsImages = {};
        if (updateData.careSymbols && typeof updateData.careSymbols === 'object') {
          for (const [key, filename] of Object.entries(updateData.careSymbols)) {
            if (filename && typeof filename === 'string') {
              try {
                const filePath = path.join(ASSET_BASE_PATH, filename);
                if (fs.existsSync(filePath)) {
                  const fileBuffer = fs.readFileSync(filePath);
                  const base64Image = `data:image/png;base64,${fileBuffer.toString('base64')}`;
                  careSymbolsImages[key] = base64Image;
                }
              } catch (err) {
                console.error(`Error reading asset file ${filename}:`, err);
              }
            }
          }
        }
        updateData.careSymbolsImages = careSymbolsImages;

      } catch (error) {
        console.error("Error parsing careSymbols:", error);
      }
    }

    // Parse sendToHomeWashingDate if provided
    if (updateData.sendToHomeWashingDate) {
      updateData.sendToHomeWashingDate = new Date(updateData.sendToHomeWashingDate);
    }

    // Parse receivedDate and receivedAt if provided
    if (updateData.receivedDate) {
      updateData.receivedDate = new Date(updateData.receivedDate);
    }
    if (updateData.receivedAt) {
      updateData.receivedAt = new Date(updateData.receivedAt);
    }

    // Ensure directory exists
    if (req.files && (req.files.images || req.files.receivedImages || req.files.completionImages)) {
      if (!fs.existsSync(washingMachineTestUploadPath)) {
        fs.mkdirSync(washingMachineTestUploadPath, { recursive: true });
      }
    }

    const ymStyle = existingReport?.ymStyle || "unknown";

    // Handle initial images if uploaded
    if (req.files && req.files.images && req.files.images.length > 0) {
      const imagePaths = await processImageFilesBatch(
        Array.isArray(req.files.images) ? req.files.images : [req.files.images],
        "washing-test",
        ymStyle
      );

      // If imagesUrls is provided, use it to replace the array (user edited images)
      if (updateData.imagesUrls) {
        try {
          const existingUrls = typeof updateData.imagesUrls === "string" ? JSON.parse(updateData.imagesUrls) : updateData.imagesUrls;
          updateData.images = [...existingUrls, ...imagePaths];
          delete updateData.imagesUrls; // Remove from updateData
        } catch (error) {
          console.error("Error parsing imagesUrls:", error);
          // Fallback to merging with existing
          if (existingReport && existingReport.images && existingReport.images.length > 0) {
            updateData.images = [...existingReport.images, ...imagePaths];
          } else {
            updateData.images = imagePaths;
          }
        }
      } else {
        // Merge with existing images if any
        if (existingReport && existingReport.images && existingReport.images.length > 0) {
          updateData.images = [...existingReport.images, ...imagePaths];
        } else {
          updateData.images = imagePaths;
        }
      }
    } else if (updateData.imagesUrls) {
      // If only URLs are provided (no new files), replace the array
      try {
        const existingUrls = typeof updateData.imagesUrls === "string" ? JSON.parse(updateData.imagesUrls) : updateData.imagesUrls;
        updateData.images = existingUrls;
        delete updateData.imagesUrls;
      } catch (error) {
        console.error("Error parsing imagesUrls:", error);
      }
    }

    // Handle received images if uploaded
    if (req.files && req.files.receivedImages && req.files.receivedImages.length > 0) {
      const receivedFiles = Array.isArray(req.files.receivedImages) ? req.files.receivedImages : [req.files.receivedImages];
      const receivedImagePaths = await processImageFilesBatch(receivedFiles, "received", ymStyle);

      // If receivedImagesUrls is provided, use it to replace the array (user edited images)
      if (updateData.receivedImagesUrls) {
        try {
          const existingUrls = typeof updateData.receivedImagesUrls === "string" ? JSON.parse(updateData.receivedImagesUrls) : updateData.receivedImagesUrls;
          updateData.receivedImages = [...existingUrls, ...receivedImagePaths];
          delete updateData.receivedImagesUrls;
        } catch (error) {
          console.error("Error parsing receivedImagesUrls:", error);
          // Fallback to merging with existing
          if (existingReport && existingReport.receivedImages && existingReport.receivedImages.length > 0) {
            updateData.receivedImages = [...existingReport.receivedImages, ...receivedImagePaths];
          } else {
            updateData.receivedImages = receivedImagePaths;
          }
        }
      } else {
        // Merge with existing received images if any
        if (existingReport && existingReport.receivedImages && existingReport.receivedImages.length > 0) {
          updateData.receivedImages = [...existingReport.receivedImages, ...receivedImagePaths];
        } else {
          updateData.receivedImages = receivedImagePaths;
        }
      }
    } else if (updateData.receivedImagesUrls) {
      // If only URLs are provided (no new files), replace the array
      try {
        const existingUrls = typeof updateData.receivedImagesUrls === "string" ? JSON.parse(updateData.receivedImagesUrls) : updateData.receivedImagesUrls;
        updateData.receivedImages = existingUrls;
        delete updateData.receivedImagesUrls;
      } catch (error) {
        console.error("Error parsing receivedImagesUrls:", error);
      }
    }

    // Handle completion images if uploaded (normalize: multer may send single file or array)
    const completionFiles = req.files?.completionImages
      ? (Array.isArray(req.files.completionImages) ? req.files.completionImages : [req.files.completionImages])
      : [];
    const validCompletionFiles = completionFiles.filter((f) => f && f.buffer);
    if (validCompletionFiles.length > 0) {
      const completionImagePaths = await processImageFilesBatch(validCompletionFiles, "completion", ymStyle);

      // If completionImagesUrls is provided, use it to replace the array (user edited images)
      if (updateData.completionImagesUrls) {
        try {
          const existingUrls = typeof updateData.completionImagesUrls === "string" ? JSON.parse(updateData.completionImagesUrls) : updateData.completionImagesUrls;
          updateData.completionImages = [...existingUrls, ...completionImagePaths];
          delete updateData.completionImagesUrls;
        } catch (error) {
          console.error("Error parsing completionImagesUrls:", error);
          // Fallback to merging with existing
          if (existingReport && existingReport.completionImages && existingReport.completionImages.length > 0) {
            updateData.completionImages = [...existingReport.completionImages, ...completionImagePaths];
          } else {
            updateData.completionImages = completionImagePaths;
          }
        }
      } else {
        // Merge with existing completion images if any
        if (existingReport && existingReport.completionImages && existingReport.completionImages.length > 0) {
          updateData.completionImages = [...existingReport.completionImages, ...completionImagePaths];
        } else {
          updateData.completionImages = completionImagePaths;
        }
      }
    } else if (updateData.completionImagesUrls) {
      // If only URLs are provided (no new files), replace the array
      try {
        const existingUrls = typeof updateData.completionImagesUrls === "string" ? JSON.parse(updateData.completionImagesUrls) : updateData.completionImagesUrls;
        updateData.completionImages = existingUrls;
        delete updateData.completionImagesUrls;
      } catch (error) {
        console.error("Error parsing completionImagesUrls:", error);
      }
    }

    // Handle care label images if uploaded
    if (req.files && req.files.careLabelImage && req.files.careLabelImage.length > 0) {
      const careLabelFiles = Array.isArray(req.files.careLabelImage) ? req.files.careLabelImage : [req.files.careLabelImage];
      const careLabelImagePaths = await processImageFilesBatch(careLabelFiles, "care-label", ymStyle);

      // If careLabelImageUrls is provided, use it to replace/merge the array
      if (updateData.careLabelImageUrls) {
        try {
          const existingUrls = typeof updateData.careLabelImageUrls === "string" ? JSON.parse(updateData.careLabelImageUrls) : updateData.careLabelImageUrls;
          updateData.careLabelImage = [...existingUrls, ...careLabelImagePaths];
          delete updateData.careLabelImageUrls;
        } catch (error) {
          console.error("Error parsing careLabelImageUrls:", error);
          if (existingReport && existingReport.careLabelImage && Array.isArray(existingReport.careLabelImage)) {
            updateData.careLabelImage = [...existingReport.careLabelImage, ...careLabelImagePaths];
          } else {
            updateData.careLabelImage = careLabelImagePaths;
          }
        }
      } else {
        if (existingReport && existingReport.careLabelImage && Array.isArray(existingReport.careLabelImage)) {
          updateData.careLabelImage = [...existingReport.careLabelImage, ...careLabelImagePaths];
        } else {
          updateData.careLabelImage = careLabelImagePaths;
        }
      }
    } else if (updateData.careLabelImageUrls) {
      // If only URLs are provided (no new files), replace the array
      try {
        const existingUrls = typeof updateData.careLabelImageUrls === "string" ? JSON.parse(updateData.careLabelImageUrls) : updateData.careLabelImageUrls;
        updateData.careLabelImage = existingUrls;
        delete updateData.careLabelImageUrls;
      } catch (error) {
        console.error("Error parsing careLabelImageUrls:", error);
      }
    }

    // Find and update the report using the correct model
    const updateOp = { $set: updateData };
    if (notificationHistoryEntry) {
      updateOp.$push = { notificationHistory: notificationHistoryEntry };
    }
    const updatedReport = await ReportModel.findByIdAndUpdate(
      id,
      updateOp,
      { new: true, runValidators: true }
    );

    if (!updatedReport) {
      return res.status(404).json({
        success: false,
        message: "Report Washing not found"
      });
    }

    // Emit socket event for real-time updates
    io.emit("washing-report-updated", updatedReport);

    res.status(200).json({
      success: true,
      message: "Report Washing updated successfully",
      data: updatedReport
    });
  } catch (error) {
    console.error("Error updating Report Washing:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update Report Washing data",
      error: error.message
    });
  }
};

// Delete Report Washing by ID
export const deleteReportWashing = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the report first to get image paths
    const { model: ReportModel, doc: reportToDelete } = await findReportById(id);

    if (!reportToDelete || !ReportModel) {
      return res.status(404).json({
        success: false,
        message: "Report Washing not found"
      });
    }

    // Collect all image URLs from different status fields
    const allImages = [
      ...(reportToDelete.images || []),
      ...(reportToDelete.receivedImages || []),
      ...(reportToDelete.completionImages || []),
      ...(Array.isArray(reportToDelete.careLabelImage) ? reportToDelete.careLabelImage : [reportToDelete.careLabelImage])
    ].filter(url => url && typeof url === 'string');

    // Delete associated files from filesystem
    if (allImages.length > 0) {
      for (const imageUrl of allImages) {
        try {
          // Extract filename from URL (assumes format: .../filename.ext)
          const filename = imageUrl.split('/').pop();

          if (filename) {
            const filePath = path.join(washingMachineTestUploadPath, filename);

            // Check if file exists and delete it
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              console.log(`Deleted file: ${filePath}`);
            }
          }
        } catch (fileError) {
          // Log error but continue deleting other files and the report record
          console.error(`Error deleting file for image ${imageUrl}:`, fileError);
        }
      }
    }

    // Now delete the report from database using correct Model
    const deletedReport = await ReportModel.findByIdAndDelete(id);

    // Emit socket event for real-time updates
    io.emit("washing-report-deleted", id);

    res.status(200).json({
      success: true,
      message: "Report Washing and associated files deleted successfully",
      data: deletedReport
    });
  } catch (error) {
    console.error("Error deleting Report Washing:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete Report Washing",
      error: error.message
    });
  }
};

// Serve washing machine test images
export const getWashingMachineTestImage = async (req, res) => {
  try {
    const { filename } = req.params;

    // Set CORS headers
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Cache-Control", "public, max-age=3600");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    // Construct file path
    const filePath = path.join(washingMachineTestUploadPath, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error("Image file not found:", filePath);
      return res.status(404).json({
        success: false,
        message: "Image not found"
      });
    }

    // Determine content type
    const ext = path.extname(filename).toLowerCase();

    // Convert WebP to JPEG on-the-fly (react-pdf doesn't support WebP)
    if (ext === ".webp") {
      try {
        const convertedBuffer = await sharp(filePath)
          .jpeg({ quality: 90 })
          .toBuffer();
        res.setHeader("Content-Type", "image/jpeg");
        return res.send(convertedBuffer);
      } catch (conversionError) {
        console.error("Error converting WebP to JPEG:", conversionError);
        return res.status(500).json({ success: false, message: "Failed to convert image" });
      }
    }

    let contentType = "image/jpeg";
    if (ext === ".png") contentType = "image/png";
    if (ext === ".gif") contentType = "image/gif";

    // Send file
    res.setHeader("Content-Type", contentType);
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error("Error serving washing machine test image:", error);
    res.status(500).json({
      success: false,
      message: "Failed to serve image",
      error: error.message
    });
  }
};

// Get unique styles for autocomplete
export const getUniqueStyles = async (req, res) => {
  try {
    const { search = "" } = req.query;

    const models = [ReportHomeWash, ReportGarmentWash, ReportHTTesting, ReportEMBPrinting, ReportPullingTest, ReportWashing];

    const distinctPromises = models.map((model) =>
      model.distinct("ymStyle", { ymStyle: { $regex: search, $options: "i" } })
    );
    const results = await Promise.all(distinctPromises);

    const allStyles = new Set();
    results.forEach((styles) => styles.forEach((s) => allStyles.add(s)));
    const suggestions = Array.from(allStyles).slice(0, 10);

    res.status(200).json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error("Error fetching unique styles:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch styles",
      error: error.message
    });
  }
};

// Handle QR Code Scan - Mark report as received
export const scanReceived = async (req, res) => {
  try {
    const { id } = req.params;
    const { receiver_emp_id } = req.body;

    // Validate receiver_emp_id
    if (!receiver_emp_id) {
      return res.status(400).json({
        success: false,
        message: "receiver_emp_id is required"
      });
    }

    // Find the report
    const { model: ReportModel, doc: existingReport } = await findReportById(id);

    if (!ReportModel || !existingReport) {
      return res.status(404).json({
        success: false,
        message: "Report not found"
      });
    }

    // Check if already received
    if (existingReport.status === "received" || existingReport.status === "completed") {
      return res.status(400).json({
        success: false,
        message: `Report already ${existingReport.status}`,
        data: existingReport
      });
    }

    // Update the report
    const now = new Date();
    const updateData = {
      status: "received",
      receivedDate: now.toISOString().split('T')[0], // YYYY-MM-DD format
      receivedAt: now,
      receiver_emp_id: receiver_emp_id
    };

    const updatedReport = await ReportModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedReport) {
      return res.status(404).json({
        success: false,
        message: "Failed to update report"
      });
    }

    // Emit socket event for real-time updates
    io.emit("washing-report-updated", updatedReport);

    res.status(200).json({
      success: true,
      message: "Report marked as received successfully",
      data: updatedReport
    });
  } catch (error) {
    console.error("Error marking report as received:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark report as received",
      error: error.message
    });
  }
};

// Reject report (warehouse: e.g. color mismatch, wrong quantity) – only when status is pending
export const rejectReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { receiver_emp_id, rejectedNotes } = req.body;

    if (!receiver_emp_id) {
      return res.status(400).json({
        success: false,
        message: "receiver_emp_id is required"
      });
    }

    const { model: ReportModel, doc: existingReport } = await findReportById(id);

    if (!ReportModel || !existingReport) {
      return res.status(404).json({
        success: false,
        message: "Report not found"
      });
    }

    const currentStatus = existingReport.status || "";
    if (currentStatus && currentStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Report cannot be rejected (current status: ${currentStatus}). Only pending reports can be rejected.`
      });
    }

    const now = new Date();
    const updateData = {
      status: "rejected",
      receiver_emp_id,
      rejectedAt: now,
      rejectedNotes: rejectedNotes || ""
    };

    const updatedReport = await ReportModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedReport) {
      return res.status(404).json({
        success: false,
        message: "Failed to update report"
      });
    }

    io.emit("washing-report-updated", updatedReport);

    res.status(200).json({
      success: true,
      message: "Report rejected successfully",
      data: updatedReport
    });
  } catch (error) {
    console.error("Error rejecting report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject report",
      error: error.message
    });
  }
};

// Get unique colors for autocomplete
export const getUniqueColors = async (req, res) => {
  try {
    const { search = "" } = req.query;

    const models = [ReportHomeWash, ReportGarmentWash, ReportHTTesting, ReportEMBPrinting, ReportPullingTest, ReportWashing];

    const colorQuery = search ? { color: { $regex: search, $options: "i" } } : {};
    const findPromises = models.map((model) =>
      model.find(colorQuery, { color: 1 }).limit(20).lean()
    );
    const results = await Promise.all(findPromises);

    const allColors = new Set();
    results.forEach((reports) => {
      reports.flatMap((r) => r.color || []).forEach((c) => allColors.add(c));
    });
    const uniqueColors = Array.from(allColors);
    const filteredColors = search
      ? uniqueColors.filter((c) => c.toLowerCase().includes(search.toLowerCase()))
      : uniqueColors;
    const suggestions = filteredColors.slice(0, 10);

    res.status(200).json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error("Error fetching unique colors:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch colors",
      error: error.message
    });
  }
};

// Get colors already used for a specific style to prevent duplicates
export const getUsedColors = async (req, res) => {
  try {
    const { ymStyle } = req.query;

    if (!ymStyle) {
      return res.status(400).json({
        success: false,
        message: "YM Style is required"
      });
    }

    const models = [
      ReportHomeWash,
      ReportGarmentWash,
      ReportHTTesting,
      ReportEMBPrinting,
      ReportPullingTest,
      ReportWashing,
    ];

    const query = { ymStyle: ymStyle.trim(), status: { $ne: "rejected" } };
    const findPromises = models.map((model) =>
      model.find(query, { color: 1 }).limit(500).lean()
    );
    const results = await Promise.all(findPromises);

    const usedColorsSet = new Set();
    results.forEach((reports) => {
      reports.forEach((report) => {
        if (Array.isArray(report.color)) {
          report.color.forEach((c) => usedColorsSet.add(c));
        } else if (report.color) {
          usedColorsSet.add(report.color);
        }
      });
    });

    res.status(200).json({
      success: true,
      usedColors: Array.from(usedColorsSet)
    });
  } catch (error) {
    console.error("Error fetching used colors:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch used colors",
      error: error.message
    });
  }
};



// GET /api/report-washing/washing-roles
export const getWashingRoles = async (req, res) => {
  try {
    const rolesToFetch = [
      "Admin",
      "Super Admin",
      "Reporter",
      "User Warehouse",
      "CheckedBy",
      "PreparedBy",
      "ApprovedBy",
      "Washing Testing",
    ];

    const results = await RoleManagment.find({
      role: { $in: rolesToFetch },
    });

    res.json(results);
  } catch (error) {
    console.error("Error fetching washing roles:", error);
    res.status(500).json({ message: "Failed to fetch washing roles" });
  }
};

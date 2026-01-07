import { ReportWashing } from "../MongoDB/dbConnectionController.js";
import { API_BASE_URL, io } from "../../Config/appConfig.js";
import { washingMachineTestUploadPath } from "../../helpers/helperFunctions.js";
import { __backendDir } from "../../Config/appConfig.js";
import sharp from "sharp";
import path from "path";
import fs from "fs";

/* ------------------------------
   End Points - Report Washing
------------------------------ */

// Save Report Washing data
export const saveReportWashing = async (req, res) => {
  try {
    const {
      ymStyle,
      buyerStyle,
      color,
      po,
      exFtyDate,
      factory,
      reportDate,
      sendToHomeWashingDate,
      notes,
      userId,
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
    if (req.files && req.files.length > 0) {
      // Ensure directory exists
      if (!fs.existsSync(washingMachineTestUploadPath)) {
        fs.mkdirSync(washingMachineTestUploadPath, { recursive: true });
      }

      for (const file of req.files) {
        try {
          // Generate unique filename
          const timestamp = Date.now();
          const randomSuffix = Math.round(Math.random() * 1e9);
          const sanitizedYmStyle = (ymStyle || "unknown")
            .replace(/[\/\\]/g, "-")
            .replace(/\s+/g, "-")
            .replace(/[^a-zA-Z0-9._-]/g, "");
          const extension = path.extname(file.originalname) || ".webp";
          const filename = `washing-test-${sanitizedYmStyle}-${timestamp}-${randomSuffix}.webp`;

          const finalDiskPath = path.join(washingMachineTestUploadPath, filename);

          // Process and save image using sharp
          await sharp(file.buffer)
            .resize({
              width: 1920,
              height: 1920,
              fit: "inside",
              withoutEnlargement: true
            })
            .webp({ quality: 85 })
            .toFile(finalDiskPath);

          // Store the public URL path
          const publicUrlPath = `${API_BASE_URL}/storage/washing_machine_test/${filename}`;
          imagePaths.push(publicUrlPath);
        } catch (imageError) {
          console.error("Error processing image:", imageError);
          // Continue with other images even if one fails
        }
      }
    }

    // Parse JSON fields if they are strings
    const parsedColor = typeof color === "string" ? JSON.parse(color) : color;
    const parsedPO = typeof po === "string" ? JSON.parse(po) : po;
    const parsedExFtyDate = typeof exFtyDate === "string" ? JSON.parse(exFtyDate) : exFtyDate;

    // Prepare data
    const reportData = {
      ymStyle: ymStyle.trim(),
      buyerStyle: buyerStyle ? buyerStyle.trim() : "",
      color: Array.isArray(parsedColor) ? parsedColor : [parsedColor],
      po: Array.isArray(parsedPO) ? parsedPO : [parsedPO],
      exFtyDate: Array.isArray(parsedExFtyDate) ? parsedExFtyDate : [parsedExFtyDate],
      factory: factory ? factory.trim() : "",
      // reportDate is optional - will be set when user scans QR code in completed reports
      reportDate: reportDate ? new Date(reportDate) : null,
      sendToHomeWashingDate: sendToHomeWashingDate ? new Date(sendToHomeWashingDate) : new Date(),
      images: imagePaths, // Store file paths instead of base64
      notes: notes ? notes.trim() : "", // Notes field
      userId: userId || "",
      userName: userName || "",
      submittedAt: new Date()
    };

    // Create and save the report
    const reportWashing = new ReportWashing(reportData);
    const savedData = await reportWashing.save();

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
    const { ymStyle, factory, startDate, endDate, limit = 100 } = req.query;

    let query = {};

    if (ymStyle) {
      query.ymStyle = { $regex: ymStyle, $options: "i" };
    }

    if (factory) {
      query.factory = { $regex: factory, $options: "i" };
    }

    if (startDate || endDate) {
      query.reportDate = {};
      if (startDate) {
        query.reportDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.reportDate.$lte = new Date(endDate);
      }
    }

    const reports = await ReportWashing.find(query)
      .sort({ reportDate: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    res.status(200).json({
      success: true,
      data: reports,
      count: reports.length
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

    const report = await ReportWashing.findById(id).lean();

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report Washing not found"
      });
    }

    res.status(200).json({
      success: true,
      data: report
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

// Update Report Washing by ID
export const updateReportWashing = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

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

    const existingReport = await ReportWashing.findById(id);
    const ymStyle = existingReport?.ymStyle || "unknown";

    // Handle initial images if uploaded
    if (req.files && req.files.images && req.files.images.length > 0) {
      const imagePaths = [];

      for (const file of req.files.images) {
        try {
          // Generate unique filename
          const timestamp = Date.now();
          const randomSuffix = Math.round(Math.random() * 1e9);
          const sanitizedYmStyle = (ymStyle || "unknown")
            .replace(/[\/\\]/g, "-")
            .replace(/\s+/g, "-")
            .replace(/[^a-zA-Z0-9._-]/g, "");
          const extension = path.extname(file.originalname) || ".webp";
          const filename = `washing-test-${sanitizedYmStyle}-${timestamp}-${randomSuffix}.webp`;

          const finalDiskPath = path.join(washingMachineTestUploadPath, filename);

          // Process and save image using sharp
          await sharp(file.buffer)
            .resize({
              width: 1920,
              height: 1920,
              fit: "inside",
              withoutEnlargement: true
            })
            .webp({ quality: 85 })
            .toFile(finalDiskPath);

          // Store the public URL path
          const publicUrlPath = `${API_BASE_URL}/storage/washing_machine_test/${filename}`;
          imagePaths.push(publicUrlPath);
        } catch (imageError) {
          console.error("Error processing initial image:", imageError);
          // Continue with other images even if one fails
        }
      }

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
      const receivedImagePaths = [];

      for (const file of req.files.receivedImages) {
        try {
          // Generate unique filename
          const timestamp = Date.now();
          const randomSuffix = Math.round(Math.random() * 1e9);
          const sanitizedYmStyle = (ymStyle || "unknown")
            .replace(/[\/\\]/g, "-")
            .replace(/\s+/g, "-")
            .replace(/[^a-zA-Z0-9._-]/g, "");
          const extension = path.extname(file.originalname) || ".webp";
          const filename = `received-${sanitizedYmStyle}-${timestamp}-${randomSuffix}.webp`;

          const finalDiskPath = path.join(washingMachineTestUploadPath, filename);

          // Process and save image using sharp
          await sharp(file.buffer)
            .resize({
              width: 1920,
              height: 1920,
              fit: "inside",
              withoutEnlargement: true
            })
            .webp({ quality: 85 })
            .toFile(finalDiskPath);

          // Store the public URL path
          const publicUrlPath = `${API_BASE_URL}/storage/washing_machine_test/${filename}`;
          receivedImagePaths.push(publicUrlPath);
        } catch (imageError) {
          console.error("Error processing received image:", imageError);
          // Continue with other images even if one fails
        }
      }

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

    // Handle completion images if uploaded
    if (req.files && req.files.completionImages && req.files.completionImages.length > 0) {
      const completionImagePaths = [];

      for (const file of req.files.completionImages) {
        try {
          // Generate unique filename
          const timestamp = Date.now();
          const randomSuffix = Math.round(Math.random() * 1e9);
          const sanitizedYmStyle = (ymStyle || "unknown")
            .replace(/[\/\\]/g, "-")
            .replace(/\s+/g, "-")
            .replace(/[^a-zA-Z0-9._-]/g, "");
          const extension = path.extname(file.originalname) || ".webp";
          const filename = `completion-${sanitizedYmStyle}-${timestamp}-${randomSuffix}.webp`;

          const finalDiskPath = path.join(washingMachineTestUploadPath, filename);

          // Process and save image using sharp
          await sharp(file.buffer)
            .resize({
              width: 1920,
              height: 1920,
              fit: "inside",
              withoutEnlargement: true
            })
            .webp({ quality: 85 })
            .toFile(finalDiskPath);

          // Store the public URL path
          const publicUrlPath = `${API_BASE_URL}/storage/washing_machine_test/${filename}`;
          completionImagePaths.push(publicUrlPath);
        } catch (imageError) {
          console.error("Error processing completion image:", imageError);
          // Continue with other images even if one fails
        }
      }

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

    // Find and update the report
    const updatedReport = await ReportWashing.findByIdAndUpdate(
      id,
      { $set: updateData },
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

    const deletedReport = await ReportWashing.findByIdAndDelete(id);

    if (!deletedReport) {
      return res.status(404).json({
        success: false,
        message: "Report Washing not found"
      });
    }

    // Emit socket event for real-time updates
    io.emit("washing-report-deleted", id);

    res.status(200).json({
      success: true,
      message: "Report Washing deleted successfully",
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
    let contentType = "image/webp";
    if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
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


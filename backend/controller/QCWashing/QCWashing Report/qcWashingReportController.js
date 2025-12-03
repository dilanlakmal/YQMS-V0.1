import {
  QCWashing,
  QCWashingCheckList
  // ymProdConnection,
  // AQLChart,
  // QCWashingFirstOutput,
} from "../../MongoDB/dbConnectionController.js";
// import { getBuyerFromMoNumber, getAqlLevelForBuyer} from "../../helpers/helperFunctions.js";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import fs from "fs";
import { Buffer } from "buffer";
import axios from "axios";
import https from "https";
// import {
//   // __backendDir,
//   // __dirname
// } from "../../Config/appConfig.js";
import mongoose from "mongoose";
// import path from "path";
import sharp from "sharp";

// Endpoint to fetch all submitted QC washing data
export const getAllQCWashingSubmittedData = async (req, res) => {
  try {
    const submittedData = await QCWashing.find({
      status: { $in: ["submitted", "processing", "auto-saved"] }
    })
      .select(
        "date orderNo before_after_wash checkedQty washQty totalCheckedPoint totalPass totalFail passRate totalCheckedPcs rejectedDefectPcs totalDefectCount defectRate defectRatio overallFinalResult orderQty colorOrderQty color washType reportType buyer factoryName aql inspectionDetails defectDetails measurementDetails isAutoSave userId status createdAt updatedAt submittedAt inspector actualWashQty actualAQLValue editedActualWashQty lastEditedAt"
      )
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: submittedData,
      count: submittedData.length
    });
  } catch (error) {
    console.error("Error fetching submitted QC washing data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch submitted data",
      error: error.message
    });
  }
};

export const getQCWashingImageProxy = async (req, res) => {
  const imageUrl = decodeURIComponent(req.params.imageUrl);
  try {
    const httpsAgent = new https.Agent({ rejectUnauthorized: false });

    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 10000,
      httpsAgent,
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Cache-Control": "no-cache"
      }
    });

    // Use sharp to process and validate the image buffer.
    // This fixes corruption issues like the missing SOI marker.
    const imageBuffer = Buffer.from(response.data);

    // Re-process the image to ensure it's a valid JPEG.
    const processedBuffer = await sharp(imageBuffer)
      .jpeg({ quality: 85 }) // Convert to JPEG for consistency in PDF
      .toBuffer();

    const base64 = processedBuffer.toString("base64");
    const dataUrl = `data:image/jpeg;base64,${base64}`;

    // Return base64 data directly for PDF rendering
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store"); // Prevent caching of the JSON response
    res.json({ dataUrl });
  } catch (error) {
    console.error(`❌ Image proxy error for URL: ${imageUrl}`, {
      message: error.message,
      isAxiosError: error.isAxiosError,
      responseStatus: error.response?.status,
      code: error.code
    });
    res
      .status(404)
      .json({
        error: "Image not found or failed to process",
        details: error.message
      });
  }
};
export const getQCWashingImgeSelected = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await QCWashing.findById(id);
    if (!record) return res.status(404).json({ error: "Record not found" });

    const API_BASE = process.env.API_BASE_URL || "https://192.167.12.85:5000";
    const collectedUrls = new Set();

    // Small helper to clean URLs
    const cleanUrl = (url) => {
      if (!url || typeof url !== "string") return null;
      let u = url.trim();
      u = u.replace(/^\/+/, "").replace(/^https?:\/+https?:\/+/, "https://");
      if (!u.startsWith("http")) u = `${API_BASE}/${u}`;
      try {
        new URL(u);
        return u;
      } catch {
        console.warn("❌ Skipped invalid URL:", url);
        return null;
      }
    };

    // Collect only valid URLs
    const add = (img) => {
      const url =
        typeof img === "string"
          ? img
          : img?.url || img?.src || img?.originalUrl;
      const valid = cleanUrl(url);
      if (valid) collectedUrls.add(valid);
    };

    // Extract images from record safely
    record.defectDetails?.defectsByPc?.forEach((pc) =>
      pc.pcDefects?.forEach((d) => d.defectImages?.forEach(add))
    );
    record.defectDetails?.additionalImages?.forEach(add);
    record.inspectionDetails?.checkpointInspectionData?.forEach((cp) => {
      cp.comparisonImages?.forEach(add);
      cp.subPoints?.forEach((sp) => sp.comparisonImages?.forEach(add));
    });

    if (collectedUrls.size === 0) {
      return res.json({ images: {}, total: 0, loaded: 0 });
    }

    // Fetch safely in parallel
    const httpsAgent = new https.Agent({ rejectUnauthorized: false });
    const preloaded = {};
    const results = await Promise.allSettled(
      Array.from(collectedUrls).map(async (url) => {
        const resp = await axios.get(url, {
          responseType: "arraybuffer",
          timeout: 10000,
          httpsAgent,
          headers: { "User-Agent": "Mozilla/5.0" }
        });
        const contentType = resp.headers["content-type"] || "image/jpeg";
        const base64 = `data:${contentType};base64,${Buffer.from(
          resp.data
        ).toString("base64")}`;
        preloaded[url] = base64;
      })
    );

    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed > 0) console.warn(`⚠️ ${failed} images failed to load`);

    res.json({
      recordId: id,
      total: collectedUrls.size,
      loaded: Object.keys(preloaded).length,
      images: preloaded
    });
  } catch (err) {
    console.error("❌ image-proxy-selected crashed:", err.message);
    res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
};
// QC Washing filter options endpoint
export const getqcwashingresultFilter = async (req, res) => {
  try {
    const [buyerOptions, moOptions, colorOptions, qcOptions] =
      await Promise.all([
        QCWashing.distinct("buyer"),
        QCWashing.distinct("orderNo"),
        QCWashing.distinct("color"),
        QCWashing.distinct("userId")
      ]);

    res.json({
      buyerOptions: buyerOptions.filter(Boolean).sort(),
      moOptions: moOptions.filter(Boolean).sort(),
      colorOptions: colorOptions.filter(Boolean).sort(),
      qcOptions: qcOptions.filter(Boolean).sort()
    });
  } catch (error) {
    console.error("Error fetching QC Washing filter options:", error);
    res.status(500).json({ error: "Failed to fetch filter options" });
  }
};
// QC Washing results endpoint
export const getqcwashingResult = async (req, res) => {
  try {
    const { startDate, endDate, buyer, moNo, color, qcID } = req.query;

    let matchQuery = {};

    // Date filtering
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate)
        matchQuery.createdAt.$lte = new Date(endDate + "T23:59:59.999Z");
    }

    // Other filters
    if (buyer) matchQuery.buyer = { $regex: new RegExp(buyer, "i") };
    if (moNo) matchQuery.orderNo = { $regex: new RegExp(moNo, "i") };
    if (color) matchQuery.color = { $regex: new RegExp(color, "i") };
    if (qcID) matchQuery.userId = qcID;

    const results = await QCWashing.find(matchQuery)
      .sort({ createdAt: -1 })
      .limit(1000); // Limit to prevent performance issues

    res.json(results);
  } catch (error) {
    console.error("Error fetching QC Washing results:", error);
    res.status(500).json({ error: "Failed to fetch QC Washing results" });
  }
};

// Light QC Washing PDF Generator
export const getqcwashingPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const [record, checkpointDefinitions] = await Promise.all([
      QCWashing.findById(id),
      QCWashingCheckList.find({})
    ]);

    if (!record) return res.status(404).json({ error: "Record not found" });

    const { QcWashingFullReportPDF } = await import(
      "../src/components/inspection/qc2_washing/Home/qcWashingFullReportPDF.jsx"
    );
    const pdfBuffer = await renderToBuffer(
      React.createElement(QcWashingFullReportPDF, {
        recordData: record,
        checkpointDefinitions,
        preloadedImages: {}, // no need to load images
        skipImageLoading: true
      })
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="QC_Washing_Report_${record.orderNo}_${record.color}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF generation failed:", error);
    res
      .status(500)
      .json({ error: "Failed to generate PDF", details: error.message });
  }
};
// Add this route to your QC Washing routes file
export const updateQCWashingQtySub = async (req, res) => {
  try {
    const { id } = req.params;
    const { editedWashQty } = req.body;

    // Validate the ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid record ID"
      });
    }

    // Validate the editedWashQty
    if (editedWashQty === undefined || editedWashQty === null) {
      return res.status(400).json({
        success: false,
        message: "Edited wash quantity is required"
      });
    }

    const parsedEditedWashQty = parseInt(editedWashQty);
    if (isNaN(parsedEditedWashQty) || parsedEditedWashQty < 0) {
      return res.status(400).json({
        success: false,
        message: "Edited wash quantity must be a valid non-negative number"
      });
    }

    // Update the record with the new edited wash quantity
    const updatedRecord = await QCWashing.findByIdAndUpdate(
      id,
      {
        $set: {
          editedActualWashQty: parsedEditedWashQty,
          lastEditedAt: new Date()
          // Optionally add who edited it if you have user context
          // editedBy: req.user?.id || req.body.editedBy
        }
      },
      {
        new: true, // Return the updated document
        runValidators: true // Run schema validators
      }
    );

    if (!updatedRecord) {
      return res.status(404).json({
        success: false,
        message: "QC Washing record not found"
      });
    }

    res.json({
      success: true,
      data: updatedRecord,
      message: "Edited wash quantity updated successfully"
    });
  } catch (error) {
    console.error("Error updating edited wash qty:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// Add this route to your server for individual image proxy
export const getIndividualImageProxy = async (req, res) => {
  try {
    const imageUrl = decodeURIComponent(req.params.encodedUrl);

    // Set CORS headers
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, Cache-Control, Mode"
    );

    // Handle local file requests
    if (
      imageUrl.startsWith("/storage/") ||
      imageUrl.startsWith("/public/") ||
      imageUrl.startsWith("/uploads/")
    ) {
      let filePath;

      if (imageUrl.startsWith("/storage/")) {
        filePath = path.join(__backendDir, "public", imageUrl);
      } else if (imageUrl.startsWith("/public/")) {
        filePath = path.join(
          __backendDir,
          "public",
          imageUrl.replace("/public/", "")
        );
      } else if (imageUrl.startsWith("/uploads/")) {
        filePath = path.join(__backendDir, "public", imageUrl);
      } else {
        filePath = path.join(__backendDir, "public", imageUrl);
      }

      console.log("Looking for individual file at:", filePath);

      if (fs.existsSync(filePath)) {
        const fileBuffer = fs.readFileSync(filePath);
        const ext = path.extname(filePath).toLowerCase();

        let mimeType = "image/jpeg";
        if (ext === ".png") mimeType = "image/png";
        else if (ext === ".gif") mimeType = "image/gif";
        else if (ext === ".webp") mimeType = "image/webp";

        const base64 = fileBuffer.toString("base64");
        const dataUrl = `data:${mimeType};base64,${base64}`;

        res.json({
          success: true,
          dataUrl: dataUrl,
          mimeType: mimeType,
          fileSize: fileBuffer.length
        });
      } else {
        console.log("Individual file not found:", filePath);
        res.status(404).json({
          success: false,
          error: "File not found",
          path: filePath
        });
      }
    } else {
      // Handle external URLs
      const fetch = (await import("node-fetch")).default;
      const response = await fetch(imageUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        },
        timeout: 15000
      });

      if (response.ok) {
        const buffer = await response.buffer();
        const contentType =
          response.headers.get("content-type") || "image/jpeg";
        const base64 = buffer.toString("base64");
        const dataUrl = `data:${contentType};base64,${base64}`;

        res.json({
          success: true,
          dataUrl: dataUrl,
          mimeType: contentType,
          fileSize: buffer.length
        });
      } else {
        res.status(response.status).json({
          success: false,
          error: `Failed to fetch image: ${response.statusText}`,
          status: response.status
        });
      }
    }
  } catch (error) {
    console.error("Individual image proxy error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};

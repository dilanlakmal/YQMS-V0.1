import {
QCWashing, 
QCWashingCheckList,
ymProdConnection,
AQLChart,
QCWashingFirstOutput,              
} from "../MongoDB/dbConnectionController.js";
import { getBuyerFromMoNumber, getAqlLevelForBuyer} from "../../Helpers/helperFunctions.js";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import fs from "fs";
import { Buffer } from "buffer";
import axios from "axios";
import https from 'https';
import { 
  __backendDir, 
  // __dirname 
} from "../../Config/appConfig.js";
import  mongoose  from "mongoose";
import path from "path";
import sharp from "sharp";

// Fallback for missing images
export const getQCWashingDefaltImagePlaceholder = (req, res) => {
  const transparentPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==', 'base64');
  res.set('Content-Type', 'image/png');
  res.set('Cache-Control', 'public, max-age=3600');
  res.send(transparentPng);
};

export const getQCWashingImageProxy = async (req, res) => {
  const imageUrl = decodeURIComponent(req.params.imageUrl);
  try {
    const httpsAgent = new https.Agent({ rejectUnauthorized: false });
    
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 10000,
      httpsAgent,
      headers: { 
        'User-Agent': 'Mozilla/5.0',
        'Cache-Control': 'no-cache'
      }
    });
    
    // Use sharp to process and validate the image buffer.
    // This fixes corruption issues like the missing SOI marker.
    const imageBuffer = Buffer.from(response.data);

    // Re-process the image to ensure it's a valid JPEG.
    const processedBuffer = await sharp(imageBuffer)
      .jpeg({ quality: 85 }) // Convert to JPEG for consistency in PDF
      .toBuffer();

    const base64 = processedBuffer.toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64}`;
    
    // Return base64 data directly for PDF rendering
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store'); // Prevent caching of the JSON response
    res.json({ dataUrl });

  } catch (error) {
    console.error(`❌ Image proxy error for URL: ${imageUrl}`, {
      message: error.message,
      isAxiosError: error.isAxiosError,
      responseStatus: error.response?.status,
      code: error.code,
    });
    res.status(404).json({ error: 'Image not found or failed to process', details: error.message });
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
      const url = typeof img === "string" ? img : img?.url || img?.src || img?.originalUrl;
      const valid = cleanUrl(url);
      if (valid) collectedUrls.add(valid);
    };

    // Extract images from record safely
    record.defectDetails?.defectsByPc?.forEach(pc =>
      pc.pcDefects?.forEach(d => d.defectImages?.forEach(add))
    );
    record.defectDetails?.additionalImages?.forEach(add);
    record.inspectionDetails?.checkpointInspectionData?.forEach(cp => {
      cp.comparisonImages?.forEach(add);
      cp.subPoints?.forEach(sp => sp.comparisonImages?.forEach(add));
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
          headers: { "User-Agent": "Mozilla/5.0" },
        });
        const contentType = resp.headers["content-type"] || "image/jpeg";
        const base64 = `data:${contentType};base64,${Buffer.from(resp.data).toString("base64")}`;
        preloaded[url] = base64;
      })
    );

    const failed = results.filter(r => r.status === "rejected").length;
    if (failed > 0) console.warn(`⚠️ ${failed} images failed to load`);

    res.json({
      recordId: id,
      total: collectedUrls.size,
      loaded: Object.keys(preloaded).length,
      images: preloaded
    });
  } catch (err) {
    console.error("❌ image-proxy-selected crashed:", err.message);
    res.status(500).json({ error: "Internal server error", details: err.message });
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

    const { QcWashingFullReportPDF } = await import("../src/components/inspection/qc2_washing/Home/qcWashingFullReportPDF.jsx");
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
    res.status(500).json({ error: "Failed to generate PDF", details: error.message });
  }
};

// QC Washing results endpoint
export const getqcwashingResult = async (req, res) => {
  try {
      const {
        startDate,
        endDate,
        buyer,
        moNo,
        color,
        qcID
      } = req.query;
  
      let matchQuery = {};
  
      // Date filtering
      if (startDate || endDate) {
        matchQuery.createdAt = {};
        if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
        if (endDate) matchQuery.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
      }
  
      // Other filters
      if (buyer) matchQuery.buyer = { $regex: new RegExp(buyer, 'i') };
      if (moNo) matchQuery.orderNo = { $regex: new RegExp(moNo, 'i') };
      if (color) matchQuery.color = { $regex: new RegExp(color, 'i') };
      if (qcID) matchQuery.userId = qcID;
  
      const results = await QCWashing.find(matchQuery)
        .sort({ createdAt: -1 })
        .limit(1000); // Limit to prevent performance issues
  
      res.json(results);
    } catch (error) {
      console.error('Error fetching QC Washing results:', error);
      res.status(500).json({ error: 'Failed to fetch QC Washing results' });
    }
};

// QC Washing filter options endpoint
export const getqcwashingresultFilter = async (req, res) => {
  try {
      const [buyerOptions, moOptions, colorOptions, qcOptions] = await Promise.all([
        QCWashing.distinct('buyer'),
        QCWashing.distinct('orderNo'),
        QCWashing.distinct('color'),
        QCWashing.distinct('userId')
      ]);
  
      res.json({
        buyerOptions: buyerOptions.filter(Boolean).sort(),
        moOptions: moOptions.filter(Boolean).sort(),
        colorOptions: colorOptions.filter(Boolean).sort(),
        qcOptions: qcOptions.filter(Boolean).sort()
      });
    } catch (error) {
      console.error('Error fetching QC Washing filter options:', error);
      res.status(500).json({ error: 'Failed to fetch filter options' });
    }
};

// Get order details by style number
export const getqcwashingOrderbysize = async (req, res) => {
  const { orderNo } = req.params;
    const collection = ymProdConnection.db.collection("dt_orders");
  
    try {
      const orders = await collection.find({ Order_No: orderNo }).toArray();
  
      if (!orders || orders.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: `Style '${orderNo}' not found.` });
      }
  
      // Extract all available colors from OrderColors array
      const colorSet = new Set();
      orders.forEach((order) => {
        if (order.OrderColors && Array.isArray(order.OrderColors)) {
          order.OrderColors.forEach((colorObj) => {
            if (colorObj && colorObj.Color) {
              colorSet.add(colorObj.Color);
            }
          });
        }
      });
      const availableColors = Array.from(colorSet);
  
      const orderQty = orders.reduce(
        (sum, order) => sum + (order.TotalQty || 0),
        0
      );
      const buyerName = getBuyerFromMoNumber(orderNo);
  
      res.json({
        success: true,
        colors: availableColors,
        orderQty,
        buyer: buyerName
      });
    } catch (error) {
      console.error(`Error fetching order details for style ${orderNo}:`, error);
      res.status(500).json({
        success: false,
        message: "Server error while fetching order details."
      });
    }
};

// GET - Get total order qty for a specific orderNo and color
export const getqcwashingOrderColorQty = async (req, res) => {
  const { orderNo, color } = req.params;
  const collection = ymProdConnection.db.collection("dt_orders");
  try {
    const orders = await collection.find({ Order_No: orderNo }).toArray();
    if (!orders || orders.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: `Order '${orderNo}' not found.` });
    }
    let totalQty = 0;
    orders.forEach((order) => {
      if (order.OrderColors && Array.isArray(order.OrderColors)) {
        const colorObj = order.OrderColors.find(
          (c) => c.Color.toLowerCase() === color.toLowerCase()
        );
        if (colorObj && Array.isArray(colorObj.OrderQty)) {
          colorObj.OrderQty.forEach((sizeObj) => {
            // Each sizeObj is like { "XS": 32 }
            Object.values(sizeObj).forEach((qty) => {
              if (typeof qty === "number" && qty > 0) totalQty += qty;
            });
          });
        }
      }
    });
    res.json({ success: true, orderNo, color, colorOrderQty: totalQty });
  } catch (error) {
    console.error(
      `Error fetching color order qty for ${orderNo} / ${color}:`,
      error
    );
    res.status(500).json({
      success: false,
      message: "Server error while fetching color order qty."
    });
  }
};

// Get sizes for a specific order and color
export const getqcwashingOrderSizes = async (req, res) => {
  const { orderNo, color } = req.params;
  const collection = ymProdConnection.db.collection("dt_orders");

  try {
    const orders = await collection.find({ Order_No: orderNo }).toArray();

    if (!orders || orders.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: `Order '${orderNo}' not found.` });
    }

    const sizes = new Set();
    orders.forEach((order) => {
      if (order.OrderColors && Array.isArray(order.OrderColors)) {
        const matchingColor = order.OrderColors.find(
          (c) => c.Color.toLowerCase() === color.toLowerCase()
        );

        if (matchingColor && matchingColor.OrderQty) {
          matchingColor.OrderQty.forEach((entry) => {
            const sizeName = Object.keys(entry)[0];
            const quantity = entry[sizeName];
            if (quantity > 0) {
              const cleanSize = sizeName.split(";")[0].trim();
              sizes.add(cleanSize);
            }
          });
        }
      }
    });

    const sizesArray = Array.from(sizes);
    res.json({ success: true, sizes: sizesArray });
  } catch (error) {
    console.error(
      `Error fetching sizes for order ${orderNo} and color ${color}:`,
      error
    );
    res
      .status(500)
      .json({ success: false, message: "Server error while fetching sizes." });
  }
};

export const getmeasurmentSpec = async (req, res) => {
  const { orderNo, color } = req.params;
    const collection = ymProdConnection.db.collection("dt_orders");
    const buyerSpecCollection = ymProdConnection.db.collection("buyerspectemplates");

    try {
      const orders = await collection.find({ Order_No: orderNo }).toArray();

      if (!orders || orders.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: `Order '${orderNo}' not found.` });
      }

      const order = orders[0];

      // Extract measurement specifications from different possible locations
      let measurementSpecs = [];
      
      // Check various possible locations for measurement data

      // Check various possible locations for measurement data
      if (order.MeasurementSpecs && Array.isArray(order.MeasurementSpecs)) {
        measurementSpecs = order.MeasurementSpecs;
      } else if (order.Specs && Array.isArray(order.Specs)) {
        measurementSpecs = order.Specs;
      } else if (order.OrderColors) {
        const colorObj = order.OrderColors.find(
          (c) => c.Color.toLowerCase() === color.toLowerCase()
        );
        if (colorObj && colorObj.MeasurementSpecs) {
          measurementSpecs = colorObj.MeasurementSpecs;
        } else if (colorObj && colorObj.Specs) {
          measurementSpecs = colorObj.Specs;
        }
      }

      const beforeWashSpecs = [];
      const afterWashSpecs = [];
      const beforeWashByK = {};
      const afterWashByK = {};

      // Process BeforeWashSpecs and AfterWashSpecs arrays
      if (order.BeforeWashSpecs && Array.isArray(order.BeforeWashSpecs)) {
        order.BeforeWashSpecs.forEach((spec) => {
          if (
            spec.MeasurementPointEngName &&
            spec.Specs &&
            Array.isArray(spec.Specs)
          ) {
            const kValue = spec.kValue || "NA";
            const pointName = spec.MeasurementPointEngName;
            if (!beforeWashByK[kValue]) {
              beforeWashByK[kValue] = new Map();
            }
            if (!beforeWashByK[kValue].has(pointName)) {
              beforeWashByK[kValue].set(pointName, {
                MeasurementPointEngName: pointName,
                Specs: spec.Specs,
                ToleranceMinus: spec.TolMinus,
                TolerancePlus: spec.TolPlus,
                kValue: kValue
              });
            }
          }
        });
      }

      if (order.AfterWashSpecs && Array.isArray(order.AfterWashSpecs)) {
        order.AfterWashSpecs.forEach((spec) => {
          if (
            spec.MeasurementPointEngName &&
            spec.Specs &&
            Array.isArray(spec.Specs)
          ) {
            const kValue = spec.kValue || "NA";
            const pointName = spec.MeasurementPointEngName;
            if (!afterWashByK[kValue]) {
              afterWashByK[kValue] = new Map();
            }
            if (!afterWashByK[kValue].has(pointName)) {
              afterWashByK[kValue].set(pointName, {
                MeasurementPointEngName: pointName,
                Specs: spec.Specs,
                ToleranceMinus: spec.TolMinus,
                TolerancePlus: spec.TolPlus,
                kValue: kValue
              });
            }
          }
        });
      }

      // Convert to grouped arrays
      const beforeWashGrouped = {};
      const afterWashGrouped = {};

      Object.keys(beforeWashByK).forEach((kValue) => {
        beforeWashGrouped[kValue] = Array.from(beforeWashByK[kValue].values());
      });

      Object.keys(afterWashByK).forEach((kValue) => {
        afterWashGrouped[kValue] = Array.from(afterWashByK[kValue].values());
      });

      // For backward compatibility, also provide flat arrays
      Object.values(beforeWashGrouped).forEach((group) => {
        beforeWashSpecs.push(...group);
      });

      Object.values(afterWashGrouped).forEach((group) => {
        afterWashSpecs.push(...group);
      });

      // FIXED: Fetch buyerspectemplate data for default measurement points
      let buyerSpecData = null;
      try {
        // Use orderNo directly since moNo in buyerspectemplates corresponds to order number
        buyerSpecData = await buyerSpecCollection.findOne({ 
          moNo: orderNo  // Changed from styleNo to orderNo
        });
        
        // If not found with orderNo, try with Style field as fallback
        if (!buyerSpecData && order.Style) {
          buyerSpecData = await buyerSpecCollection.findOne({ 
            moNo: order.Style 
          });
        }
        
        
      } catch (error) {
        console.log("Error fetching buyerspectemplate for orderNo:", orderNo, error);
      }

      // If no measurement data found, provide default specifications
      if (beforeWashSpecs.length === 0 && afterWashSpecs.length === 0) {
        return res.json({
          success: true,
          beforeWashSpecs: [],
          afterWashSpecs: [],
          beforeWashGrouped: {},
          afterWashGrouped: {},
          buyerSpecData: buyerSpecData, // Include buyer spec data
          isDefault: true,
          message: "No measurement points available for this Mono."
        });
      } else {
        return res.json({
          success: true,
          beforeWashSpecs: beforeWashSpecs,
          afterWashSpecs: afterWashSpecs,
          beforeWashGrouped: beforeWashGrouped,
          afterWashGrouped: afterWashGrouped,
          buyerSpecData: buyerSpecData, // Include buyer spec data
          isDefault: false
        });
      }

    } catch (error) {
      console.error(
        `Error fetching measurement specs for Mono ${orderNo} :`,
        error
      );
      res.status(500).json({
        success: false,
        message: "Server error while fetching measurement specs."
      });
    }
};

// Get order details by order number
  export const getqcWashingOrderbyOrderNo = async (req, res) => {
    try {
        const { orderNo } = req.params;
        const orderData = await QCWashing.findOne({ orderNo: orderNo });
    
        if (orderData) {
          res.json({
            success: true,
            orderNo: orderData.orderNo,
            colors: [orderData.color.orderDetails.color],
            orderQty: orderData.color.orderDetails.orderQty,
            buyer: orderData.color.orderDetails.buyer
          });
        } else {
          res.json({ success: false, message: "Order not found" });
        }
      } catch (error) {
        res
          .status(500)
          .json({ success: false, message: "Failed to fetch order details" });
      }
  };

  // Save size data
  export const qcwashingaveSize = async (req, res) => {
    try {
    const { orderNo, color, sizeData, userId } = req.body;

    // Find existing QC record or create new one
    let qcRecord = await QCWashing.findOne({
      orderNo: orderNo,
      isAutoSave: true,
      userId: userId
    });

    if (!qcRecord) {
      qcRecord = new QCWashing({
        orderNo: orderNo,
        isAutoSave: true,
        userId: userId,
        status: "auto-saved",
        color: {
          orderDetails: { color: color },
          measurementDetails: new Map()
        }
      });
    }

    // Validate measurements against tolerance
    const validateMeasurement = (measurement, specs, tolMinus, tolPlus) => {
      if (!measurement || !specs) return "pass";

      const measValue = parseFloat(measurement);
      const specValue = parseFloat(specs);
      const minTol = parseFloat(tolMinus) || 0;
      const maxTol = parseFloat(tolPlus) || 0;

      const minAllowed = specValue + minTol;
      const maxAllowed = specValue + maxTol;

      return measValue >= minAllowed && measValue <= maxAllowed
        ? "pass"
        : "fail";
    };

    const sizeKey = `size_${sizeData.size}`;
    const measurementData = {
      size: sizeData.size,
      qty: sizeData.qty,
      measurements: sizeData.measurements,
      selectedRows: sizeData.selectedRows,
      fullColumns: sizeData.fullColumns,
      results: {},
      savedAt: new Date()
    };

    // Add validation results
    Object.keys(sizeData.measurements || {}).forEach((cellKey) => {
      const measurement = sizeData.measurements[cellKey];
      measurementData.results[cellKey] = {
        value: measurement.decimal,
        fraction: measurement.fraction,
        result: "pass"
      };
    });

    qcRecord.color.measurementDetails.set(sizeKey, measurementData);
    await qcRecord.save();

    res.json({ success: true, message: "Size data saved successfully" });
  } catch (error) {
    console.error("Save size error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to save size data" });
  }
  };

  // Get saved size
  export const getqcwashingSavedColor = async (req, res) => {
    try {
        const { orderNo, color } = req.params;
        const qcRecord = await QCWashing.findOne({
          orderNo: orderNo,
          colorName: color,
          isAutoSave: true
        });
    
        if (qcRecord && qcRecord.color && qcRecord.color.measurementDetails) {
          const savedSizes = [];
          qcRecord.color.measurementDetails.forEach((value, key) => {
            if (key.startsWith("size_")) {
              savedSizes.push(value.size);
            }
          });
          res.json({ success: true, savedSizes: savedSizes });
        } else {
          res.json({ success: true, savedSizes: [] });
        }
      } catch (error) {
        console.error("Get saved sizes error:", error);
        res
          .status(500)
          .json({ success: false, message: "Failed to get saved sizes" });
      }
  };

  export const saveqcwashing = async (req, res) => {
    try {
        const { orderNo } = req.body;
        if (!orderNo) {
          return res
            .status(400)
            .json({ success: false, message: "orderNo is required" });
        }
        const latestAutoSave = await QCWashing.findOne({
          orderNo,
        }).sort({ updatedAt: -1 });
    
        if (!latestAutoSave) {
          return res.status(404).json({
            success: false,
            message: "No auto-save record found to submit."
          });
        }
    
        latestAutoSave.isAutoSave = false;
        latestAutoSave.status = "submitted";
        latestAutoSave.submittedAt = new Date();
        latestAutoSave.savedAt = new Date();
        await latestAutoSave.save();
    
        res.json({
          success: true,
          submissionId: latestAutoSave._id,
          message: "QC Washing data submitted successfully"
        });
      } catch (error) {
        console.error("Submit error:", error);
        res.status(500).json({
          success: false,
          message: "Failed to submit data",
          error: error.message,
          stack: error.stack
        });
      }
  };

  // Load color-specific data
  export const loadqcwashingColorData = async (req, res) => {
    try {
    const { orderNo, color } = req.params;
    const qcRecord = await QCWashing.findOne({ orderNo: orderNo });

    if (qcRecord && qcRecord.colors) {
      const colorData = qcRecord.colors.find((c) => c.colorName === color);

      if (colorData) {
        // res.json({ success: true, colorData: colorData });
        res.json({
          success: true,
          colorData: {
            ...colorData,
            before_after_wash: qcRecord.before_after_wash,
            washQty: qcRecord.washQty,
            checkedQty: qcRecord.checkedQty,
            totalCheckedPoint: qcRecord.totalCheckedPoint,
            totalPass: qcRecord.totalPass,
            totalFail: qcRecord.totalFail,
            passRate: qcRecord.passRate
          }
        });
      } else {
        res.json({ success: false, message: "Color data not found" });
      }
    } else {
      res.json({ success: false, message: "No saved data found" });
    }
  } catch (error) {
    console.error("Load color data error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to load color data" });
  }
  };

  // Get all saved colors for an order
  export const getqcwashingSavedColors = async (req, res) =>{
    try {
        const { orderNo } = req.params;
        const qcRecord = await QCWashing.findOne({ orderNo: orderNo });
    
        if (qcRecord && qcRecord.colors) {
          const savedColors = qcRecord.colors.map((c) => c.colorName);
          res.json({ success: true, savedColors: savedColors });
        } else {
          res.json({ success: true, savedColors: [] });
        }
      } catch (error) {
        console.error("Get saved colors error:", error);
        res
          .status(500)
          .json({ success: false, message: "Failed to get saved colors" });
      }
  };

  // Get order numbers
  export const getqcwashingOrderNumbers = async (req, res) => {
    try {
        const orders = await QCWashing.distinct("orderNo");
        res.json({ success: true, orderNumbers: orders });
      } catch (error) {
        res
          .status(500)
          .json({ success: false, message: "Failed to fetch order numbers" });
      }
  };

  // Update existing QC Washing record
  export const updateqcwashing = async (req, res) => {
    try {
        const { recordId } = req.params;
        const updateData = req.body;
    
        const updatedRecord = await QCWashing.findByIdAndUpdate(
          recordId,
          updateData,
          { new: true }
        );
    
        if (updatedRecord) {
          res.json({
            success: true,
            id: updatedRecord._id,
            message: "Record updated successfully"
          });
        } else {
          res.status(404).json({ success: false, message: "Record not found" });
        }
      } catch (error) {
        console.error("Error updating record:", error);
        res
          .status(500)
          .json({ success: false, message: "Failed to update record" });
      }
  };

  export const saveqwashingSummary = async (req, res) => {
    try {
        const { recordId } = req.params;
        const summary = req.body.summary || {};
    
        const qcRecord = await QCWashing.findById(recordId);
        if (!qcRecord) {
          return res.status(404).json({ success: false, message: "Record not found." });
        }
    
        // Store the previous result for comparison
        const previousResult = qcRecord.overallFinalResult;
    
        // 1. Calculate measurement statistics from current data
        let totalMeasurementPoints = 0;
        let totalMeasurementPass = 0;
        let totalMeasurementFail = 0;
    
        // Use measurementSizeSummary if available (most accurate)
        if (qcRecord.measurementDetails?.measurementSizeSummary?.length > 0) {
          qcRecord.measurementDetails.measurementSizeSummary.forEach(sizeData => {
            totalMeasurementPoints += (sizeData.checkedPoints || 0);
            totalMeasurementPass += (sizeData.totalPass || 0);
            totalMeasurementFail += (sizeData.totalFail || 0);
          });
        } else if (qcRecord.measurementDetails?.measurement?.length > 0) {
          // Fallback: Calculate from measurement array
          qcRecord.measurementDetails.measurement.forEach((data) => {
            if (data.pcs && Array.isArray(data.pcs)) {
              data.pcs.forEach((pc) => {
                if (pc.measurementPoints && Array.isArray(pc.measurementPoints)) {
                  pc.measurementPoints.forEach((point) => {
                    if (point.result === "pass" || point.result === "fail") {
                      totalMeasurementPoints++;
                      if (point.result === "pass") {
                        totalMeasurementPass++;
                      } else {
                        totalMeasurementFail++;
                      }
                    }
                  });
                }
              });
            }
          });
        }
    
        // 2. Calculate defect statistics from current data
        let totalCheckedPcs = 0;
        let rejectedDefectPcs = 0;
        let totalDefectCount = 0;
    
        // Calculate totalCheckedPcs from measurement data
        if (qcRecord.measurementDetails?.measurement) {
          qcRecord.measurementDetails.measurement.forEach((measurement) => {
            if (typeof measurement.qty === "number" && measurement.qty > 0) {
              totalCheckedPcs += measurement.qty;
            }
          });
        }
        
        // Fallback to checkedQty if no measurement data
        if (totalCheckedPcs === 0) {
          totalCheckedPcs = parseInt(qcRecord.checkedQty, 10) || 0;
        }
    
        // Calculate defects
        const defectDetails = qcRecord.defectDetails || {};
        if (Array.isArray(defectDetails.defectsByPc)) {
          rejectedDefectPcs = defectDetails.defectsByPc.length;
          totalDefectCount = defectDetails.defectsByPc.reduce((sum, pc) =>
            sum + (Array.isArray(pc.pcDefects)
              ? pc.pcDefects.reduce((defSum, defect) =>
                  defSum + (parseInt(defect.defectQty, 10) || 0), 0)
              : 0), 0);
        }
    
        // 3. Calculate pass rate
        const passRate = totalMeasurementPoints > 0 
          ? Math.round((totalMeasurementPass / totalMeasurementPoints) * 100) 
          : 100;
    
        // 4. Determine measurement result based on 95% threshold
        let measurementResult = "Pass";
        if (totalMeasurementPoints > 0) {
          // Use 95% pass rate threshold for measurement result
          measurementResult = passRate >= 95 ? "Pass" : "Fail";
        }
    
        // 5. Determine defect result based on current data and AQL
        let defectResult;
        const aql = qcRecord.aql?.[0];
        
        if (aql && typeof aql.acceptedDefect === "number") {
          // Use AQL logic
          defectResult = totalDefectCount <= aql.acceptedDefect ? "Pass" : "Fail";
        } else {
          // Fallback: use saved defect result or assume Pass if no defects
          defectResult =
            qcRecord.defectDetails?.result ||
            (totalDefectCount === 0 ? "Pass" : "Fail");
        }
    
        // 6. Calculate FRESH overall result
        let newOverallFinalResult;
        const isSOP = qcRecord.reportType === "SOP";
    
        // For SOP, both measurement and defects must pass.
        const isMeasurementPass = passRate >= 95;
        const isDefectPass = totalDefectCount === 0;
    
        if (isSOP) {
          newOverallFinalResult =
            isMeasurementPass && isDefectPass ? "Pass" : "Fail";
        } else {
          // For other report types, use the individual results
          newOverallFinalResult =
            measurementResult === "Pass" && defectResult === "Pass" ? "Pass" : "Fail";
        }
    
        // 7. Update ALL calculated fields with fresh values
        qcRecord.totalCheckedPcs = totalCheckedPcs;
        qcRecord.rejectedDefectPcs = rejectedDefectPcs;
        qcRecord.totalDefectCount = totalDefectCount;
        qcRecord.defectRate = totalCheckedPcs > 0
          ? Number(((totalDefectCount / totalCheckedPcs) * 100).toFixed(1))
          : 0;
        qcRecord.defectRatio = totalCheckedPcs > 0
          ? Number(((rejectedDefectPcs / totalCheckedPcs) * 100).toFixed(1))
          : 0;
        qcRecord.totalCheckedPoint = totalMeasurementPoints;
        qcRecord.totalPass = totalMeasurementPass;
        qcRecord.totalFail = totalMeasurementFail;
        qcRecord.passRate = passRate;
        
        // CRITICAL FIX: Set the new overall result
        qcRecord.overallFinalResult = newOverallFinalResult;
        
        // Mark the field as modified to ensure it gets saved
        qcRecord.markModified('overallFinalResult');
        
        // Save the record
        await qcRecord.save();
    
        // DETAILED RESPONSE FOR DEBUGGING
        res.json({ 
          success: true,
          message: "Overall result recalculated and saved successfully",
          previousResult: previousResult,
          newResult: newOverallFinalResult,
          debugInfo: {
            measurementCalculation: {
              totalPoints: totalMeasurementPoints,
              totalPass: totalMeasurementPass,
              totalFail: totalMeasurementFail,
              passRate: passRate,
              measurementResult: measurementResult,
              logic: qcRecord.reportType === "SOP"
                ? `SOP Logic: (Measurement Pass Rate ${passRate}% >= 95%) AND (Defect Count ${totalDefectCount} === 0)`
                : `Standard Logic: (Measurement Result '${measurementResult}' === 'Pass') AND (Defect Result '${defectResult}' === 'Pass')`
            },
            defectCalculation: {
              totalDefectCount: totalDefectCount,
              aqlAcceptedDefect: aql?.acceptedDefect || "N/A",
              defectResult: defectResult,
              logic: `${totalDefectCount} defects <= ${aql?.acceptedDefect || 0} = ${defectResult}`
            },
            overallCalculation: {
              measurementResult: measurementResult,
              defectResult: defectResult,
              overallResult: newOverallFinalResult,
              logic: `(${measurementResult} AND ${defectResult}) = ${newOverallFinalResult}`
            }
          },
          calculatedValues: {
            totalCheckedPcs,
            rejectedDefectPcs,
            totalDefectCount,
            totalMeasurementPoints,
            totalMeasurementPass,
            totalMeasurementFail,
            passRate,
            measurementResult,
            defectResult,
            overallFinalResult: newOverallFinalResult
          }
        });
    
      } catch (error) {
        console.error("Save summary error:", error);
        res.status(500).json({ success: false, message: "Failed to save summary." });
      }
  };

  // Updated GET endpoint
  export const getqcwashingOverAllSummary = async (req, res) => {
    try {
        const { recordId } = req.params;
    
        const qcRecord = await QCWashing.findById(recordId);
        if (!qcRecord) {
          return res
            .status(404)
            .json({ success: false, message: "No data found for this record." });
        }
    
        // Recalculate overall result to ensure accuracy (but don't save)
        let totalMeasurementPoints = 0;
        let totalMeasurementPass = 0;
        let totalMeasurementFail = 0;
    
        // Use measurementSizeSummary if available
        if (qcRecord.measurementDetails?.measurementSizeSummary?.length > 0) {
          qcRecord.measurementDetails.measurementSizeSummary.forEach((sizeData) => {
            totalMeasurementPoints += sizeData.checkedPoints || 0;
            totalMeasurementPass += sizeData.totalPass || 0;
            totalMeasurementFail += sizeData.totalFail || 0;
          });
        } else if (qcRecord.measurementDetails?.measurement?.length > 0) {
          // Fallback calculation
          qcRecord.measurementDetails.measurement.forEach((data) => {
            if (data.pcs && Array.isArray(data.pcs)) {
              data.pcs.forEach((pc) => {
                if (pc.measurementPoints && Array.isArray(pc.measurementPoints)) {
                  pc.measurementPoints.forEach((point) => {
                    if (point.result === "pass" || point.result === "fail") {
                      totalMeasurementPoints++;
                      if (point.result === "pass") {
                        totalMeasurementPass++;
                      } else {
                        totalMeasurementFail++;
                      }
                    }
                  });
                }
              });
            }
          });
        }
    
        const passRate = totalMeasurementPoints > 0 
          ? Math.round((totalMeasurementPass / totalMeasurementPoints) * 100) 
          : 100;
    
        // Use 95% threshold for measurement result
        const measurementResult = totalMeasurementPoints === 0 
          ? "Pass" 
          : (passRate >= 95 ? "Pass" : "Fail");
    
        const defectResult = qcRecord.defectDetails?.result || "Pass";
        
        const calculatedOverallResult = (measurementResult === "Pass" && defectResult === "Pass") 
          ? "Pass" 
          : "Fail";
    
        res.json({
          success: true,
          summary: {
            recordId,
            orderNo: qcRecord.orderNo,
            color: qcRecord.color,
            totalCheckedPcs: qcRecord.totalCheckedPcs ?? 0,
            checkedQty: qcRecord.checkedQty ?? "",
            washQty: qcRecord.washQty ?? "",
            rejectedDefectPcs: qcRecord.rejectedDefectPcs ?? 0,
            totalDefectCount: qcRecord.totalDefectCount ?? 0,
            defectRate: qcRecord.defectRate ?? 0,
            defectRatio: qcRecord.defectRatio ?? 0,
            passRate: passRate,
            overallResult: calculatedOverallResult,
            overallFinalResult: qcRecord.overallFinalResult, // Use saved value
            
            // Additional debug information
            measurementStats: {
              totalPoints: totalMeasurementPoints,
              totalPass: totalMeasurementPass,
              totalFail: totalMeasurementFail,
              measurementResult: measurementResult,
              passRateThreshold: 95
            },
            defectStats: {
              defectResult: defectResult
            },
            
            // Include the measurement details for frontend calculation
            measurementDetails: qcRecord.measurementDetails,
            defectDetails: qcRecord.defectDetails ?? {}
          }
        });
    
      } catch (error) {
        console.error("Error fetching overall summary by id:", error);
        res.status(500).json({
          success: false,
          message: "Server error while fetching overall summary."
        });
      }
  };

// Updated recalculate endpoint
export const updateqcwashingRecalculater = async (req, res) => {
  try {
      const { recordId } = req.params;
  
      const qcRecord = await QCWashing.findById(recordId);
      if (!qcRecord) {
        return res
          .status(404)
          .json({ success: false, message: "Record not found." });
      }
  
      const previousResult = qcRecord.overallFinalResult;
  
      // Recalculate everything from scratch
      let totalMeasurementPoints = 0;
      let totalMeasurementPass = 0;
      let totalMeasurementFail = 0;
  
      if (qcRecord.measurementDetails?.measurementSizeSummary?.length > 0) {
        qcRecord.measurementDetails.measurementSizeSummary.forEach((sizeData) => {
          totalMeasurementPoints += sizeData.checkedPoints || 0;
          totalMeasurementPass += sizeData.totalPass || 0;
          totalMeasurementFail += sizeData.totalFail || 0;
        });
      }
  
      const passRate = totalMeasurementPoints > 0 
        ? Math.round((totalMeasurementPass / totalMeasurementPoints) * 100) 
        : 100;
  
      // Use 95% threshold for measurement result
      const measurementResult = totalMeasurementPoints === 0 
        ? "Pass" 
        : (passRate >= 95 ? "Pass" : "Fail");
  
      const defectResult = qcRecord.defectDetails?.result || "Pass";
      
      const newOverallResult = (measurementResult === "Pass" && defectResult === "Pass") 
        ? "Pass" 
        : "Fail";
  
      // Update the record
      qcRecord.totalCheckedPoint = totalMeasurementPoints;
      qcRecord.totalPass = totalMeasurementPass;
      qcRecord.totalFail = totalMeasurementFail;
      qcRecord.passRate = passRate;
      qcRecord.overallFinalResult = newOverallResult;
  
      // Mark as modified and save
      qcRecord.markModified('overallFinalResult');
      await qcRecord.save();
  
      res.json({
        success: true,
        message: "Overall result recalculated and saved successfully",
        previousResult: previousResult,
        newResult: newOverallResult,
        result: {
          overallResult: newOverallResult,
          measurementResult,
          defectResult,
          passRate,
          passRateThreshold: 95,
          totalMeasurementPoints,
          
          totalMeasurementPass,
          totalMeasurementFail,
          logic: `${passRate}% >= 95% = ${measurementResult}`
        }
      });
  
    } catch (error) {
      console.error("Error recalculating overall result:", error);
      res.status(500).json({
        success: false,
        message: "Failed to recalculate overall result."
      });
    }
};

export const saveqcwashingAQLbySampleSize = async (req, res) => {
   try {
      const { orderNo } = req.body;
      // const sampleSizeNum = parseInt(sampleSize, 10);
  
      const firstOutputRecord = await QCWashingFirstOutput.findOne()
        .sort({ createdAt: -1 })
        .lean();
      const sampleSizeNum = parseInt(firstOutputRecord.quantity, 10);
  
      if (isNaN(sampleSizeNum) || sampleSizeNum <= 0) {
        return res.status(400).json({
          success: false,
          message: "A valid sample size must be provided."
        });
      }
  
      const buyer = await getBuyerFromMoNumber(orderNo);
      const aqlLevel = getAqlLevelForBuyer(buyer);
  
      const aqlChart = await AQLChart.findOne({
        Type: "General",
        Level: "II",
        SampleSize: { $gte: sampleSizeNum }
      })
        .sort({ SampleSize: 1 })
        .lean();
  
      if (!aqlChart) {
        return res.status(404).json({
          success: false,
          message: `No AQL chart found for a sample size of ${sampleSizeNum} or greater.`
        });
      }
  
      // Find the specific AQL entry for level 1.0 within the document.
      const aqlEntry = aqlChart.AQL.find((aql) => aql.level === aqlLevel);
  
      if (!aqlEntry) {
        return res.status(404).json({
          success: false,
          message: "AQL level  ${aqlLevel} not found for the matching chart."
        });
      }
  
      // Respond with the data in the format expected by the frontend.
      res.json({
        success: true,
        aqlData: {
          sampleSize: aqlChart.SampleSize, // Return the actual sample size from the chart
          acceptedDefect: aqlEntry.AcceptDefect,
          rejectedDefect: aqlEntry.RejectDefect,
          levelUsed: aqlLevel
        }
      });
    } catch (error) {
      console.error("AQL lookup by sample size error:", error);
      res.status(500).json({
        success: false,
        message: "Server error while fetching AQL details by sample size."
      });
    }
};

// AQL data endpoint
export const saveqcWashinAQLData = async (req, res) => {
  try {
    const { lotSize, orderNo } = req.body;

    if (!lotSize || isNaN(lotSize)) {
      return res.status(400).json({
        success: false,
        message: "Lot size (wash Qty) is required and must be a number."
      });
    }
    const lotSizeNum = parseInt(lotSize, 10);

    const buyer = await getBuyerFromMoNumber(orderNo);
    const aqlLevel = getAqlLevelForBuyer(buyer);

    // Find the AQL chart document where the lot size falls within the defined range.
    const aqlChart = await AQLChart.findOne({
      Type: "General",
      Level: "II",
      "LotSize.min": { $lte: lotSizeNum },
      $or: [{ "LotSize.max": { $gte: lotSizeNum } }, { "LotSize.max": null }]
    }).lean();

    if (!aqlChart) {
      return res.status(404).json({
        success: false,
        message: "No AQL chart found for the given lot size."
      });
    }

    // Find the specific AQL entry for level  within the document.
    const aqlEntry = aqlChart.AQL.find((aql) => aql.level === aqlLevel);

    if (!aqlEntry) {
      return res.status(404).json({
        success: false,
        message: "AQL level  ${aqlLevel} not found for the matching chart."
      });
    }

    res.json({
      success: true,
      aqlData: {
        sampleSize: aqlChart.SampleSize,
        acceptedDefect: aqlEntry.AcceptDefect,
        rejectedDefect: aqlEntry.RejectDefect,
        levelUsed: aqlLevel
      }
    });
  } catch (error) {
    console.error("AQL calculation error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching AQL details."
    });
  }
};

export const saveqcwashingFirstOutput = async (req, res) => {
  try {
      const { orderNo } = req.body;
  
      if (!orderNo) {
        return res.status(400).json({
          success: false,
          message: "Order No is required to fetch first output details."
        });
      }
  
      // 1. Find the latest 'First Output' record to get the quantity.
      // We sort by createdAt descending and take the first one.
      const firstOutputRecord = await QCWashingFirstOutput.findOne()
        .sort({ createdAt: -1 })
        .lean();
  
      if (!firstOutputRecord) {
        return res.status(404).json({
          success: false,
          message:
            "No 'First Output' quantity has been set in the admin settings."
        });
      }
  
      const sampleSizeNum = parseInt(firstOutputRecord.quantity, 10);
  
      // 2. Get the buyer and AQL level based on the provided orderNo.
      const buyer = await getBuyerFromMoNumber(orderNo);
      const aqlLevel = getAqlLevelForBuyer(buyer);
  
      // 3. Find the AQL chart document based on the lot size (quantity).
      const aqlChart = await AQLChart.findOne({
        Type: "General",
        Level: "II",
        SampleSize: { $gte: sampleSizeNum }
      })
        .sort({ SampleSize: 1 })
        .lean();
  
      if (!aqlChart) {
        return res.status(404).json({
          success: false,
          message: "No AQL chart found for the given lot size."
        });
      }
  
      // 4. Find the specific AQL entry for the buyer's AQL level.
      const aqlEntry = aqlChart.AQL.find((aql) => aql.level === aqlLevel);
  
      if (!aqlEntry) {
        return res.status(404).json({
          success: false,
          message: `AQL level ${aqlLevel} not found for the matching chart.`
        });
      }
  
      // 5. Respond with the data in the format expected by the frontend.
      res.json({
        success: true,
        checkedQty: firstOutputRecord.quantity,
        aqlData: {
          sampleSize: aqlChart.SampleSize,
          acceptedDefect: aqlEntry.AcceptDefect,
          rejectedDefect: aqlEntry.RejectDefect,
          levelUsed: aqlLevel
        }
      });
    } catch (error) {
      console.error("Error fetching first output details:", error);
      res.status(500).json({
        success: false,
        message: "Server error while fetching first output details."
      });
    }
};

// Load submitted data
export const getqcwashingSavedData = async (req, res) => {
  try {
      const { orderNo } = req.params;
      const submittedData = await QCWashing.findOne({
        orderNo: orderNo,
        isAutoSave: false,
        status: "submitted"
      }).sort({ submittedAt: -1 });
  
      if (submittedData) {
        res.json({ success: true, data: submittedData });
      } else {
        res.json({ success: false, message: "No submitted data found" });
      }
    } catch (error) {
      console.error("Load submitted data error:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to load submitted data" });
    }
};

// Check if submitted data exists
export const checkqcwashingSubmitedData = async (req, res) => {
  try {
      const { orderNo } = req.params;
      const submittedData = await QCWashing.findOne({
        orderNo: orderNo,
        isAutoSave: false,
        status: "submitted"
      });
  
      res.json({
        exists: !!submittedData,
        isSubmitted: !!submittedData,
        recordId: submittedData?._id
      });
    } catch (error) {
      console.error("Check submitted data error:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to check submitted data" });
    }
};

//New QC_Washing Endpoints
export const saveQCWashingOrderData = async (req, res) => {
  try {
      const { formData, userId, savedAt } = req.body;
  
      if (!formData || !formData.orderNo) {
        return res
          .status(400)
          .json({ success: false, message: "Order No is required." });
      }
  
      const dateValue = formData.date
        ? new Date(
            formData.date.length === 10
              ? formData.date + "T00:00:00.000Z"
              : formData.date
          )
        : undefined;
  
      // Build the query for uniqueness - same as find-existing
      const query = {
        orderNo: formData.orderNo,
        date: dateValue,
        color: formData.color,
        washType: formData.washType,
        before_after_wash: formData.before_after_wash,
        factoryName: formData.factoryName,
        reportType: formData.reportType,
        "inspector.empId": userId
      };
  
      Object.keys(query).forEach(
        (key) =>
          (query[key] === undefined || query[key] === "") && delete query[key]
      );
  
      // Find existing record for THIS specific inspector
      let record = await QCWashing.findOne(query);
  
      if (!record) {
        record = new QCWashing({
          ...formData,
          inspector: {
            empId: userId
          },
          colorOrderQty: formData.colorOrderQty,
          userId,
          savedAt,
          status: "processing"
        });
      } else {
        Object.assign(record, formData);
        record.inspector.empId = userId;
        record.userId = userId;
        record.savedAt = savedAt;
        record.status = "processing";
      }
  
      await record.save();
  
      res.json({ success: true, id: record._id });
    } catch (err) {
      console.error("OrderData-save error:", err);
      res.status(500).json({
        success: false,
        message: "Server error while saving order data."
      });
    }
};


export const getQCWashingMeasurementData = async (req, res) => {
  try {
        const { orderNo } = req.params;
  
        if (!orderNo) {
          return res.status(400).json({
            success: false,
            message: "Order number is required",
            hasMeasurement: false
          });
        }
  
        const collection = ymProdConnection.db.collection("dt_orders");
  
        // Find the order first
        const order = await collection.findOne({
          $or: [{ Order_No: orderNo }, { Style: orderNo }]
        });
  
        if (!order) {
          return res.json({
            success: true,
            hasMeasurement: false,
            message: "Order not found",
            debug: {
              orderNo: orderNo,
              foundRecord: false
            }
          });
        }
  
        // Check if measurement specs exist and have valid data
        const hasBeforeWashSpecs =
          Array.isArray(order.BeforeWashSpecs) &&
          order.BeforeWashSpecs.length > 0 &&
          order.BeforeWashSpecs.some(
            (spec) =>
              spec.MeasurementPointEngName &&
              spec.MeasurementPointEngName.trim() !== ""
          );
  
        const hasAfterWashSpecs =
          Array.isArray(order.AfterWashSpecs) &&
          order.AfterWashSpecs.length > 0 &&
          order.AfterWashSpecs.some(
            (spec) =>
              spec.MeasurementPointEngName &&
              spec.MeasurementPointEngName.trim() !== ""
          );
  
        const hasMeasurement = hasBeforeWashSpecs || hasAfterWashSpecs;
  
        res.json({
          success: true,
          hasMeasurement: hasMeasurement,
          message: hasMeasurement
            ? "Measurement details found"
            : "No measurement details found for this order",
          debug: {
            orderNo: orderNo,
            foundRecord: true,
            measurementStructure: {
              hasBeforeWashSpecs: hasBeforeWashSpecs,
              hasAfterWashSpecs: hasAfterWashSpecs,
              beforeWashSpecsCount: order.BeforeWashSpecs?.length || 0,
              afterWashSpecsCount: order.AfterWashSpecs?.length || 0,
              orderData: {
                Order_No: order.Order_No,
                Style: order.Style
              }
            }
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Server error while checking measurement details",
          hasMeasurement: false,
          error: error.message
        });
      }
};

export const findQCWashingExistingRecord = async (req, res) => {
  try {
      const {
        orderNo,
        date,
        color,
        washType,
        before_after_wash,
        factoryName,
        reportType,
        inspectorId
      } = req.body;
  
      const dateValue = date
        ? new Date(date.length === 10 ? date + "T00:00:00.000Z" : date)
        : undefined;
  
      // Build the query to match core identifying fields INCLUDING inspector
      const query = {
        orderNo,
        date: dateValue,
        color,
        washType,
        before_after_wash,
        factoryName,
        reportType,
        "inspector.empId": inspectorId 
      };
  
      Object.keys(query).forEach(
        (key) =>
          (query[key] === undefined || query[key] === "") && delete query[key]
      );
  
      const record = await QCWashing.findOne(query);
  
      if (record) {
        res.json({ success: true, exists: true, record });
      } else {
        res.json({ success: true, exists: false });
      }
    } catch (err) {
      console.error("Find-existing error:", err);
      res.status(500).json({ success: false, message: "Server error." });
    }
};

export const getQCWashingSaveData = async (req, res) => {
  try {
    const { id } = req.params;
    const savedData = await QCWashing.findById(id);
    if (savedData) {
      res.json({ success: true, savedData });
    } else {
      res.json({ success: false, message: "No saved data found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to load saved data" });
  }
};

function normalizeInspectionImagePath(img) {
  if (!img) return "";

  // If new upload, img.file will be handled by fileMap logic in your code

  if (img.preview && typeof img.preview === "string") {
    // If it's already a full URL, return as-is
    if (img.preview.startsWith("http")) {
      return img.preview;
    }

    // Convert relative paths to full URLs
    if (img.preview.startsWith("./public/storage/")) {
      const relativePath = img.preview.replace("./public/storage/", "");
      return `${
        process.env.BASE_URL || "http://localhost:3000"
      }/storage/${relativePath}`;
    }

    if (img.preview.startsWith("/storage/")) {
      return `${process.env.BASE_URL || "http://localhost:3000"}${img.preview}`;
    }

    if (img.preview.startsWith("./public/")) {
      return img.preview;
    }
    if (img.preview.startsWith("/public/")) {
      return "." + img.preview;
    }
    if (img.preview.startsWith("/storage/")) {
      return "./public" + img.preview; 
    }
    if (img.preview.startsWith("http")) {
      try {
        const url = new URL(img.preview);
        return "./public" + url.pathname;
      } catch (e) {
        return img.preview;
      }
    }

    if (!img.preview.includes("/")) {
      return `./public/storage/qc_washing_images/inspection/${img.preview}`;
    }

    if (img.preview[0] !== "/") {
      return `./public/storage/qc_washing_images/inspection/${img.preview}`;
    }

    // Fallback
    return img.preview;
  }

  if (img.name && !img.name.includes("/")) {
    return `./public/storage/qc_washing_images/inspection/${img.name}`;
  }

  return "";
}

// Add this helper function at the top of your file to get the server base URL
function getServerBaseUrl(req) {
  const protocol = req.protocol || "http";
  const host = req.get("host") || "localhost:3000";
  return `${protocol}://${host}`;
}

// Helper function to group checkpoint data
function groupCheckpointData(checkpointInspectionData) {
  const groupedData = [];
  const mainCheckpoints = new Map();
  
  // First pass: collect all main checkpoints
  checkpointInspectionData.forEach(item => {
    if (item.type === 'main') {
      mainCheckpoints.set(item.checkpointId, {
        id: item.id,
        checkpointId: item.checkpointId,
        name: item.name,
        optionType: item.optionType,
        decision: item.decision,
        remark: item.remark,
        comparisonImages: item.comparisonImages || [],
        subPoints: [] // Initialize empty sub-points array
      });
    }
  });
  
  // Second pass: add sub-points to their parent main checkpoints
  checkpointInspectionData.forEach(item => {
    if (item.type === 'sub') {
      const mainCheckpoint = mainCheckpoints.get(item.checkpointId);
      if (mainCheckpoint) {
        mainCheckpoint.subPoints.push({
          id: item.id,
          subPointId: item.subPointId,
          name: item.name,
          optionType: item.optionType,
          decision: item.decision,
          remark: item.remark,
          comparisonImages: item.comparisonImages || []
        });
      }
    }
  });
  
  // Convert map to array
  return Array.from(mainCheckpoints.values());
}

export const saveQCWashingInspectionData = async (req, res) => {
  const standardValues = JSON.parse(req.body.standardValues || "{}");
    const actualValues = JSON.parse(req.body.actualValues || "{}");
    const machineStatus = JSON.parse(req.body.machineStatus || "{}");
    
    try {
      const { recordId } = req.body;
      const inspectionData = JSON.parse(req.body.inspectionData || "[]");
      const processData = JSON.parse(req.body.processData || "{}");
      const defectData = JSON.parse(req.body.defectData || "[]");
      const checkpointInspectionData = JSON.parse(req.body.checkpointInspectionData || "[]");
      const timeCoolEnabled = JSON.parse(req.body.timeCoolEnabled || "false");
      const timeHotEnabled = JSON.parse(req.body.timeHotEnabled || "false");

      if (!recordId) {
        return res
          .status(400)
          .json({ success: false, message: "recordId is required" });
      }

      // Get server base URL
      const serverBaseUrl = getServerBaseUrl(req);

      // Handle file uploads for both regular inspection and checkpoint images
      const uploadDir = path.join(
        __backendDir,
        "./public/storage/qc_washing_images/inspection"
      );
      const fileMap = {};
      
      for (const file of req.files || []) {
        const fileExtension = path.extname(file.originalname);
        const newFilename = `inspection-${Date.now()}-${Math.round(
          Math.random() * 1e9
        )}${fileExtension}`;
        const fullFilePath = path.join(uploadDir, newFilename);
        await fs.promises.writeFile(fullFilePath, file.buffer);
        fileMap[
          file.fieldname
        ] = `${serverBaseUrl}/storage/qc_washing_images/inspection/${newFilename}`;
      }

      // Find or create the record
      let record = await QCWashing.findById(recordId);
      if (!record) {
        record = new QCWashing({ _id: recordId });
      }

      const machineProcesses = [];
      const machineTypes = {
        "Washing Machine": ["temperature", "time", "silicon", "softener"],
        "Tumble Dry": ["temperature", "timeCool", "timeHot"]
      };

      Object.entries(machineTypes).forEach(([machineType, parameters]) => {
        const machineProcess = { machineType };
        parameters.forEach((param) => {
          const actualVal = actualValues[machineType]?.[param];
          const standardVal = standardValues[machineType]?.[param];
          machineProcess[param] = {
            actualValue:
              actualVal === null || actualVal === undefined ? "" : actualVal,
            standardValue:
              standardVal === null || standardVal === undefined
                ? ""
                : standardVal,
            status: {
              ok: machineStatus[machineType]?.[param]?.ok || false,
              no: machineStatus[machineType]?.[param]?.no || false
            }
          };
        });
        machineProcesses.push(machineProcess);
      });

      // Handle inspection images with full server URLs
      if (inspectionData) {
        inspectionData.forEach((item, idx) => {
          if (item.comparisonImages) {
            item.comparisonImages = item.comparisonImages.map((img, imgIdx) => {
              const newImageUrl = fileMap[`comparisonImages_${idx}_${imgIdx}`];
              if (newImageUrl) {
                return newImageUrl;
              }
              if (
                typeof img === "string" &&
                (img.startsWith("http://") || img.startsWith("https://"))
              ) {
                return img;
              }
              if (typeof img === "string" && img.startsWith("./")) {
                return `${serverBaseUrl}${img.replace("./", "/")}`;
              }
              if (typeof img === "object" && img !== null && img.name) {
                if (
                  img.name.startsWith("http://") ||
                  img.name.startsWith("https://")
                ) {
                  return img.name;
                }
                if (img.name.startsWith("./")) {
                  return `${serverBaseUrl}${img.name.replace("./", "/")}`;
                }
                return img.name;
              }
              return img || "";
            });
          }
        });
      }

      // Handle checkpoint images and group the data
      if (checkpointInspectionData) {
        checkpointInspectionData.forEach((item, idx) => {
          if (item.comparisonImages) {
            item.comparisonImages = item.comparisonImages.map((img, imgIdx) => {
              const newImageUrl = fileMap[`checkpointImages_${idx}_${imgIdx}`];
              if (newImageUrl) {
                return newImageUrl;
              }
              return normalizeInspectionImagePath(img);
            });
          }
        });
      }

      // Group checkpoint data with sub-points nested under main checkpoints
      const groupedCheckpointData = groupCheckpointData(checkpointInspectionData);

      // Build the inspection details
      record.inspectionDetails = {
        ...record.inspectionDetails,
        checkedPoints: (inspectionData || []).map((item, idx) => ({
          pointName: item.checkedList,
          decision: item.decision,
          comparison: (item.comparisonImages || []).map((img, imgIdx) => {
            if (fileMap[`comparisonImages_${idx}_${imgIdx}`]) {
              return fileMap[`comparisonImages_${idx}_${imgIdx}`];
            }
            return normalizeInspectionImagePath(img);
          }),
          remark: item.remark
        })),
        // Use grouped checkpoint data instead of flat array
        checkpointInspectionData: groupedCheckpointData,
        machineProcesses: machineProcesses,
        parameters: (defectData || []).map((item) => ({
          parameterName: item.parameter,
          checkedQty: item.checkedQty,
          defectQty: item.failedQty,
          passRate: item.passRate,
          result: item.result,
          remark: item.remark
        })),
        // Add machine settings
        timeCoolEnabled,
        timeHotEnabled
      };

      record.savedAt = new Date();
      record.status = "processing";

      await record.save();

      res.json({
        success: true,
        message: "Inspection data saved",
        data: record
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server error" });
    }
};

// Updated inspection-update endpoint
export const updateQCWashingInspectionData = async (req, res) => {
  const standardValues = JSON.parse(req.body.standardValues || "{}");
    const actualValues = JSON.parse(req.body.actualValues || "{}");
    const machineStatus = JSON.parse(req.body.machineStatus || "{}");
    
    try {
      const { recordId } = req.body;
      const inspectionData = JSON.parse(req.body.inspectionData || "[]");
      const processData = JSON.parse(req.body.processData || "{}");
      const defectData = JSON.parse(req.body.defectData || "[]");
      const checkpointInspectionData = JSON.parse(req.body.checkpointInspectionData || "[]");
      const timeCoolEnabled = JSON.parse(req.body.timeCoolEnabled || "false");
      const timeHotEnabled = JSON.parse(req.body.timeHotEnabled || "false");

      if (!recordId) {
        return res
          .status(400)
          .json({ success: false, message: "recordId is required" });
      }

      // Get server base URL
      const serverBaseUrl = getServerBaseUrl(req);

      // Handle file uploads
      const uploadDir = path.join( 
        __backendDir,
        "./public/storage/qc_washing_images/inspection"
      );
      const fileMap = {};
      
      for (const file of req.files || []) {
        const fileExtension = path.extname(file.originalname);
        const newFilename = `inspection-${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;
        const fullFilePath = path.join(uploadDir, newFilename);
        await fs.promises.writeFile(fullFilePath, file.buffer);
        fileMap[
          file.fieldname
        ] = `${serverBaseUrl}/storage/qc_washing_images/inspection/${newFilename}`;
      }

      // Find the record
      let record = await QCWashing.findById(recordId);
      if (!record) {
        return res
          .status(404)
          .json({ success: false, message: "Record not found for update" });
      }

      // Build machine processes with the new structure
      const machineProcesses = [];
      const machineTypes = {
        "Washing Machine": ["temperature", "time", "silicon", "softener"],
        "Tumble Dry": ["temperature", "timeCool", "timeHot"]
      };

      Object.entries(machineTypes).forEach(([machineType, parameters]) => {
        const machineProcess = { machineType };
        parameters.forEach((param) => {
          const actualVal = actualValues[machineType]?.[param];
          const standardVal = standardValues[machineType]?.[param];
          machineProcess[param] = {
            actualValue:
              actualVal === null || actualVal === undefined ? "" : actualVal,
            standardValue:
              standardVal === null || standardVal === undefined
                ? ""
                : standardVal,
            status: {
              ok: machineStatus[machineType]?.[param]?.ok || false,
              no: machineStatus[machineType]?.[param]?.no || false
            }
          };
        });
        machineProcesses.push(machineProcess);
      });

      // Handle inspection images with full server URLs (same logic as save)
      if (inspectionData) {
        inspectionData.forEach((item, idx) => {
          if (item.comparisonImages) {
            item.comparisonImages = item.comparisonImages.map((img, imgIdx) => {
              const newImageUrl = fileMap[`comparisonImages_${idx}_${imgIdx}`];
              if (newImageUrl) {
                return newImageUrl;
              }
              return img;
            });
          }
        });
      }

      // Handle checkpoint images
      if (checkpointInspectionData) {
        checkpointInspectionData.forEach((item, idx) => {
          if (item.comparisonImages) {
            item.comparisonImages = item.comparisonImages.map((img, imgIdx) => {
              const newImageUrl = fileMap[`checkpointImages_${idx}_${imgIdx}`];
              if (newImageUrl) {
                return newImageUrl;
              }
              return img;
            });
          }
        });
      }

      // Group checkpoint data with sub-points nested under main checkpoints
      const groupedCheckpointData = groupCheckpointData(checkpointInspectionData);

      // Build the inspection details
      record.inspectionDetails = {
        ...record.inspectionDetails,
        checkedPoints: (inspectionData || []).map((item, idx) => {
          const images = (item.comparisonImages || []).map((img, imgIdx) => {
            if (fileMap[`comparisonImages_${idx}_${imgIdx}`]) {
              return fileMap[`comparisonImages_${idx}_${imgIdx}`];
            }
            return normalizeInspectionImagePath(img);
          });

          return {
            pointName: item.checkedList,
            decision: item.decision,
            comparison: images,
            remark: item.remark
          };
        }),
        // Use grouped checkpoint data instead of flat array
        checkpointInspectionData: groupedCheckpointData,
        machineProcesses: machineProcesses,
        parameters: (defectData || []).map((item) => ({
          parameterName: item.parameter,
          checkedQty: item.checkedQty,
          defectQty: item.failedQty,
          passRate: item.passRate,
          result: item.result,
          remark: item.remark
        })),
        // Update machine settings
        timeCoolEnabled,
        timeHotEnabled
      };

      record.savedAt = new Date();
      await record.save();

      res.json({
        success: true,
        message: "Inspection data updated",
        data: record
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server error" });
    }
};


// Save defect details with images
export const saveQCWashingDefectData = async (req, res) => {
  try {
      const { recordId } = req.body;
      const defectDetails = JSON.parse(req.body.defectDetails || "{}");

      if (!recordId)
        return res
          .status(400)
          .json({ success: false, message: "Missing recordId" });
      // Get server base URL
      const serverBaseUrl = getServerBaseUrl(req);

      // Ensure upload directory exists
      const uploadDir = path.join(__backendDir, 
        "./public/storage/qc_washing_images/defect"
      ); 

      // Map uploaded files by fieldname and write them to disk
      const fileMap = {};
      for (const file of req.files || []) {
        let fileExtension = path.extname(file.originalname);
        if (!fileExtension) {
          fileExtension = ".jpg";
        }
        const newFilename = `defect-${Date.now()}-${Math.round(
          Math.random() * 1e9
        )}${fileExtension}`;
        const fullFilePath = path.join(uploadDir, newFilename);
        await fs.promises.writeFile(fullFilePath, file.buffer);
        fileMap[
          file.fieldname
        ] = `${serverBaseUrl}/storage/qc_washing_images/defect/${newFilename}`;
      }

      // Attach image URLs to defectDetails.defectsByPc and additionalImages
      if (defectDetails.defectsByPc) {
        defectDetails.defectsByPc.forEach((pc, pcIdx) => {
          (pc.pcDefects || []).forEach((defect, defectIdx) => {
            if (defect.defectImages) {
              defect.defectImages = defect.defectImages.map((img, imgIdx) => {
                // Return new uploaded image URL
                const newImageUrl =
                  fileMap[`defectImages_${pcIdx}_${defectIdx}_${imgIdx}`];
                if (newImageUrl) {
                  return newImageUrl;
                }

                // Handle existing images
                if (
                  typeof img === "string" &&
                  (img.startsWith("http://") || img.startsWith("https://"))
                ) {
                  return img; // Already a full URL
                }

                if (typeof img === "string" && img.startsWith("./")) {
                  return `${serverBaseUrl}${img.replace("./", "/")}`;
                }

                if (typeof img === "object" && img !== null && img.name) {
                  if (
                    img.name.startsWith("http://") ||
                    img.name.startsWith("https://")
                  ) {
                    return img.name;
                  }
                  if (img.name.startsWith("./")) {
                    return `${serverBaseUrl}${img.name.replace("./", "/")}`;
                  }
                  return img.name;
                }

                return img || "";
              });
            }
          });
        });
      }

      if (defectDetails.additionalImages) {
        defectDetails.additionalImages = defectDetails.additionalImages.map(
          (img, imgIdx) => {
            // Return new uploaded image URL
            const newImageUrl = fileMap[`additionalImages_${imgIdx}`];
            if (newImageUrl) {
              return newImageUrl;
            }

            // Handle existing images
            if (
              typeof img === "string" &&
              (img.startsWith("http://") || img.startsWith("https://"))
            ) {
              return img; // Already a full URL
            }

            if (typeof img === "string" && img.startsWith("./")) {
              return `${serverBaseUrl}${img.replace("./", "/")}`;
            }

            if (typeof img === "object" && img !== null && img.name) {
              if (
                img.name.startsWith("http://") ||
                img.name.startsWith("https://")
              ) {
                return img.name;
              }
              if (img.name.startsWith("./")) {
                return `${serverBaseUrl}${img.name.replace("./", "/")}`;
              }
              return img.name;
            }

            return img || "";
          }
        );
      }

      // Save to DB
      const doc = await QCWashing.findByIdAndUpdate(
        recordId,
        { defectDetails: defectDetails, updatedAt: new Date() },
        { new: true }
      );

      if (!doc)
        return res
          .status(404)
          .json({ success: false, message: "Record not found" });

      res.json({ success: true, data: doc.defectDetails });
    } catch (err) {
      console.error("Defect details save error:", err);
      res.status(500).json({ success: false, message: err.message });
    }
};

export const updateQCWashingDefectData = async (req, res) => {
  try {
      const { recordId } = req.body;
      const defectDetails = JSON.parse(req.body.defectDetails || "{}");
      if (!recordId)
        return res
          .status(400)
          .json({ success: false, message: "Missing recordId" });

      // Get server base URL
      const serverBaseUrl = getServerBaseUrl(req);

      // Ensure upload directory exists
      const uploadDir = path.join(__backendDir, 
        "./public/storage/qc_washing_images/defect"
      ); 

      // Map uploaded files by fieldname and write them to disk
      const fileMap = {};
      for (const file of req.files || []) {
        let fileExtension = path.extname(file.originalname);
        if (!fileExtension) {
          // fallback to .jpg if no extension is found
          fileExtension = ".jpg";
        }
        const newFilename = `defect-${Date.now()}-${Math.round(
          Math.random() * 1e9
        )}${fileExtension}`;
        const fullFilePath = path.join(uploadDir, newFilename);
        await fs.promises.writeFile(fullFilePath, file.buffer);
        fileMap[
          file.fieldname
        ] = `${serverBaseUrl}/storage/qc_washing_images/defect/${newFilename}`;
      }

      // Attach image URLs to defectDetails.defectsByPc and additionalImages
      if (defectDetails.defectsByPc) {
        defectDetails.defectsByPc.forEach((pc, pcIdx) => {
          (pc.pcDefects || []).forEach((defect, defectIdx) => {
            if (defect.defectImages) {
              defect.defectImages = defect.defectImages.map((img, imgIdx) => {
                return (
                  fileMap[`defectImages_${pcIdx}_${defectIdx}_${imgIdx}`] || img
                );
              });
            }
          });
        });
      }
      if (defectDetails.additionalImages) {
        defectDetails.additionalImages = defectDetails.additionalImages.map(
          (img, imgIdx) => {
            return fileMap[`additionalImages_${imgIdx}`] || img;
          }
        );
      }

      // Save to DB
      const doc = await QCWashing.findByIdAndUpdate(
        recordId,
        { defectDetails: defectDetails, updatedAt: new Date() },
        { new: true }
      );
      if (!doc)
        return res
          .status(404)
          .json({ success: false, message: "Record not found" });
      res.json({ success: true, data: doc.defectDetails });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
};

function calculateMeasurementSizeSummary(measurementDetail) {
  if (!measurementDetail || !Array.isArray(measurementDetail.pcs)) {
    return {};
  }

  let checkedPcs = measurementDetail.pcs.length;
  let checkedPoints = 0;
  let totalPass = 0;
  let totalFail = 0;
  let plusToleranceFailCount = 0;
  let minusToleranceFailCount = 0;

  measurementDetail.pcs.forEach((pc) => {
    (pc.measurementPoints || []).forEach((point) => {
      checkedPoints++;
      if (point.result === "pass") totalPass++;
      if (point.result === "fail") {
        totalFail++;
        // Only count fail points for plus/minus tolerance
        const value =
          typeof point.measured_value_decimal === "number"
            ? point.measured_value_decimal
            : parseFloat(point.measured_value_decimal);
        const specs =
          typeof point.specs === "number"
            ? point.specs
            : parseFloat(point.specs);
        const tolMinus =
          typeof point.toleranceMinus === "number"
            ? point.toleranceMinus
            : parseFloat(point.toleranceMinus);
        const tolPlus =
          typeof point.tolerancePlus === "number"
            ? point.tolerancePlus
            : parseFloat(point.tolerancePlus);

        if (!isNaN(value) && !isNaN(specs)) {
          if (!isNaN(tolPlus) && value > tolPlus) plusToleranceFailCount++;
          if (!isNaN(tolMinus) && value < tolMinus) minusToleranceFailCount++;
        }
      }
    });
  });

  // Determine the correct wash type format
  const washType = measurementDetail.before_after_wash === 'Before Wash' ? 'beforeWash' : 
    measurementDetail.before_after_wash === 'After Wash' ? 'afterWash' :
    measurementDetail.before_after_wash;

  return {
    size: measurementDetail.size,
    before_after_wash: washType,
    kvalue: measurementDetail.kvalue,
    checkedPcs,
    checkedPoints,
    totalPass,
    totalFail,
    plusToleranceFailCount,
    minusToleranceFailCount
  };
}

// Save or update measurement details for a record
export const saveQCWashingMeasurementData = async (req, res) => {
  try {
      const { recordId, measurementDetail } = req.body;
      
      if (!recordId || !measurementDetail) {
        return res.status(400).json({
          success: false,
          message: "Missing recordId or measurementDetail"
        });
      }
      
      if (!measurementDetail.before_after_wash || !measurementDetail.kvalue) {
        return res.status(400).json({
          success: false,
          message: "before_after_wash and kvalue are required in measurementDetail"
        });
      }
  
      const record = await QCWashing.findById(recordId);
      if (!record) {
        return res.status(404).json({ 
          success: false, 
          message: "Record not found" 
        });
      }
  
      if (!record.measurementDetails) {
        record.measurementDetails = {
          measurement: [],
          measurementSizeSummary: []
        };
      }
  
      const washType = measurementDetail.before_after_wash;
      const isEdit = measurementDetail.isEdit === true;
   
      const measurementIndex = record.measurementDetails.measurement.findIndex(
        (m) => 
          m.size === measurementDetail.size &&
          m.kvalue === measurementDetail.kvalue &&
          m.before_after_wash === washType
      );
      
      let summaryIndex = -1;
  
      summaryIndex = record.measurementDetails.measurementSizeSummary.findIndex(
        (s) => 
          s.size === measurementDetail.size &&
          s.kvalue === measurementDetail.kvalue &&
          s.before_after_wash === washType
      );
      
      if (summaryIndex === -1) {
        summaryIndex = record.measurementDetails.measurementSizeSummary.findIndex(
          (s) => 
            s.size === measurementDetail.size &&
            s.kvalue === measurementDetail.kvalue
        );
        
      }
      
      // Calculate new summary
      const summary = calculateMeasurementSizeSummary(measurementDetail);
      
      if (measurementIndex !== -1) {
        record.measurementDetails.measurement[measurementIndex] = measurementDetail;
      } else {
        record.measurementDetails.measurement.push(measurementDetail);
      }
      
      if (summaryIndex !== -1) {
        record.measurementDetails.measurementSizeSummary[summaryIndex] = summary;
      } else {
        record.measurementDetails.measurementSizeSummary.push(summary);
      }
  
      record.savedAt = new Date();
      await record.save();
  
      res.json({
        success: true,
        message: isEdit ? "Measurement detail updated" : "Measurement detail saved",
        measurementDetails: record.measurementDetails
      });
  
    } catch (err) {
      console.error("Measurement save error:", err);
      res.status(500).json({ 
        success: false, 
        message: "Failed to save measurement detail" 
      });
    }
};

export const updateQCWashingMeasurementData = async (req, res) => {
  try {
      const { recordId } = req.params;
      const summary = req.body.summary || {};
      const qcRecord = await QCWashing.findById(recordId);
      if (!qcRecord)
        return res
          .status(404)
          .json({ success: false, message: "Record not found." });

      // Accept both totalCheckedPoints and totalCheckedPcs for compatibility
      qcRecord.totalCheckedPoint =
        summary.totalCheckedPoints ?? summary.totalCheckedPcs ?? 0;
      qcRecord.totalCheckedPcs =
        summary.totalCheckedPcs ?? summary.totalCheckedPoints ?? 0;
      qcRecord.totalPass = summary.totalPass ?? 0;
      qcRecord.totalFail = summary.totalFail ?? 0;
      qcRecord.passRate = summary.passRate ?? 0;
      qcRecord.measurementOverallResult =
        summary.overallResult || summary.overallFinalResult || "PENDING";
      qcRecord.savedAt = new Date();

      await qcRecord.save();
      res.json({ success: true });
    } catch (error) {
      console.error("Measurement summary autosave error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to autosave measurement summary."
      });
    }
};

// Get specific submitted QC washing data by ID
export const getQCWashingSubmittedData = async (req, res) => {
  try {
      const { id } = req.params;
  
      // Validate the ID format (assuming MongoDB ObjectId)
      if (!id || id.length !== 24) {
        return res.status(400).json({
          success: false,
          message: "Invalid ID format"
        });
      }
  
      const reportData = await QCWashing.findById(id).lean();
  
      if (!reportData) {
        return res.status(404).json({
          success: false,
          message: "Report not found"
        });
      }
  
      // Transform the data to match the expected format for the modal
      const transformedData = {
        ...reportData,
        colorName: reportData.color, 
        formData: {
          result: reportData.overallFinalResult,
          remarks: reportData.defectDetails?.comment || "",
          measurements: reportData.measurementDetails?.measurement || []
        }
      };
  
      res.json({
        success: true,
        data: transformedData
      });
    } catch (error) {
      console.error("Error fetching QC washing report:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch report data",
        error: error.message
      });
    }
};

export const getQCWashingComparison = async (req, res) => {
  try {
      const { orderNo, color, washType, reportType, factory, before_after_wash } =
        req.query;
  
      const baseFilter = {
        orderNo,
        color,
        washType,
        factoryName: factory,
        reportType,
        before_after_wash: before_after_wash || "Before Wash",
      };
  
      let comparisonRecord = null;
  
      // 1. Try to find a record with the same reportType first to get the most relevant match.
      if (reportType) {
        comparisonRecord = await QCWashing.findOne({ ...baseFilter, reportType }).sort({ createdAt: -1 });
      }
  
      if (!comparisonRecord) {
        comparisonRecord = await QCWashing.findOne(baseFilter).sort({ createdAt: -1 });
      }
  
      res.json(comparisonRecord);
    } catch (error) {
      console.error("Error fetching comparison data for QC Washing:", error);
      res.status(500).json({ error: "Failed to fetch comparison data", details: error.message });
    }
};

export const useAditionalImageSaving = async (req, res, next) => {
    // Set CORS headers specifically for image requests
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Cache-Control"
  );
  res.header("Access-Control-Max-Age", "86400"); // 24 hours

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  next();
};

// Replace your current image serving endpoint with this ES module version
export const getQCWashingImageFilename = async (req, res) => {
  const { type, filename } = req.params;

  // Set CORS headers
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Cache-Control", "public, max-age=3600");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // First, try to find the file locally
    const possiblePaths = [new URL(
      `../../public/storage/qc_washing_images/${type}/${filename}`,
        process.cwd(),
        "public/storage/qc_washing_images",
        type,
        filename
      ),new URL(
      `../../storage/qc_washing_images/${type}/${filename}`, process.cwd(), "storage/qc_washing_images", type, filename),new URL(
      `../../public/qc_washing_images/${type}/${filename}`, process.cwd(), "public", "qc_washing_images", type, filename),new URL(
      `../../uploads/qc_washing_images/${type}/${filename}`, process.cwd(), "uploads/qc_washing_images", type, filename),new URL(
      `../../files/qc_washing_images/${type}/${filename}`, process.cwd(), "files/qc_washing_images", type, filename)
    ];

    let foundPath = null;
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        foundPath = testPath;
        break;
      }
    }

    if (foundPath) {
      // Serve local file
      const ext = new URL(filename, 'file://').pathname.split('.').pop().toLowerCase();
      const mimeTypes = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp"
      };

      res.setHeader("Content-Type", mimeTypes[ext] || "image/jpeg");
      res.sendFile(foundPath);
      return;
    }

    const proxyUrl = `https://yqms.yaikh.com/storage/qc_washing_images/${type}/${filename}`;

    const urlObj = new URL(proxyUrl);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname,
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    };

    const proxyReq = https.request(options, (proxyRes) => {
      if (proxyRes.statusCode !== 200) {

        throw new Error(`HTTP error! status: ${proxyRes.statusCode}`);
      }

      // Set content type
      const contentType = proxyRes.headers["content-type"] || "image/jpeg";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Length", proxyRes.headers["content-length"]);

      // Pipe the response
      proxyRes.pipe(res);

    });

    proxyReq.on("error", (error) => {
      throw error;
    });

    proxyReq.setTimeout(10000, () => {
      proxyReq.destroy();
      throw new Error("Request timeout");
    });

    proxyReq.end();
  } catch (error) {
    console.error("Error fetching QC Washing filter options:", error);
    res.status(500).json({ error: "Failed to fetch filter options" });
  }
};


// Endpoint to update wash qty for a specific record
export const updateQCWashingQty = async (req, res) => {
  try {
      const { id } = req.params;
      const { washQty } = req.body;
  
      const updatedRecord = await QCWashing.findByIdAndUpdate(
        id,
        { washQty: parseInt(washQty) || 0 },
        { new: true }
      );
  
      if (!updatedRecord) {
        return res.status(404).json({
          success: false,
          message: "Record not found"
        });
      }
  
      res.json({
        success: true,
        data: updatedRecord,
        message: "Wash qty updated successfully"
      });
    } catch (error) {
      console.error("Error updating wash qty:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update wash qty",
        error: error.message
      });
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
        message: 'Invalid record ID' 
      });
    }

    // Validate the editedWashQty
    if (editedWashQty === undefined || editedWashQty === null) {
      return res.status(400).json({ 
        success: false, 
        message: 'Edited wash quantity is required' 
      });
    }

    const parsedEditedWashQty = parseInt(editedWashQty);
    if (isNaN(parsedEditedWashQty) || parsedEditedWashQty < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Edited wash quantity must be a valid non-negative number' 
      });
    }

    // Update the record with the new edited wash quantity
    const updatedRecord = await QCWashing.findByIdAndUpdate(
      id,
      { 
        $set: {
          editedActualWashQty: parsedEditedWashQty,
          lastEditedAt: new Date(),
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
        message: 'QC Washing record not found' 
      });
    }

    res.json({ 
      success: true, 
      data: updatedRecord,
      message: 'Edited wash quantity updated successfully'
    });

  } catch (error) {
    console.error('Error updating edited wash qty:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
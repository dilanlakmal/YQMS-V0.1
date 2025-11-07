import { 
  BuyerSpecTemplate,
  ymProdConnection,
  ANFMeasurementReport,
  SizeCompletionStatus,
 } from "../MongoDB/dbConnectionController.js";

// Endpoint to get all MO Nos from the buyer spec templates for the search dropdown
export const getBuyerSpecMoNos = async (req, res) => {
  try {
      // only need the moNo field, and we sort it for a better user experience.
      const monos = await BuyerSpecTemplate.find({}, { moNo: 1, _id: 0 }).sort({
        moNo: 1
      });
      // Return an array of strings
      res.json(monos.map((m) => m.moNo));
    } catch (error) {
      console.error("Error fetching MO options for ANF Measurement:", error);
      res.status(500).json({ error: "Failed to fetch MO options" });
    }
};

// Endpoint to get details from the BuyerSpecTemplate (buyer, available sizes)
export const getBuyerSpecData = async (req, res) => {
  try {
      const { moNo } = req.params;
      const template = await BuyerSpecTemplate.findOne({ moNo: moNo });
  
      if (!template) {
        return res
          .status(404)
          .json({ error: "Spec Template not found for this MO No." });
      }
  
      // Extract buyer and all available sizes from the specData array
      const buyer = template.buyer;
      const sizes = template.specData.map((data) => data.size);
  
      res.json({ buyer, sizes });
    } catch (error) {
      console.error(
        `Error fetching template details for MO No ${req.params.moNo}:`,
        error
      );
      res.status(500).json({ error: "Failed to fetch template details" });
    }
};

// Endpoint to get comprehensive order details (colors, quantities) from the dt_orders collection
export const getAnfOrderDetails = async (req, res) => {
  try {
      const { moNo } = req.params;
      // Querying the dt_orders collection using the ymEcoConnection
      
      const order = await ymProdConnection.db
        .collection("dt_orders")
        .findOne({ Order_No: moNo });
  
      if (!order) {
        return res
          .status(404)
          .json({ error: "Order not found in dt_orders collection." });
      }
  
      // Extract unique colors for the dropdown
      const colorOptions = [
        ...new Set(order.OrderColors.map((c) => c.Color.trim()))
      ];
  
      // Create a map of color to its size quantities
      const colorQtyBySize = {};
      order.OrderColors.forEach((colorObj) => {
        const color = colorObj.Color.trim();
        colorQtyBySize[color] = {};
        colorObj.OrderQty.forEach((sizeEntry) => {
          const sizeName = Object.keys(sizeEntry)[0].split(";")[0].trim();
          const quantity = sizeEntry[sizeName];
          if (quantity > 0) {
            colorQtyBySize[color][sizeName] = quantity;
          }
        });
      });
  
      res.json({
        custStyle: order.CustStyle || "N/A",
        mode: order.Mode || "N/A",
        country: order.Country || "N/A",
        origin: order.Origin || "N/A",
        totalOrderQty: order.TotalQty,
        colorOptions: colorOptions.map((c) => ({ value: c, label: c })),
        colorQtyBySize
      });
    } catch (error) {
      console.error(
        `Error fetching order details for MO No ${req.params.moNo}:`,
        error
      );
      res.status(500).json({ error: "Failed to fetch order details." });
    }
};

// Endpoint to get the detailed spec table data for a selected MO No and Size
export const getAnfSpecTable = async (req, res) => {
  try {
      const { moNo, size } = req.query;
      if (!moNo || !size) {
        return res.status(400).json({ error: "MO No and Size are required." });
      }
  
      const template = await BuyerSpecTemplate.findOne({ moNo: moNo });
      if (!template) {
        return res
          .status(404)
          .json({ error: "Template not found for this MO No." });
      }
  
      const sizeData = template.specData.find((sd) => sd.size === size);
      if (!sizeData) {
        return res
          .status(404)
          .json({ error: `No spec data found for size ${size} in this MO.` });
      }
  
      const sortedSpecDetails = sizeData.specDetails.sort(
        (a, b) => a.orderNo - b.orderNo
      );
      res.json(sortedSpecDetails);
    } catch (error) {
      console.error("Error fetching spec table data:", error);
      res.status(500).json({ error: "Failed to fetch spec table data." });
    }
};

// Endpoint to save or update an ANF Measurement Report
export const saveBuyerSpecReport = async (req, res) => {
  try {
      const {
        inspectionDate,
        qcID,
        moNo,
        buyer,
        color,
        orderDetails,
        measurementDetails
        // We will ignore overallMeasurementSummary from the client and always recalculate it
      } = req.body;
  
      // Validation
      if (!inspectionDate || !qcID || !moNo || !color || !measurementDetails) {
        return res
          .status(400)
          .json({ error: "Missing required fields for the report." });
      }
  
      // --- FIX: Create a timezone-agnostic UTC date ---
      // This creates a date object for midnight UTC on the given day, regardless of server timezone.
      const reportDate = new Date(`${inspectionDate}T00:00:00.000Z`);
  
      // The unique key for finding the document
      const filter = {
        //inspectionDate: new Date(new Date(inspectionDate).setHours(0, 0, 0, 0)),
        inspectionDate: reportDate, // Use the standardized UTC date
        qcID,
        moNo,
        color: { $all: color.sort(), $size: color.length } // Sort colors for consistent matching
      };
  
      // Find the existing report
      let report = await ANFMeasurementReport.findOne(filter);
  
      const newSizeData = measurementDetails[0]; // We assume one size is saved at a time
  
      if (report) {
        // --- If Report Exists, Update It ---
        const existingSizeIndex = report.measurementDetails.findIndex(
          (detail) => detail.size === newSizeData.size
        );
  
        if (existingSizeIndex > -1) {
          // This size's data already exists, so we replace it to prevent duplicates
          report.measurementDetails[existingSizeIndex] = newSizeData;
        } else {
          // This is a new size for this report, so we add it
          report.measurementDetails.push(newSizeData);
        }
      } else {
        // --- If Report Does Not Exist, Create It ---
        // We're creating it in memory first, then we'll calculate the summary before saving
        report = new ANFMeasurementReport({
          //inspectionDate: filter.inspectionDate,
          inspectionDate: reportDate, // Use the standardized UTC date
          qcID,
          moNo,
          buyer,
          color: color.sort(),
          orderDetails,
          measurementDetails // This will contain the first (and only) size's data
        });
      }
  
      // --- Recalculate the overall summary AFTER updating/creating the report in memory ---
      const newOverallSummary = {
        garmentDetailsCheckedQty: 0,
        garmentDetailsOKGarment: 0,
        garmentDetailsRejected: 0,
        measurementDetailsPoints: 0,
        measurementDetailsPass: 0,
        measurementDetailsTotalIssues: 0,
        measurementDetailsTolPositive: 0,
        measurementDetailsTolNegative: 0
      };
  
      report.measurementDetails.forEach((detail) => {
        const summary = detail.sizeSummary;
        if (summary) {
          for (const key in newOverallSummary) {
            newOverallSummary[key] += summary[key] || 0;
          }
        }
      });
      // Assign the newly calculated summary to the report
      report.overallMeasurementSummary = newOverallSummary;
  
      // Save the final document (either the updated one or the brand new one)
      const savedReport = await report.save();
  
      res.status(201).json({
        message: "Measurement report saved successfully.",
        data: savedReport
      });
    } catch (error) {
      console.error("Error saving ANF Measurement Report:", error);
      // Check for unique key violation (error code 11000)
      if (error.code === 11000) {
        return res.status(409).json({
          error: "A report with these exact details already exists.",
          details: error.message
        });
      }
      res
        .status(500)
        .json({ error: "Failed to save report.", details: error.message });
    }
};

// --- MODIFIED: Endpoint to update the status of a specific size ---
export const updateReportStatus = async (req, res) => {
  try {
      const { qcID, moNo, color, size, status, inspectionDate } = req.body;
  
      // --- Validation (no change) ---
      if (!inspectionDate || !qcID || !moNo || !color || !size || !status) {
        return res.status(400).json({ error: "Missing required fields." });
      }
      if (!["In Progress", "Completed"].includes(status)) {
        return res.status(400).json({ error: "Invalid status value." });
      }
  
      const sortedColors = [...color].sort();
  
      // --- LOGIC FOR THE NEW PERSISTENT STATUS COLLECTION ---
      if (status === "Completed") {
        // If we are finishing the size, create/update the persistent status record.
        // `findOneAndUpdate` with `upsert` is perfect here.
        await SizeCompletionStatus.findOneAndUpdate(
          { qcID, moNo, color: sortedColors, size },
          { status: "Completed" },
          { upsert: true, new: true, runValidators: true }
        );
      } else if (status === "In Progress") {
        // If we are continuing (unlocking), delete the persistent status record.
        await SizeCompletionStatus.deleteOne({
          qcID,
          moNo,
          color: sortedColors,
          size
        });
      }
  
      // --- KEEP THE LOGIC TO UPDATE THE CURRENT DAY'S REPORT (if it exists) ---
      // This is still useful for the specific report of that day.
      const reportDate = new Date(`${inspectionDate}T00:00:00.000Z`);
      const reportFilter = {
        inspectionDate: reportDate,
        qcID,
        moNo,
        color: { $all: sortedColors, $size: sortedColors.length }
      };
  
      await ANFMeasurementReport.updateOne(
        { ...reportFilter, "measurementDetails.size": size },
        { $set: { "measurementDetails.$.status": status } }
      );
      // Note: We don't care if this update fails (e.g., no report for today yet).
      // The persistent status is the most important part.
  
      res
        .status(200)
        .json({ message: `Size status successfully updated to '${status}'.` });
    } catch (error) {
      console.error("Error updating size status:", error);
      if (error.code === 11000) {
        // Catch potential race condition on unique index
        return res
          .status(409)
          .json({ error: "This size status is already being updated." });
      }
      res
        .status(500)
        .json({ error: "Failed to update size status.", details: error.message });
    }
};

// --- MODIFIED: Endpoint to get existing measurement data and PERSISTENT status ---
export const getReportData = async (req, res) => {
  try {
      const { date, qcId, moNo, color, size } = req.query;
  
      if (!date || !qcId || !moNo || !color || !size) {
        return res
          .status(400)
          .json({ error: "Missing required query parameters." });
      }
  
      const colorArray = (Array.isArray(color) ? color : color.split(",")).sort();
  
      // --- QUERY 1: Check for a PERSISTENT "Completed" status ---
      const persistentStatusDoc = await SizeCompletionStatus.findOne({
        qcID: qcId,
        moNo: moNo,
        color: colorArray,
        size: size
      });
  
      // --- QUERY 2: Get the measurement data FOR THE SPECIFIC DATE provided ---
      let dailyMeasurements = [];
      const reportDate = new Date(`${date}T00:00:00.000Z`);
      const reportFilter = {
        inspectionDate: reportDate,
        qcID: qcId,
        moNo: moNo,
        color: { $all: colorArray, $size: colorArray.length }
      };
      const report = await ANFMeasurementReport.findOne(reportFilter);
  
      if (report) {
        const sizeData = report.measurementDetails.find(
          (detail) => detail.size === size
        );
        if (sizeData && sizeData.sizeMeasurementData) {
          dailyMeasurements = sizeData.sizeMeasurementData;
        }
      }
  
      // --- FINAL LOGIC: Determine the status to send to the frontend ---
      // If a persistent "Completed" record exists, the status is ALWAYS 'Completed'.
      // Otherwise, it's 'In Progress'.
      const finalStatus = persistentStatusDoc ? "Completed" : "In Progress";
  
      // Return the combined result
      res.json({
        measurements: dailyMeasurements,
        status: finalStatus
      });
    } catch (error) {
      console.error("Error fetching existing measurement data:", error);
      res
        .status(500)
        .json({ error: "Failed to fetch existing measurement data." });
    }
};


import {
  SupplierIssueReport,
} from "../MongoDB/dbConnectionController.js";

// NEW: GET an existing report based on key fields
export const getSupplierIssueReport = async (req, res) => {
  try {
      const { reportDate, inspectorId, factoryType, factoryName, moNo, colors } =
        req.query;
  
      if (
        !reportDate ||
        !inspectorId ||
        !factoryType ||
        !factoryName ||
        !moNo ||
        !colors
      ) {
        return res
          .status(400)
          .json({ error: "Missing required query parameters." });
      }
  
      const searchDate = new Date(reportDate);
      searchDate.setUTCHours(0, 0, 0, 0);
  
      const colorArray = Array.isArray(colors) ? colors : colors.split(",");
  
      const filter = {
        reportDate: searchDate,
        inspectorId,
        factoryType,
        factoryName,
        moNo,
        colors: { $all: colorArray, $size: colorArray.length }
      };
  
      const report = await SupplierIssueReport.findOne(filter);
  
      if (!report) {
        return res.status(404).json({ message: "No existing report found." });
      }
  
      res.json(report);
    } catch (error) {
      console.error("Error finding existing report:", error);
      res.status(500).json({ error: "Failed to fetch existing report data." });
    }
};

// UPDATED: POST endpoint now handles creating AND updating (upsert)
export const saveSupplierIssueReport = async (req, res) => {
  try {
      const {
        reportDate,
        inspectorId,
        factoryType,
        factoryName,
        moNo,
        colors,
        ...updateData
      } = req.body;
  
      // Standardize date to midnight UTC for consistent querying
      const searchDate = new Date(reportDate);
      searchDate.setUTCHours(0, 0, 0, 0);
  
      const filter = {
        reportDate: searchDate,
        inspectorId,
        factoryType,
        factoryName,
        moNo,
        // Ensure color array matching is order-agnostic
        colors: { $all: colors.sort(), $size: colors.length }
      };
  
      // Add the sorted colors to the data that will be set
      const finalUpdateData = {
        ...updateData,
        colors: colors.sort(), // Store colors consistently
        reportDate: searchDate // Store standardized date
      };
  
      const options = {
        new: true, // Return the modified document
        upsert: true, // Create a new doc if no match is found
        runValidators: true
      };
  
      const updatedReport = await SupplierIssueReport.findOneAndUpdate(
        filter,
        { $set: finalUpdateData },
        options
      );
  
      res
        .status(200)
        .json({ message: "Report saved successfully", data: updatedReport });
    } catch (error) {
      console.error("Error saving supplier issue report:", error);
      res
        .status(400)
        .json({ error: "Failed to save report.", details: error.message });
    }
};
// --- NEW ENDPOINT 1: Get filtered supplier issue reports ---
export const getSupplierIssueReportSummary = async (req, res) => {
  try {
      const {
        startDate,
        endDate,
        moNos,
        colors,
        qcIds,
        factoryType,
        factoryNames
      } = req.query;
  
      const filter = {};
  
      // 1. Date Range Filter
      if (startDate || endDate) {
        filter.reportDate = {};
        if (startDate) {
          filter.reportDate.$gte = new Date(startDate);
        }
        if (endDate) {
          // To include the whole end day, set to end of day
          const endOfDay = new Date(endDate);
          endOfDay.setUTCHours(23, 59, 59, 999);
          filter.reportDate.$lte = endOfDay;
        }
      }
  
      // 2. Array Filters ($in operator)
      if (moNos) filter.moNo = { $in: moNos.split(",") };
      if (colors) filter.colors = { $in: colors.split(",") };
      if (qcIds) filter.inspectorId = { $in: qcIds.split(",") };
      if (factoryNames) filter.factoryName = { $in: factoryNames.split(",") };
  
      // 3. Single Value Filter
      if (factoryType) filter.factoryType = factoryType;
  
      const reports = await SupplierIssueReport.find(filter)
        .sort({ reportDate: -1, createdAt: -1 })
        .lean();
  
      res.json(reports);
    } catch (error) {
      console.error("Error fetching supplier issue reports summary:", error);
      res.status(500).json({ error: "Failed to fetch report data." });
    }
};

// --- NEW ENDPOINT 2: Get all available options for filters ---
export const getSupplierIssueReportOptions = async (req, res) => {
  try {
      const [moNos, colors, qcIds, factoryTypes, factoryNames] =
        await Promise.all([
          SupplierIssueReport.distinct("moNo"),
          SupplierIssueReport.distinct("colors"),
          SupplierIssueReport.distinct("inspectorId"),
          SupplierIssueReport.distinct("factoryType"),
          SupplierIssueReport.distinct("factoryName")
        ]);
  
      res.json({
        moNos: moNos.sort(),
        colors: colors.sort(),
        qcIds: qcIds.sort(),
        factoryTypes: factoryTypes.sort(),
        factoryNames: factoryNames.sort()
      });
    } catch (error) {
      console.error("Error fetching report filter options:", error);
      res.status(500).json({ error: "Failed to fetch filter options." });
    }
};
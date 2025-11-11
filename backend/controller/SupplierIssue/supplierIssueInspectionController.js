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

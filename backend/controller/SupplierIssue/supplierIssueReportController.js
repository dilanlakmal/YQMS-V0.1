import {
  SupplierIssueReport,
} from "../MongoDB/dbConnectionController.js";

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
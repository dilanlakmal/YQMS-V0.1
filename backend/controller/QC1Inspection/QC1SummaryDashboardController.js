import { QC1SunriseSummary } from "../MongoDB/dbConnectionController.js";

// --- CONTROLLER FUNCTION FOR DYNAMIC FILTER OPTIONS ---
export const getSunriseFilterOptions = async (req, res) => {
  try {
    const { startDate, endDate, lineNo, moNo, buyer } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Start Date and End Date are required." });
    }

    const baseMatch = {
      inspectionDate: {
        $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      }
    };

    // This function will run an aggregation to get distinct values for a field
    // based on the current active filters.
    const getDistinct = async (field, currentFilters) => {
      const matchStage = { ...baseMatch };
      if (currentFilters.lineNo)
        matchStage["daily_full_summary.lineNo"] = currentFilters.lineNo;
      if (currentFilters.moNo)
        matchStage["daily_full_summary.MONo"] = currentFilters.moNo;
      if (currentFilters.buyer)
        matchStage["daily_full_summary.Buyer"] = currentFilters.buyer;

      const result = await QC1SunriseSummary.aggregate([
        { $match: matchStage },
        { $unwind: "$daily_full_summary" },
        { $match: matchStage }, // Match again after unwind for performance
        { $group: { _id: `$daily_full_summary.${field}` } },
        { $sort: { _id: 1 } }
      ]);
      // Filter out null/empty results and return a flat array
      return result.map((r) => r._id).filter(Boolean);
    };

    // Fetch options for each dropdown in parallel, applying the relevant active filters.
    const [lines, mos, buyers] = await Promise.all([
      getDistinct("lineNo", { moNo, buyer }),
      getDistinct("MONo", { lineNo, buyer }),
      getDistinct("Buyer", { lineNo, moNo })
    ]);

    res.status(200).json({ lines, mos, buyers });
  } catch (error) {
    console.error("Error fetching dynamic filter options:", error);
    res.status(500).json({ message: "Server error fetching filter options." });
  }
};

export const getSunriseSummaryData = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Start Date and End Date are required." });
    }

    const matchStage = {
      inspectionDate: {
        $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      }
    };

    const data = await QC1SunriseSummary.find(matchStage)
      .sort({ inspectionDate: 1 })
      .lean();

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching QC1 Summary Dashboard data:", error);
    res.status(500).json({
      message: "Server error fetching dashboard data.",
      error: error.message
    });
  }
};

import { QC1SunriseSummary } from "../MongoDB/dbConnectionController.js";

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
    res
      .status(500)
      .json({
        message: "Server error fetching dashboard data.",
        error: error.message
      });
  }
};

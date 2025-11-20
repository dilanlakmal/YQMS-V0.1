import mongoose from "mongoose";
// import path and model names ---
import { QCWorkers, UserMain } from "../MongoDB/dbConnectionController.js";

// Helper function to map frontend report type to Seq_No
const getSeqNoForReportType = (reportType) => {
  switch (reportType) {
    case "QC1-Inside":
      return 39;
    case "QC1-Outside":
      return 38;
    case "QC2":
      return 54;
    default:
      return null;
  }
};

// --- Endpoint to populate filter dropdowns ---
export const getQcOutputFilters = async (req, res) => {
  try {
    const { startDate, endDate, reportType } = req.query;
    const matchStage = {};

    if (startDate && endDate) {
      matchStage.Inspection_date = {
        $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      };
    }

    const seqNo = getSeqNoForReportType(reportType);
    if (seqNo) {
      matchStage.Seq_No = seqNo;
    }

    // Fetch both QC IDs and Defect Names in parallel ---
    const [qcIds, defectNames] = await Promise.all([
      QCWorkers.distinct("QC_ID", matchStage),
      QCWorkers.distinct(
        "Defect_data_summary.Defect_Details.Defect_name",
        matchStage
      )
    ]);

    res.json({
      qcIds: qcIds.sort(),
      defectNames: defectNames.sort()
    });
  } catch (error) {
    console.error("Error fetching QC Output filter options:", error);
    res.status(500).json({ message: "Server error fetching filter options" });
  }
};

// --- Endpoint to get aggregated data for the main inspection cards ---
export const getQcOutputInspectionData = async (req, res) => {
  try {
    // Destructure new defectNames query parameter ---
    const { startDate, endDate, reportType, qcId, defectNames } = req.query;
    const matchStage = {};

    if (startDate && endDate) {
      matchStage.Inspection_date = {
        $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      };
    }

    const seqNo = getSeqNoForReportType(reportType);
    if (seqNo) {
      matchStage.Seq_No = seqNo;
    }

    if (qcId) {
      matchStage.QC_ID = qcId;
    }

    // Add defect name filtering to the match stage ---
    // The query param will be a comma-separated string, so we split it into an array
    if (defectNames) {
      const defectNamesArray = defectNames.split(",");
      if (defectNamesArray.length > 0) {
        matchStage["Defect_data_summary.Defect_Details.Defect_name"] = {
          $in: defectNamesArray
        };
      }
    }

    // The aggregation pipeline itself doesn't need to change.
    // The initial $match stage now correctly filters for only the documents we need.
    const aggregationResult = await QCWorkers.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$QC_ID",
          totalOutput: { $sum: "$TotalOutput" },
          totalDefect: { $sum: "$TotalDefect" },
          defectSummaries: { $push: "$Defect_data_summary" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "emp_id",
          as: "qcUserDetails"
        }
      },
      {
        $project: {
          _id: 0,
          qcId: "$_id",
          qcName: {
            $ifNull: [{ $arrayElemAt: ["$qcUserDetails.eng_name", 0] }, "$_id"]
          },
          facePhoto: { $arrayElemAt: ["$qcUserDetails.face_photo", 0] },
          totalOutput: 1,
          totalDefect: 1,
          defectSummaries: 1
        }
      }
    ]);

    // Process defects in Node.js for simplicity
    const processedResults = aggregationResult.map((qc) => {
      const defectCounts = {};
      qc.defectSummaries.flat().forEach((summary) => {
        summary.Defect_Details.forEach((detail) => {
          defectCounts[detail.Defect_name] =
            (defectCounts[detail.Defect_name] || 0) + detail.Qty;
        });
      });

      const topDefects = Object.entries(defectCounts)
        .map(([name, qty]) => ({
          defectName: name,
          qty: qty,
          defectRate: qc.totalOutput > 0 ? (qty / qc.totalOutput) * 100 : 0
        }))
        .sort((a, b) => b.qty - a.qty);

      return {
        qcId: qc.qcId,
        qcName: qc.qcName,
        facePhoto: qc.facePhoto,
        totalOutput: qc.totalOutput,
        totalDefect: qc.totalDefect,
        defectRate:
          qc.totalOutput > 0 ? (qc.totalDefect / qc.totalOutput) * 100 : 0,
        topDefects: topDefects
      };
    });

    res.json(processedResults);
  } catch (error) {
    console.error("Error fetching QC Output inspection data:", error);
    res.status(500).json({ message: "Server error fetching data" });
  }
};

// --- Endpoint for the "See More" full report page ---
export const getQcOutputFullReport = async (req, res) => {
  try {
    const { startDate, endDate, reportType, qcId } = req.query;
    const matchStage = {};

    if (!qcId) {
      return res
        .status(400)
        .json({ message: "QC ID is required for full report." });
    }

    if (startDate && endDate) {
      matchStage.Inspection_date = {
        $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      };
    }

    const seqNo = getSeqNoForReportType(reportType);
    if (seqNo) {
      matchStage.Seq_No = seqNo;
    }

    matchStage.QC_ID = qcId;

    // --- model name 'QCWorkers' ---
    const reports = await QCWorkers.find(matchStage)
      .sort({ Inspection_date: 1 })
      .lean();

    // Optionally fetch QC details as well
    const qcDetails = await UserMain.findOne({ emp_id: qcId })
      .select("eng_name")
      .lean();

    res.json({
      reports,
      qcDetails: qcDetails || { eng_name: qcId }
    });
  } catch (error) {
    console.error("Error fetching QC Output full report:", error);
    res.status(500).json({ message: "Server error fetching full report" });
  }
};

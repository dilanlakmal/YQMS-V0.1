import { ymProdConnection } from "../MongoDB/dbConnectionController.js";
import { ObjectId } from "mongodb";

const COLLECTION = "cutting_inline_reports";

export const createCuttingInlineReport = async (req, res) => {
  try {
    const payload = req.body || {};

    // Basic required fields validation
    const required = [
      "inspectionDate",
      "MONO",
      "Color",
      "PlanLayerQty",
      "ActualLayerQty",
      "MackerLength",
      "MackerWidth",
      "MackerNo"
    ];
    const missing = required.filter((k) => payload[k] === undefined || payload[k] === null || payload[k] === "");
    if (missing.length) {
      return res.status(400).json({ success: false, message: `Missing fields: ${missing.join(", ")}` });
    }

    const doc = {
      inspectionDate: new Date(payload.inspectionDate),
      MONO: String(payload.MONO),
      Color: String(payload.Color),
      LotNo: Array.isArray(payload.LotNo) ? payload.LotNo.map(String) : [],
      PlanLayerQty: Number(payload.PlanLayerQty) || 0,
      ActualLayerQty: Number(payload.ActualLayerQty) || 0,
      MackerLength: Number(payload.MackerLength) || 0,
      MackerWidth: Number(payload.MackerWidth) || 0,
      MackerNo: String(payload.MackerNo),
      RelaxingDate: payload.RelaxingDate ? new Date(payload.RelaxingDate) : null,
      SpreadingSpeed: payload.SpreadingSpeed ? String(payload.SpreadingSpeed) : "",
      SpreadingSpeedForward: payload.SpreadingSpeedForward !== undefined && payload.SpreadingSpeedForward !== "" ? Number(payload.SpreadingSpeedForward) : null,
      SpreadingSpeedBackward: payload.SpreadingSpeedBackward !== undefined && payload.SpreadingSpeedBackward !== "" ? Number(payload.SpreadingSpeedBackward) : null,
      SpreadingTension: payload.SpreadingTension ? String(payload.SpreadingTension) : "",
      SpreadingQuality: payload.SpreadingQuality ? String(payload.SpreadingQuality) : "",
      SpreadingQualityDetail: payload.SpreadingQualityDetail ? String(payload.SpreadingQualityDetail) : "",
      StandardRelaxTime: Number(payload.StandardRelaxTime) || 0,
      ResultRelaxation: payload.ResultRelaxation ? String(payload.ResultRelaxation) : "PASS",
      RelaxationLackingHours: payload.RelaxationLackingHours !== undefined ? Number(payload.RelaxationLackingHours) : 0,
      TotalDefectQty: Number(payload.TotalDefectQty) || 0,
      FabricDefectsData: Array.isArray(payload.FabricDefectsData) ? payload.FabricDefectsData : []
    };

    const result = await ymProdConnection.db.collection(COLLECTION).insertOne(doc);

    return res.status(201).json({
      success: true,
      message: "Cutting inline report saved",
      data: { _id: result.insertedId }
    });
  } catch (error) {
    console.error("Error creating cutting inline report:", error);
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

export const getCuttingInlineReports = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const cursor = ymProdConnection.db
      .collection(COLLECTION)
      .find({})
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const [items, total] = await Promise.all([
      cursor.toArray(),
      ymProdConnection.db.collection(COLLECTION).countDocuments({})
    ]);

    return res.status(200).json({
      success: true,
      data: items,
      pagination: {
        currentPage: Number(page),
        itemsPerPage: Number(limit),
        totalItems: total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching cutting inline reports:", error);
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

export const getCuttingInlineReportById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await ymProdConnection.db
      .collection(COLLECTION)
      .findOne({ _id: new ObjectId(id) });

    if (!item) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    return res.status(200).json({ success: true, data: item });
  } catch (error) {
    console.error("Error fetching cutting inline report by id:", error);
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};



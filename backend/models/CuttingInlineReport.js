import mongoose from "mongoose";

const FabricDefectItemSchema = new mongoose.Schema(
  {
    defectName: { type: String, required: true },
    Qty: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const FabricDefectSectionSchema = new mongoose.Schema(
  {
    Name: { type: String, enum: ["T", "M", "B"], required: true },
    defects: { type: [FabricDefectItemSchema], default: [] }
  },
  { _id: false }
);

const CuttingInlineReportSchema = new mongoose.Schema(
  {
    inspectionDate: { type: Date, required: true },
    MONO: { type: String, required: true },
    Color: { type: String, required: true },
    LotNo: { type: [String], default: [] },
    PlanLayerQty: { type: Number, required: true },
    ActualLayerQty: { type: Number, required: true },
    MackerLength: { type: Number, required: true },
    MackerWidth: { type: Number, required: true },
    MackerNo: { type: String, required: true },
    RelaxingDate: { type: Date },
    SpreadingSpeed: { type: String },
    SpreadingSpeedForward: { type: Number, default: null },
    SpreadingSpeedBackward: { type: Number, default: null },
    SpreadingTension: { type: String },
    SpreadingQuality: { type: String },
    SpreadingQualityDetail: { type: String },
    StandardRelaxTime: { type: Number, default: 0 },
    ResultRelaxation: { type: String, enum: ["PASS", "FAIL"], default: "PASS" },
    RelaxationLackingHours: { type: Number, default: 0 },
    TotalDefectQty: { type: Number, default: 0 },
    FabricDefectsData: { type: [FabricDefectSectionSchema], default: [] }
  },
  { timestamps: true }
);

export default function createCuttingInlineReportModel(connection) {
  return connection.model(
    "CuttingInlineReport",
    CuttingInlineReportSchema,
    "cutting_inline_reports"
  );
}



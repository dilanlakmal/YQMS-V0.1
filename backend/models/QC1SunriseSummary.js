import mongoose from "mongoose";

const defectSchema = new mongoose.Schema(
  {
    defectCode: String,
    defectName: String,
    defectQty: Number
  },
  { _id: false }
);

const summaryItemSchema = new mongoose.Schema(
  {
    CheckedQty: Number,
    CheckedQtyT38: Number,
    CheckedQtyT39: Number,
    totalDefectsQty: Number,
    DefectArray: [defectSchema]
  },
  { _id: false }
);

const fullDetailSchema = new mongoose.Schema(
  {
    lineNo: String,
    MONo: String,
    Size: String,
    Color: String,
    Buyer: String,
    CheckedQty: Number,
    CheckedQtyT38: Number,
    CheckedQtyT39: Number,
    totalDefectsQty: Number,
    DefectArray: [defectSchema]
  },
  { _id: false }
);

const lineSummarySchema = new mongoose.Schema(
  {
    lineNo: String,
    ...summaryItemSchema.obj
  },
  { _id: false }
);

const lineMOSummarySchema = new mongoose.Schema(
  {
    lineNo: String,
    MONo: String,
    ...summaryItemSchema.obj
  },
  { _id: false }
);

const moSummarySchema = new mongoose.Schema(
  {
    MONo: String,
    ...summaryItemSchema.obj
  },
  { _id: false }
);

const buyerSummarySchema = new mongoose.Schema(
  {
    Buyer: String,
    ...summaryItemSchema.obj
  },
  { _id: false }
);

const qc1SunriseSummarySchema = new mongoose.Schema(
  {
    inspectionDate: { type: Date, required: true, unique: true },

    // Top-level daily totals
    DailyCheckedQty: { type: Number, default: 0 },
    DailyCheckedQtyT38: { type: Number, default: 0 },
    DailyCheckedQtyT39: { type: Number, default: 0 },
    DailytotalDefectsQty: { type: Number, default: 0 },
    DailyDefectArray: [defectSchema],

    // Granular and aggregated summaries
    daily_full_summary: [fullDetailSchema],
    daily_line_summary: [lineSummarySchema],
    daily_line_MO_summary: [lineMOSummarySchema],
    daily_mo_summary: [moSummarySchema],
    daily_buyer_summary: [buyerSummarySchema]
  },
  { timestamps: true }
);

export default (connection) =>
  connection.model(
    "QC1SunriseSummary",
    qc1SunriseSummarySchema,
    "qc1_sunrise_summaries"
  );

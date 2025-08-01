// import mongoose from "mongoose";

// const DefectCountSchema = new mongoose.Schema(
//   {
//     defectId: { type: mongoose.Schema.Types.ObjectId, ref: "DefectSubSchema" },
//     defectNameEng: { type: String, required: true },
//     qty: { type: Number, required: true, default: 0 }
//   },
//   { _id: false }
// );

// const SupplierIssueReportSchema = new mongoose.Schema(
//   {
//     reportDate: { type: Date, required: true },
//     inspectorId: { type: String, required: true },
//     moNo: { type: String, required: true },
//     colors: { type: [String], required: true },
//     factoryType: { type: String, required: true },
//     factoryName: { type: String, required: true },
//     inspectionStartTime: { type: Date },
//     inspectionEndTime: { type: Date },
//     totalInspectionTimeSeconds: { type: Number, default: 0 },
//     defectCounts: [DefectCountSchema],
//     hourlyQtys: {
//       type: Map,
//       of: Number
//     },
//     totalCheckedQty: { type: Number, default: 0 },
//     totalClaimAmountUSD: { type: Number, default: 0 },
//     totalClaimAmountKHR: { type: Number, default: 0 }
//   },
//   {
//     collection: "supplier_issue_reports",
//     timestamps: true
//   }
// );

// export default (connection) =>
//   connection.model("SupplierIssueReport", SupplierIssueReportSchema);

import mongoose from "mongoose";

// Sub-schema for total defect counts in the session
const TotalDefectCountSchema = new mongoose.Schema(
  {
    no: { type: Number, required: true },
    defectNameEng: { type: String, required: true },
    qty: { type: Number, required: true, default: 0 }
  },
  { _id: false }
);

// Sub-schema for defects within a specific hour
const HourlyDefectSchema = new mongoose.Schema(
  {
    no: { type: Number, required: true },
    defectNameEng: { type: String, required: true },
    qty: { type: Number, required: true, default: 0 }
  },
  { _id: false }
);

// Sub-schema for the hourly breakdown
const DefectCountByHourSchema = new mongoose.Schema(
  {
    hour: { type: Number, required: true },
    defects: [HourlyDefectSchema]
  },
  { _id: false }
);

const SupplierIssueReportSchema = new mongoose.Schema(
  {
    reportDate: { type: Date, required: true },
    inspectorId: { type: String, required: true },
    moNo: { type: String, required: true },
    colors: { type: [String], required: true },
    factoryType: { type: String, required: true },
    factoryName: { type: String, required: true },

    // Timer and quantity data
    totalInspectionTimeSeconds: { type: Number, default: 0 },
    totalInspectionTimeString: { type: String, default: "00:00:00" }, // For display
    defectCounts: [TotalDefectCountSchema], // Overall total defects
    defectCountByHr: [DefectCountByHourSchema], // New hourly breakdown
    totalCheckedQty: { type: Number, default: 0 },

    // Financial data
    totalClaimAmountUSD: { type: Number, default: 0 },
    totalClaimAmountKHR: { type: Number, default: 0 }
  },
  {
    collection: "supplier_issue_reports",
    timestamps: true
  }
);

export default (connection) =>
  connection.model("SupplierIssueReport", SupplierIssueReportSchema);

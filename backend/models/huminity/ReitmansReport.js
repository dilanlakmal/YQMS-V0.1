import mongoose from "mongoose";

const reitmansHistorySchema = new mongoose.Schema(
  {
    top: {
      body: { type: String, default: "" },
      ribs: { type: String, default: "" },
      status: { type: String, default: "" },
    },
    middle: {
      body: { type: String, default: "" },
      ribs: { type: String, default: "" },
      status: { type: String, default: "" },
    },
    bottom: {
      body: { type: String, default: "" },
      ribs: { type: String, default: "" },
      status: { type: String, default: "" },
    },
    images: [
      {
        id: { type: String },
        preview: { type: String }, // Base64 string
        name: { type: String },
        size: { type: Number },
      },
    ],
    generalRemark: { type: String, default: "" },
    saveTime: { type: String, default: "" },
  },
  { _id: false },
);

const reitmansReportSchema = new mongoose.Schema(
  {
    // Reitmans global fields (latest values)
    factoryStyleNo: { type: String, default: "" },
    buyerStyle: { type: String, default: "" },
    customer: { type: String, default: "" },
    poLine: { type: String, default: "" },
    composition: { type: String, default: "" },
    colorName: { type: String, default: "" },
    upperCentisimalIndex: { type: String, default: "" },
    timeChecked: { type: String, default: "" },
    moistureRateBeforeDehumidify: { type: String, default: "" },
    noPcChecked: { type: String, default: "" },
    timeIn: { type: String, default: "" },
    timeOut: { type: String, default: "" },
    moistureRateAfter: { type: String, default: "" },
    date: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Failed", "Passed"],
      default: "Failed",
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved"],
      default: "pending",
    },
    approvedBy: {
      empId: { type: String },
      engName: { type: String },
    },
    approvedAt: { type: Date },
    createdBy: {
      empId: { type: String },
      engName: { type: String },
    },
    updatedBy: {
      empId: { type: String },
      engName: { type: String },
    },
    history: [reitmansHistorySchema],
  },
  {
    collection: "reitmans_reports",
    timestamps: true,
  },
);

reitmansReportSchema.index({ buyerStyle: 1, factoryStyleNo: 1 });
reitmansReportSchema.index({ factoryStyleNo: 1 });
reitmansReportSchema.index({ createdAt: -1 });

export default (connection) =>
  connection.model("ReitmansReport", reitmansReportSchema);

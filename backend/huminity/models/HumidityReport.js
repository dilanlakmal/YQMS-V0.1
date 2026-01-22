import mongoose from "mongoose";

const historySchema = new mongoose.Schema(
  {
    top: {
      body: { type: String, default: "" },
      bodyStatus: { type: String, default: "" },
      ribs: { type: String, default: "" },
      ribsStatus: { type: String, default: "" },
      status: { type: String, default: "" },
    },
    middle: {
      body: { type: String, default: "" },
      bodyStatus: { type: String, default: "" },
      ribs: { type: String, default: "" },
      ribsStatus: { type: String, default: "" },
      status: { type: String, default: "" },
    },
    bottom: {
      body: { type: String, default: "" },
      bodyStatus: { type: String, default: "" },
      ribs: { type: String, default: "" },
      ribsStatus: { type: String, default: "" },
      status: { type: String, default: "" },
    },
    images: [
      {
        id: { type: String },
        preview: { type: String }, // Base64 string
        name: { type: String },
        size: { type: Number }
      }
    ],
    date: { type: String, default: "" },
    beforeDryRoom: { type: String, default: "" },
    afterDryRoom: { type: String, default: "" },
    generalRemark: { type: String, default: "" },
  },
  { _id: false }
);

const humidityReportSchema = new mongoose.Schema(
  {
    buyerStyle: { type: String, default: "" },
    factoryStyleNo: { type: String, default: "" },
    customer: { type: String, default: "" },
    inspectionType: { type: String, default: "Inline" },
    fabrication: { type: String, default: "" },
    aquaboySpecBody: { type: String, default: "" },
    aquaboySpecRibs: { type: String, default: "" },
    colorName: { type: String, default: "" },
    ribsAvailable: { type: Boolean, default: true },
    beforeDryRoom: { type: String, default: "" },
    afterDryRoom: { type: String, default: "" },
    date: { type: String, default: "" },
    history: [historySchema],
    generalRemark: { type: String, default: "" },
    inspectorSignature: { type: String, default: "" },
    qamSignature: { type: String, default: "" },
    status: {
      type: String,
      enum: ['Failed', 'Passed'],
      default: 'Failed'
    },
    createdBy: {
      empId: { type: String },
      engName: { type: String }
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved'],
      default: 'pending'
    },
    approvedBy: {
      empId: { type: String },
      engName: { type: String }
    },
    approvedAt: { type: Date }
  },
  {
    collection: "humidity_reports",
    timestamps: true
  }
);

// Index for faster queries - use composite key of buyerStyle and factoryStyleNo
humidityReportSchema.index({ buyerStyle: 1, factoryStyleNo: 1 });
humidityReportSchema.index({ createdAt: -1 });
humidityReportSchema.index({ customer: 1 });

export default (connection) =>
  connection.model("HumidityReport", humidityReportSchema);

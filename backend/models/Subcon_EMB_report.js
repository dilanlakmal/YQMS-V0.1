import mongoose from "mongoose";

const defectDetailSchema = new mongoose.Schema(
  {
    category: { type: String },
    defectType: { type: String, required: true },
    name: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    count: { type: Number, required: true, min: 1 },
    remarks: { type: String, default: "" },
    image: { type: String, default: "" }
  },
  { _id: false }
);

const MAX_REMARKS_LENGTH = 500;

const subconEMBReportSchema = new mongoose.Schema(
  {
    inspectionType: {
      type: String,
      enum: ["First Output", "Inline Inspection"],
      default: "First Output"
    },
    reportType: {
      type: String,
      enum: ["EMB", "Printing", "EMB + Print"],
      default: "EMB"
    },
    inspectionDate: { type: Date, default: Date.now },
    factoryName: {
      type: String,
      default: ""
    },
    moNo: { type: String, default: "" },
    buyer: { type: String, default: "" },
    buyerStyle: { type: String, default: "" },
    color: { type: [String], default: [] }, // Array of color strings
    skuDescription: { type: String, default: "" },
    skuNumber: { type: [String], default: [] }, // Array of SKU strings
    totalOrderQty: { type: Number, default: 0 },
    totalPcs: { type: Number, default: 0 },

    // EMB Details (only when reportType is "EMB" or "EMB + Print")
    embDetails: {
      speed: { type: Number, default: null },
      stitch: { type: Number, default: null },
      needleSize: { type: Number, default: null }
    },

    // Printing Details (only when reportType is "Printing" or "EMB + Print")
    printingDetails: {
      method: { type: String, default: "" }, // "manual" or "auto"
      curing: { type: String, default: "" }  // "Time" or "Pressure"
    },

    aqlData: {
      type: { type: String, default: "General" },
      level: { type: String, default: "II" },
      sampleSizeLetterCode: { type: String, default: "" },
      sampleSize: { type: Number, default: 0 },
      acceptDefect: { type: Number, default: 0 },
      rejectDefect: { type: Number, default: 0 }
    },

    defectsQty: { type: Number, default: 0 },
    defectRate: { type: Number, default: 0 },
    result: {
      type: String,
      enum: ["Pass", "Reject", "Pending"],
      default: "Pending"
    },
    defects: [defectDetailSchema],

    // Conclusion fields
    packingResult: {
      type: String,
      enum: ["Pass", "Fail", "N/A"],
      default: "N/A"
    },
    workmanshipResult: {
      type: String,
      enum: ["Pass", "Fail", "N/A"],
      default: "N/A"
    },
    qualityPlanResult: {
      type: String,
      enum: ["Pass", "Fail", "N/A"],
      default: "N/A"
    },

    remarks: { type: String, default: "NA", maxlength: MAX_REMARKS_LENGTH },
    checklist: { type: mongoose.Schema.Types.Mixed, default: {} },
    photos: { type: mongoose.Schema.Types.Mixed, default: {} },

    inspector: { type: String, default: "" },
    inspectionTime: { type: String }
  },
  {
    timestamps: true,
    collection: "subcon_emb_reports"
  }
);

subconEMBReportSchema.index(
  {
    reportType: 1,
    inspectionDate: 1,
    factoryName: 1,
    moNo: 1,
    color: 1
  },
  { unique: false }
);

subconEMBReportSchema.pre("save", function (next) {
  try {
    if (this.remarks && this.remarks.trim() === "") {
      this.remarks = "NA";
    }
    
    // Calculate defectsQty from defects array
    if (this.defects && Array.isArray(this.defects)) {
      this.defectsQty = this.defects.reduce((sum, defect) => {
        return sum + (Number(defect.qty) || Number(defect.count) || 0);
      }, 0);
    } else {
      this.defectsQty = this.defectsQty || 0;
    }

    // Calculate defect rate
    if (this.aqlData && this.aqlData.sampleSize > 0) {
      this.defectRate = parseFloat(((this.defectsQty / this.aqlData.sampleSize) * 100).toFixed(2));
    } else {
      this.defectRate = this.defectRate || 0;
    }

    // Determine result based on AQL and defects
    if (
      this.aqlData &&
      this.aqlData.acceptDefect !== null &&
      this.aqlData.acceptDefect !== undefined &&
      this.aqlData.sampleSize > 0
    ) {
      this.result = this.defectsQty <= this.aqlData.acceptDefect ? "Pass" : "Reject";
    } else if (this.aqlData && this.aqlData.sampleSize === 0) {
      this.result = this.defectsQty === 0 ? "Pass" : "Reject";
    } else {
      this.result = this.result || (this.defectsQty === 0 ? "Pass" : "Pending");
    }
    
    next();
  } catch (error) {
    console.error("Error in pre-save hook:", error);
    next(error);
  }
});

export default function createSubconEMBReportModel(connection) {
  return connection.model("SubconEMBReport", subconEMBReportSchema);
}

import mongoose from "mongoose";

const defectDetailSchema = new mongoose.Schema(
  {
    no: { type: Number, required: true },
    defectNameEng: { type: String, required: true },
    count: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

// Define MAX_REMARKS_LENGTH if not already globally available
const MAX_REMARKS_LENGTH = 250;

const htInspectionReportSchema = new mongoose.Schema(
  {
    inspectionDate: { type: Date, required: true },
    machineNo: { type: String, required: true },
    moNo: { type: String, required: true },
    buyer: { type: String },
    buyerStyle: { type: String },
    color: { type: String, required: true },
    batchNo: { type: String, required: true, match: /^[0-9]{3}$/ },

    // New fields for Table No and Layers
    tableNo: { type: String, required: true }, // From CutPanelOrders
    actualLayers: { type: Number, required: true, min: 1 }, // From CutPanelOrders or user input

    totalBundle: { type: Number, required: true, min: 1 },
    totalPcs: { type: Number, required: true, min: 1 }, // Lot Size, can be auto-calculated then edited

    aqlData: {
      type: { type: String, required: true, default: "General" },
      level: { type: String, required: true, default: "II" },
      sampleSizeLetterCode: { type: String, required: true },
      sampleSize: { type: Number, required: true },
      acceptDefect: { type: Number, required: true },
      rejectDefect: { type: Number, required: true }
    },

    defectsQty: { type: Number, required: true, default: 0 },
    result: {
      type: String,
      enum: ["Pass", "Reject", "Pending"],
      required: true
    },
    defects: [defectDetailSchema],

    remarks: { type: String, default: "NA", maxlength: MAX_REMARKS_LENGTH }, // Ensure MAX_REMARKS_LENGTH is defined or use a number
    defectImageUrl: { type: String, default: null },

    emp_id: { type: String, required: true },
    emp_kh_name: { type: String },
    emp_eng_name: { type: String },
    emp_dept_name: { type: String },
    emp_sect_name: { type: String },
    emp_job_title: { type: String },
    inspectionTime: { type: String }
  },
  {
    timestamps: true,
    collection: "ht_inspection_reports"
    // Consider unique index:
    // index: { inspectionDate: 1, machineNo: 1, moNo: 1, color: 1, batchNo: 1, tableNo: 1, unique: true }
  }
);

htInspectionReportSchema.pre("save", function (next) {
  if (this.remarks && this.remarks.trim() === "") {
    this.remarks = "NA";
  }
  if (this.isNew || this.isModified("defects")) {
    this.defectsQty = this.defects.reduce(
      (sum, defect) => sum + defect.count,
      0
    );
  }
  next();
});

export default function createHTInspectionReportModel(connection) {
  return connection.model("HTInspectionReport", htInspectionReportSchema);
}

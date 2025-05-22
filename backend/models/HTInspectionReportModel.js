import mongoose from "mongoose";

const defectDetailSchema = new mongoose.Schema(
  {
    no: { type: Number, required: true }, // From sccdefects collection
    defectNameEng: { type: String, required: true }, // Storing for easier display if needed
    count: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const htInspectionReportSchema = new mongoose.Schema(
  {
    inspectionDate: { type: Date, required: true },
    machineNo: { type: String, required: true },
    moNo: { type: String, required: true },
    buyer: { type: String },
    buyerStyle: { type: String },
    color: { type: String, required: true },
    batchNo: { type: String, required: true, match: /^[0-9]{3}$/ }, // Validate 3 digits

    totalBundle: { type: Number, required: true, min: 1 },
    totalPcs: { type: Number, required: true, min: 1 }, // This is Lot Size for AQL

    aqlData: {
      // Storing the AQL parameters used for this inspection
      type: { type: String, required: true, default: "General" },
      level: { type: String, required: true, default: "II" },
      sampleSizeLetterCode: { type: String, required: true },
      sampleSize: { type: Number, required: true }, // Total Inspected Qty
      acceptDefect: { type: Number, required: true },
      rejectDefect: { type: Number, required: true }
    },

    defectsQty: { type: Number, required: true, default: 0 }, // Sum of counts from defects array
    result: {
      type: String,
      enum: ["Pass", "Reject", "Pending"],
      required: true
    },
    defects: [defectDetailSchema], // Array of recorded defects

    remarks: { type: String, default: "NA", maxlength: 250 },
    defectImageUrl: { type: String, default: null }, // URL of the uploaded image
    // Storing filename if needed for deletion or management, otherwise URL is often enough
    // defectImageFilename: { type: String, default: null },

    emp_id: { type: String, required: true },
    emp_kh_name: { type: String },
    emp_eng_name: { type: String },
    emp_dept_name: { type: String },
    emp_sect_name: { type: String },
    emp_job_title: { type: String },
    inspectionTime: { type: String } // HH:MM:SS of submission
  },
  {
    timestamps: true,
    collection: "ht_inspection_reports"
    // Consider a unique compound index if one report per date/machine/mo/color/batch is desired
    // index: { inspectionDate: 1, machineNo: 1, moNo: 1, color: 1, batchNo: 1, unique: true }
  }
);

// Pre-save hook to ensure remarks is "NA" if empty
htInspectionReportSchema.pre("save", function (next) {
  if (this.remarks && this.remarks.trim() === "") {
    this.remarks = "NA";
  }
  // Calculate defectsQty automatically if not already set (though frontend should do it)
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

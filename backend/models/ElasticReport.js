import mongoose from "mongoose";

// Define the OperatorData sub-schema (reusable)
const operatorDataSchema = new mongoose.Schema(
  {
    emp_id: { type: String, required: true },
    emp_eng_name: { type: String, default: "N/A" },
    emp_face_photo: { type: String, default: null },
    emp_reference_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Assumes your User model is named "User"
      required: true
    }
  },
  { _id: false } // No separate _id for this sub-document
);

// Define the Defect sub-schema for the elastic report
const elasticDefectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g., "Broken Stich", "Dirty"
    qty: { type: Number, required: true, default: 0 }
  },
  { _id: false }
);

const elasticInspectionSlotSchema = new mongoose.Schema(
  {
    inspectionNo: { type: Number, required: true },
    timeSlotKey: { type: String, required: true },

    checkedQty: { type: Number, default: 20 },
    measurement: { type: String, enum: ["Pass", "Reject"], default: "Pass" },

    // 'defects' field is now 'qualityIssue'
    qualityIssue: { type: String, enum: ["Pass", "Reject"], default: "Pass" },

    // New fields for defect details
    defectDetails: [elasticDefectSchema],
    totalDefectQty: { type: Number, default: 0 },
    defectRate: { type: Number, default: 0 }, // Stored as a decimal, e.g., 0.05 for 5%

    result: { type: String, enum: ["Pass", "Reject"], default: "Pass" },
    remarks: { type: String, trim: true, default: "" },

    isUserModified: { type: Boolean, default: false },
    inspectionTimestamp: { type: Date, default: Date.now },
    emp_id: { type: String }
  },
  { _id: false }
);

const elasticReportSchema = new mongoose.Schema(
  {
    inspectionDate: { type: String, required: true },
    machineNo: {
      type: String,
      required: true,
      enum: ["1", "2", "3", "4", "5"]
    },
    moNo: { type: String, required: true },
    buyer: { type: String },
    buyerStyle: { type: String },
    color: { type: String, required: true },

    operatorData: { type: operatorDataSchema, required: false }, // <-- ADDED

    registeredBy_emp_id: { type: String },
    registeredBy_emp_kh_name: { type: String },
    registeredBy_emp_eng_name: { type: String },
    registrationTime: { type: String },

    inspections: [elasticInspectionSlotSchema]
  },
  {
    timestamps: true,
    index: {
      inspectionDate: 1,
      machineNo: 1,
      moNo: 1,
      color: 1,
      unique: true
    }
  }
);

elasticReportSchema.pre("save", function (next) {
  if (this.inspections && this.inspections.length > 0) {
    this.inspections.sort(
      (a, b) => (a.inspectionNo || 0) - (b.inspectionNo || 0)
    );
  }
  next();
});

export default function createElasticReportModel(connection) {
  return connection.model(
    "ElasticReport",
    elasticReportSchema,
    "scc_elastic_reports"
  );
}

import mongoose from "mongoose";

const elasticInspectionSlotSchema = new mongoose.Schema(
  {
    inspectionNo: { type: Number, required: true }, // From TIME_SLOTS_CONFIG_ELASTIC
    timeSlotKey: { type: String, required: true }, // e.g., "07:00"

    checkedQty: { type: Number, default: 20 },
    quantityIssue: { type: String, enum: ["Pass", "Reject"], default: "Pass" },
    measurement: { type: String, enum: ["Pass", "Reject"], default: "Pass" },
    defects: { type: String, enum: ["Pass", "Reject"], default: "Pass" },
    specificDefectReason: { type: String, default: "" },
    result: { type: String, enum: ["Pass", "Reject"], default: "Pass" },
    remarks: { type: String, trim: true, default: "" },

    isUserModified: { type: Boolean, default: false }, // To track if user has interacted with this slot
    inspectionTimestamp: { type: Date, default: Date.now },
    emp_id: { type: String } // Employee who submitted this slot
  },
  { _id: false }
);

const elasticReportSchema = new mongoose.Schema(
  {
    inspectionDate: { type: String, required: true }, // Store as YYYY-MM-DD
    machineNo: {
      type: String,
      required: true,
      enum: ["1", "2", "3", "4", "5"]
    },
    moNo: { type: String, required: true },
    buyer: { type: String },
    buyerStyle: { type: String },
    color: { type: String, required: true },

    registeredBy_emp_id: { type: String },
    registeredBy_emp_kh_name: { type: String },
    registeredBy_emp_eng_name: { type: String },
    registrationTime: { type: String }, // HH:MM:SS

    inspections: [elasticInspectionSlotSchema]
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    // Unique compound index for a given day, machine, MO, and color
    // This ensures only one document exists for these combined keys.
    // Individual time slots are handled within the 'inspections' array.
    index: {
      inspectionDate: 1,
      machineNo: 1,
      moNo: 1,
      color: 1,
      unique: true
    }
  }
);

// Sort inspections by inspectionNo before saving
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
    "scc_elastic_reports" // Collection name
  );
}

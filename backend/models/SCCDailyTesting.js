import mongoose from "mongoose";

// New schema for parameter adjustment records
const parameterAdjustmentRecordSchema = new mongoose.Schema(
  {
    rejectionNo: { type: Number, required: true },
    adjustedTempC: { type: Number, default: null },
    adjustedTimeSec: { type: Number, default: null },
    adjustedPressure: { type: Number, default: null } // Storing as Number
  },
  { _id: false }
);

const sccDailyTestingSchema = new mongoose.Schema(
  {
    inspectionDate: { type: String, required: true }, // Format: MM/DD/YYYY
    moNo: { type: String, required: true },
    buyer: { type: String, required: false },
    buyerStyle: { type: String, required: false },
    color: { type: String, required: true },
    machineNo: { type: String, required: true },
    standardSpecifications: {
      tempC: { type: Number, default: null },
      timeSec: { type: Number, default: null },
      pressure: { type: Number, default: null } // Changed to Number
    },
    // cycleWashingResults: [cycleResultSchema], // Removed
    numberOfRejections: { type: Number, default: 0, min: 0 }, // Ensure non-negative
    parameterAdjustmentRecords: [parameterAdjustmentRecordSchema], // New field
    finalResult: {
      type: String,
      enum: ["Pass", "Reject", "Pending"],
      default: "Pending"
    },
    remarks: { type: String, maxLength: 150, default: "NA" },
    afterWashImage: { type: String, default: null },
    emp_id: { type: String, required: true },
    emp_kh_name: { type: String, default: "N/A" },
    emp_eng_name: { type: String, default: "N/A" },
    emp_dept_name: { type: String, default: "N/A" },
    emp_sect_name: { type: String, default: "N/A" },
    emp_job_title: { type: String, default: "N/A" },
    inspectionTime: { type: String, required: true }
  },
  {
    timestamps: true,
    collection: "scc_daily_testings"
  }
);

sccDailyTestingSchema.index(
  { moNo: 1, color: 1, machineNo: 1, inspectionDate: 1 },
  { unique: true }
);

export default (connection) =>
  connection.model("SCCDailyTesting", sccDailyTestingSchema);

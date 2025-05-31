import mongoose from "mongoose";

const inspectionSlotSchema = new mongoose.Schema(
  {
    inspectionNo: { type: Number, required: true },
    timeSlotKey: { type: String, required: true },

    temp_req: { type: Number, default: null },
    temp_actual: { type: Number, default: null },
    temp_status: { type: String, default: "pending" },
    temp_isUserModified: { type: Boolean, default: false },
    temp_isNA: { type: Boolean, default: false },

    time_req: { type: Number, default: null },
    time_actual: { type: Number, default: null },
    time_status: { type: String, default: "pending" },
    time_isUserModified: { type: Boolean, default: false },
    time_isNA: { type: Boolean, default: false },

    pressure_req: { type: Number, default: null }, // Changed to Number
    pressure_actual: { type: Number, default: null }, // Changed to Number
    pressure_status: { type: String, default: "pending" },
    pressure_isUserModified: { type: Boolean, default: false },
    pressure_isNA: { type: Boolean, default: false },

    inspectionTimestamp: { type: Date, default: Date.now }
  },
  { _id: false }
);

const dailyTestingHTFUSchema = new mongoose.Schema(
  {
    inspectionDate: { type: String, required: true },
    machineNo: { type: String, required: true },
    moNo: { type: String, required: true },
    buyer: { type: String },
    buyerStyle: { type: String },
    color: { type: String, required: true },

    emp_id: { type: String },
    emp_kh_name: { type: String },
    emp_eng_name: { type: String },
    emp_dept_name: { type: String },
    emp_sect_name: { type: String },
    emp_job_title: { type: String },
    inspectionTime: { type: String },

    baseReqTemp: { type: Number, default: null },
    baseReqTime: { type: Number, default: null },
    baseReqPressure: { type: Number, default: null }, // Changed to Number

    inspections: [inspectionSlotSchema],

    stretchTestResult: {
      type: String,
      enum: ["Pass", "Reject", "Pending", null],
      default: "Pending"
    },
    stretchTestRejectReasons: [{ type: String }], // New field: Array of strings
    washingTestResult: {
      type: String,
      enum: ["Pass", "Reject", "Pending", null],
      default: "Pending"
    },
    isStretchWashingTestDone: { type: Boolean, default: false }
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

dailyTestingHTFUSchema.pre("save", function (next) {
  if (this.inspections && this.inspections.length > 0) {
    this.inspections.sort(
      (a, b) => (a.inspectionNo || 0) - (b.inspectionNo || 0)
    );
  }
  // Ensure stretchTestRejectReasons is empty if not 'Reject'
  if (this.stretchTestResult !== "Reject") {
    this.stretchTestRejectReasons = [];
  }
  next();
});

export default function createDailyTestingHTFUtModel(connection) {
  return connection.model(
    "DailyTestingHTFU",
    dailyTestingHTFUSchema,
    "daily_testing_ht_fus"
  );
}

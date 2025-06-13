import mongoose from "mongoose";

// Define the OperatorData sub-schema (if not imported from a shared file)
const operatorDataSchema = new mongoose.Schema(
  {
    emp_id: { type: String, required: true },
    emp_eng_name: { type: String, default: "N/A" },
    emp_face_photo: { type: String, default: null },
    emp_reference_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Assuming your User model is named "User"
      required: true
    }
  },
  { _id: false }
);

const inspectionSlotFUQCSchema = new mongoose.Schema(
  {
    inspectionNo: { type: Number, required: true },
    timeSlotKey: { type: String, required: true },
    temp_req: { type: Number, default: null },
    temp_actual: { type: Number, default: null },
    temp_isNA: { type: Boolean, default: false },
    result_temp: {
      // Result for Temperature
      type: String,
      enum: ["Pass", "Reject", "Pending", "N/A"],
      default: "Pending"
    },

    time_req: { type: Number, default: null }, // Added for Time
    time_actual: { type: Number, default: null }, // Added for Time
    time_isNA: { type: Boolean, default: false }, // Added for Time
    result_time: {
      // Result for Time
      type: String,
      enum: ["Pass", "Reject", "Pending", "N/A"],
      default: "Pending"
    },

    final_result_slot: {
      // Overall result for this slot based on temp and time
      type: String,
      enum: ["Pass", "Reject", "Pending", "N/A"],
      default: "Pending"
    },

    inspectionTimestamp: { type: Date, default: Date.now }
  },
  { _id: false }
);

const dailyTestingFUQCSchema = new mongoose.Schema(
  {
    inspectionDate: { type: String, required: true },
    machineNo: {
      type: String,
      required: true,
      enum: ["001", "002", "003", "004", "005"]
    },
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
    temp_offset: { type: Number, default: 5 }, // New: Temperature offset for FUQC
    operatorData: { type: operatorDataSchema, required: false },
    inspections: [inspectionSlotFUQCSchema],
    remarks: { type: String, default: "NA" }
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

dailyTestingFUQCSchema.pre("save", function (next) {
  if (this.inspections && this.inspections.length > 0) {
    this.inspections.sort(
      (a, b) => (a.inspectionNo || 0) - (b.inspectionNo || 0)
    );
  }
  if (this.remarks && this.remarks.trim() === "") {
    this.remarks = "NA";
  }
  this.inspections.forEach((insp) => {
    if (insp.temp_isNA) {
      insp.result = "N/A";
    }
  });
  next();
});

export default function createDailyTestingFUQCModel(connection) {
  return connection.model(
    "DailyTestingFUQC",
    dailyTestingFUQCSchema,
    "daily_testing_fu_qc"
  );
}

import mongoose from "mongoose";

const inspectionSlotFUQCSchema = new mongoose.Schema(
  {
    inspectionNo: { type: Number, required: true },
    timeSlotKey: { type: String, required: true },
    temp_req: { type: Number, default: null },
    temp_actual: { type: Number, default: null }, // Added
    temp_isNA: { type: Boolean, default: false }, // Added
    result: {
      type: String,
      enum: ["Pass", "Reject", "Pending", "N/A"], // Added "N/A" for result if temp isNA
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
  // Ensure result is "N/A" if temp_isNA is true for any inspection slot
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

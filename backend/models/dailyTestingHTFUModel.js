// import mongoose from "mongoose";

// const inspectionSlotSchema = new mongoose.Schema(
//   {
//     inspectionNo: { type: Number, required: true }, // 1 for 07:00, 2 for 09:00 etc.
//     timeSlotKey: { type: String, required: true }, // "07:00", "09:00", "12:00", "14:00", "16:00", "18:00"

//     temp_req: { type: Number, default: null },
//     temp_actual: { type: Number, default: null },
//     temp_status: { type: String, default: "pending" }, // e.g., 'pending', 'ok', 'low', 'high', 'na'
//     temp_isUserModified: { type: Boolean, default: false },
//     temp_isNA: { type: Boolean, default: false }, // Tracks if eye icon was used for N/A

//     time_req: { type: Number, default: null },
//     time_actual: { type: Number, default: null },
//     time_status: { type: String, default: "pending" },
//     time_isUserModified: { type: Boolean, default: false },
//     time_isNA: { type: Boolean, default: false },

//     pressure_req: { type: String, default: null }, // Can be string like "4 Bar" or number
//     pressure_actual: { type: String, default: null },
//     pressure_status: { type: String, default: "pending" },
//     pressure_isUserModified: { type: Boolean, default: false },
//     pressure_isNA: { type: Boolean, default: false },

//     inspectionTimestamp: { type: Date, default: Date.now }
//   },
//   { _id: false }
// ); // _id: false for subdocuments if not needed directly

// const dailyTestingHTFUSchema = new mongoose.Schema(
//   {
//     inspectionDate: { type: String, required: true }, // MM/DD/YYYY
//     machineNo: { type: String, required: true },
//     moNo: { type: String, required: true },
//     buyer: { type: String },
//     buyerStyle: { type: String },
//     color: { type: String, required: true },

//     emp_id: { type: String },
//     emp_kh_name: { type: String },
//     emp_eng_name: { type: String },
//     emp_dept_name: { type: String },
//     emp_sect_name: { type: String },
//     emp_job_title: { type: String },
//     inspectionTime: { type: String }, // HH:MM:SS of last submission

//     // Store the base required values fetched from First Output
//     baseReqTemp: { type: Number, default: null },
//     baseReqTime: { type: Number, default: null },
//     baseReqPressure: { type: String, default: null }, // Store as string as it might be "4 Bar"

//     inspections: [inspectionSlotSchema], // Array for each inspection point (time slot)

//     stretchTestResult: {
//       type: String,
//       enum: ["Pass", "Reject", "Pending", null],
//       default: "Pending"
//     },
//     washingTestResult: {
//       type: String,
//       enum: ["Pass", "Reject", "Pending", null],
//       default: "Pending"
//     },
//     isStretchWashingTestDone: { type: Boolean, default: false } // To track if these were set once
//   },
//   {
//     timestamps: true, // Adds createdAt and updatedAt
//     // Unique compound index to ensure one record per day, machine, MO, color
//     // Mongoose will create this index in MongoDB
//     index: {
//       inspectionDate: 1,
//       machineNo: 1,
//       moNo: 1,
//       color: 1,
//       unique: true
//     }
//   }
// );

// // Pre-save hook to ensure inspections are sorted by inspectionNo
// dailyTestingHTFUSchema.pre("save", function (next) {
//   if (this.inspections && this.inspections.length > 0) {
//     this.inspections.sort(
//       (a, b) => (a.inspectionNo || 0) - (b.inspectionNo || 0)
//     );
//   }
//   next();
// });

// export default function createDailyTestingHTFUtModel(connection) {
//   return connection.model(
//     "DailyTestingHTFU",
//     dailyTestingHTFUSchema,
//     "daily_testing_ht_fus"
//   );
// }

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

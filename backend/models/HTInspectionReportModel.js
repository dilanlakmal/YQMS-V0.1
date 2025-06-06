// import mongoose from "mongoose";

// const defectDetailSchema = new mongoose.Schema(
//   {
//     no: { type: Number, required: true },
//     defectNameEng: { type: String, required: true },
//     count: { type: Number, required: true, min: 1 }
//   },
//   { _id: false }
// );

// // Define MAX_REMARKS_LENGTH if not already globally available
// const MAX_REMARKS_LENGTH = 250;

// const htInspectionReportSchema = new mongoose.Schema(
//   {
//     inspectionDate: { type: Date, required: true },
//     machineNo: { type: String, required: true },
//     moNo: { type: String, required: true },
//     buyer: { type: String },
//     buyerStyle: { type: String },
//     color: { type: String, required: true },
//     batchNo: { type: String, required: true, match: /^[0-9]{3}$/ },

//     // New fields for Table No and Layers
//     tableNo: { type: String, required: true }, // From CutPanelOrders
//     actualLayers: { type: Number, required: true, min: 1 }, // From CutPanelOrders or user input

//     totalBundle: { type: Number, required: true, min: 1 },
//     totalPcs: { type: Number, required: true, min: 1 }, // Lot Size, can be auto-calculated then edited

//     aqlData: {
//       type: { type: String, required: true, default: "General" },
//       level: { type: String, required: true, default: "II" },
//       sampleSizeLetterCode: { type: String, required: true },
//       sampleSize: { type: Number, required: true },
//       acceptDefect: { type: Number, required: true },
//       rejectDefect: { type: Number, required: true }
//     },

//     defectsQty: { type: Number, required: true, default: 0 },
//     result: {
//       type: String,
//       enum: ["Pass", "Reject", "Pending"],
//       required: true
//     },
//     defects: [defectDetailSchema],

//     remarks: { type: String, default: "NA", maxlength: MAX_REMARKS_LENGTH }, // Ensure MAX_REMARKS_LENGTH is defined or use a number
//     defectImageUrl: { type: String, default: null },

//     emp_id: { type: String, required: true },
//     emp_kh_name: { type: String },
//     emp_eng_name: { type: String },
//     emp_dept_name: { type: String },
//     emp_sect_name: { type: String },
//     emp_job_title: { type: String },
//     inspectionTime: { type: String }
//   },
//   {
//     timestamps: true,
//     collection: "ht_inspection_reports"
//     // Consider unique index:
//     // index: { inspectionDate: 1, machineNo: 1, moNo: 1, color: 1, batchNo: 1, tableNo: 1, unique: true }
//   }
// );

// htInspectionReportSchema.pre("save", function (next) {
//   if (this.remarks && this.remarks.trim() === "") {
//     this.remarks = "NA";
//   }
//   if (this.isNew || this.isModified("defects")) {
//     this.defectsQty = this.defects.reduce(
//       (sum, defect) => sum + defect.count,
//       0
//     );
//   }
//   next();
// });

// export default function createHTInspectionReportModel(connection) {
//   return connection.model("HTInspectionReport", htInspectionReportSchema);
// }

import mongoose from "mongoose";

const defectDetailSchema = new mongoose.Schema(
  {
    no: { type: Number, required: true },
    defectNameEng: { type: String, required: true },
    defectNameKhmer: { type: String, required: false }, // Making optional if not always present
    defectNameChinese: { type: String, required: false }, // Making optional if not always present
    count: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

// Define the OperatorData sub-schema
const operatorDataSchema = new mongoose.Schema(
  {
    emp_id: { type: String, required: true },
    emp_eng_name: { type: String, default: "N/A" },
    emp_face_photo: { type: String, default: null },
    emp_reference_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", //User model is named "User"
      required: true
    }
  },
  { _id: false } // No separate _id for this sub-document
);

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

    operatorData: { type: operatorDataSchema, required: false },

    tableNo: { type: String, required: true },
    actualLayers: { type: Number, required: true, min: 1 },

    totalBundle: { type: Number, required: true, min: 1 },
    totalPcs: { type: Number, required: true, min: 1 }, // Lot Size

    aqlData: {
      type: { type: String, required: true, default: "General" },
      level: { type: String, required: true, default: "II" },
      sampleSizeLetterCode: { type: String, required: false }, // Can be empty if not found
      sampleSize: { type: Number, required: true, min: 0 }, // Sample size can be 0 if lot size is too small
      acceptDefect: { type: Number, required: true, min: 0 },
      rejectDefect: { type: Number, required: true, min: 0 }
    },

    defectsQty: { type: Number, required: true, default: 0 },
    defectRate: { type: Number, default: 0 },
    result: {
      type: String,
      enum: ["Pass", "Reject", "Pending"],
      required: true,
      default: "Pending"
    },
    defects: [defectDetailSchema],

    remarks: { type: String, default: "NA", maxlength: MAX_REMARKS_LENGTH },
    defectImageUrl: { type: String, default: null },

    emp_id: { type: String, required: true }, // Inspector's emp_id
    emp_kh_name: { type: String },
    emp_eng_name: { type: String },
    emp_dept_name: { type: String },
    emp_sect_name: { type: String },
    emp_job_title: { type: String },
    inspectionTime: { type: String } // Time of inspection submission
  },
  {
    timestamps: true, // Adds createdAt, updatedAt
    collection: "ht_inspection_reports"
    // Consider unique index for critical fields that define a unique report
    // index: { inspectionDate: 1, machineNo: 1, moNo: 1, color: 1, batchNo: 1, tableNo: 1, unique: true }
  }
);

htInspectionReportSchema.index(
  {
    inspectionDate: 1,
    machineNo: 1,
    moNo: 1,
    color: 1,
    batchNo: 1,
    tableNo: 1
  },
  { unique: true, collation: { locale: "en", strength: 2 } } // Case insensitive for string parts if needed
);

htInspectionReportSchema.pre("save", function (next) {
  if (this.remarks && this.remarks.trim() === "") {
    this.remarks = "NA";
  }
  // Calculate defectsQty
  this.defectsQty = this.defects.reduce((sum, defect) => sum + defect.count, 0);

  // Calculate defectRate
  if (this.aqlData && this.aqlData.sampleSize && this.aqlData.sampleSize > 0) {
    const rawRate = this.defectsQty / this.aqlData.sampleSize;
    // Round to 4 decimal places for storage (e.g., 0.0525 for 5.25%)
    this.defectRate = parseFloat(rawRate.toFixed(4));
  } else {
    this.defectRate = 0;
  }

  // Determine result based on AQL (this logic might already be in frontend, but good to have in backend too)
  if (
    this.aqlData &&
    this.aqlData.acceptDefect !== null &&
    this.aqlData.sampleSize > 0
  ) {
    this.result =
      this.defectsQty <= this.aqlData.acceptDefect ? "Pass" : "Reject";
  } else if (this.aqlData && this.aqlData.sampleSize === 0) {
    // If sample size is 0, it's often auto-pass if no defects
    this.result = this.defectsQty === 0 ? "Pass" : "Reject";
  } else {
    this.result = "Pending"; // If AQL data is incomplete
  }
  next();
});

// Before an update, re-calculate derived fields if defects or AQL data changed
htInspectionReportSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  let defectsQty;
  let sampleSize;

  // Determine defectsQty
  if (update.$set && update.$set.defects) {
    // if defects array is being fully replaced
    defectsQty = update.$set.defects.reduce(
      (sum, defect) => sum + defect.count,
      0
    );
    update.$set.defectsQty = defectsQty;
  } else if (update.defects) {
    // For direct set of defects (less common with $set)
    defectsQty = update.defects.reduce((sum, defect) => sum + defect.count, 0);
    update.defectsQty = defectsQty;
  }
  // If defectsQty is not being set by the update, we might need to fetch the document to calculate it.
  // This can get complex if only individual defect items are pushed/pulled.
  // For simplicity, we assume the full defects array or defectsQty is provided on update, or rely on frontend to send correct defectsQty.

  // Determine sampleSize
  if (update.$set && update.$set["aqlData.sampleSize"]) {
    sampleSize = update.$set["aqlData.sampleSize"];
  } else if (update["aqlData.sampleSize"]) {
    sampleSize = update["aqlData.sampleSize"];
  } else if (
    this.getQuery &&
    this.getQuery().aqlData &&
    this.getQuery().aqlData.sampleSize
  ) {
    // This might not always be reliable depending on update query structure
    sampleSize = this.getQuery().aqlData.sampleSize;
  }

  // Recalculate defectRate if relevant fields are present
  const currentDefectsQty =
    update.$set && update.$set.defectsQty !== undefined
      ? update.$set.defectsQty
      : update.defectsQty !== undefined
      ? update.defectsQty
      : null;
  const currentSampleSize = sampleSize; // From logic above

  if (
    currentDefectsQty !== null &&
    currentSampleSize !== null &&
    currentSampleSize > 0
  ) {
    const rawRate = currentDefectsQty / currentSampleSize;
    const rate = parseFloat(rawRate.toFixed(4));
    if (update.$set) {
      update.$set.defectRate = rate;
    } else {
      update.defectRate = rate;
    }
  } else if (currentSampleSize === 0 && currentDefectsQty !== null) {
    if (update.$set) {
      update.$set.defectRate = 0;
    } else {
      update.defectRate = 0;
    }
  }

  // Recalculate result
  const currentAcceptDefect =
    update.$set && update.$set["aqlData.acceptDefect"] !== undefined
      ? update.$set["aqlData.acceptDefect"]
      : update["aqlData.acceptDefect"] !== undefined
      ? update["aqlData.acceptDefect"]
      : null;

  if (
    currentDefectsQty !== null &&
    currentAcceptDefect !== null &&
    currentSampleSize !== null &&
    currentSampleSize > 0
  ) {
    const res = currentDefectsQty <= currentAcceptDefect ? "Pass" : "Reject";
    if (update.$set) {
      update.$set.result = res;
    } else {
      update.result = res;
    }
  } else if (currentSampleSize === 0 && currentDefectsQty === 0) {
    if (update.$set) {
      update.$set.result = "Pass";
    } else {
      update.result = "Pass";
    }
  }

  next();
});

export default function createHTInspectionReportModel(connection) {
  return connection.model("HTInspectionReport", htInspectionReportSchema);
}

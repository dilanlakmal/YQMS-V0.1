import mongoose from "mongoose";

const MeasurementSizeSummarySchema = new mongoose.Schema(
  {
    size: String,
    kvalue: String,
    checkedPcs: Number,
    checkedPoints: Number,
    totalPass: Number,
    totalFail: Number,
    plusToleranceFailCount: Number,
    minusToleranceFailCount: Number,
    tolerancePlus: Number,
    toleranceMinus: Number
  },
  { _id: false }
);

const MeasurementPointSchema = new mongoose.Schema(
  {
    pointName: String,
    pointNo: Number,
    specs: String,
    toleranceMinus: Number,
    tolerancePlus: Number,
    rowNo: Number,
    measured_value_decimal: Number,
    measured_value_fraction: String,
    result: {
      type: String,
      enum: ["pass", "fail", "pending"],
      default: "pending"
    }
  },
  { _id: false }
);

const PcsSchema = new mongoose.Schema(
  {
    pcNumber: Number,
    isFullColumn: Boolean,
    measurementPoints: [MeasurementPointSchema]
  },
  { _id: false }
);

const MeasurementSchema = new mongoose.Schema(
  {
    size: String,
    qty: Number,
    kvalue: String,
    before_after_wash: {
      type: String,
      enum: ["beforeWash", "afterWash"],
      required: true
    },
    pcs: [PcsSchema],
    selectedRows: [Boolean],
    fullColumns: [Boolean]
  },
  { _id: false }
);

const MeasurementDetailsSchema = new mongoose.Schema(
  {
    measurementSizeSummary: [MeasurementSizeSummarySchema],
    measurement: [MeasurementSchema]
  },
  { _id: false }
);

// Sub-point Schema (nested under main checkpoint)
const SubPointInspectionDataSchema = new mongoose.Schema(
  {
    id: String, // e.g., "sub_68c0fe91b40bc0ea8b112b81_1757478505863.4636"
    subPointId: String, // e.g., "1757478505863.4636"
    name: String, // Sub-point name (e.g., "1", "2", "3")
    optionType: { type: String, enum: ["passfail", "custom"] },
    decision: String, // Selected decision (e.g., "Soft", "Dry", "Smooth", "Rough", etc.)
    remark: String, // Remark text
    comparisonImages: [String] // Array of image URLs
  },
  { _id: false }
);

// Main Checkpoint Inspection Data Schema (with nested sub-points)
const CheckpointInspectionDataSchema = new mongoose.Schema(
  {
    id: String, // e.g., "main_68c0fe91b40bc0ea8b112b81"
    checkpointId: String, // Reference to the checkpoint collection _id
    name: String, // Checkpoint name (e.g., "Hand Feel")
    optionType: { type: String, enum: ["passfail", "custom"] },
    decision: String, // Selected decision for main checkpoint (e.g., "Pass", "Fail")
    remark: String, // Remark text for main checkpoint
    comparisonImages: [String], // Array of image URLs for main checkpoint
    failureImpact: {
      type: String,
      enum: ["customize", "any", "all", "majority"],
      default: "customize"
    },
    // Sub-points nested under main checkpoint
    subPoints: [SubPointInspectionDataSchema]
  },
  { _id: false }
);

// Legacy checked points schema (for backward compatibility)
// const LegacyCheckedPointSchema = new mongoose.Schema({
//   pointName: String,
//   decision: mongoose.Schema.Types.Mixed, // Can be boolean or string
//   comparison: [String], // Array of image URLs
//   remark: String,
//   approvedDate: String,
//   condition: String
// }, { _id: false });

// Main Schema
const QCWashingSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    orderNo: { type: String, required: true },
    before_after_wash: { type: String, default: "Before Wash" },
    checkedQty: { type: Number, default: 0 },
    washQty: { type: Number, default: 0 },
    actualWashQty: {
      type: Number,
      min: 0,
      validate: {
        validator: function (v) {
          return (
            v === null || v === undefined || (Number.isInteger(v) && v >= 0)
          );
        },
        message: "Actual wash quantity must be a non-negative integer"
      }
    },
    actualAQLValue: {
      sampleSize: Number,
      acceptedDefect: Number,
      rejectedDefect: Number,
      levelUsed: Number,
      lotSize: Number,
      calculatedAt: Date
    },
    editedActualWashQty: {
      type: Number,
      min: 0,
      validate: {
        validator: function (v) {
          return (
            v === null || v === undefined || (Number.isInteger(v) && v >= 0)
          );
        },
        message: "Edited actual wash quantity must be a non-negative integer"
      }
    },
    lastEditedAt: {
      type: Date
    },
    editedBy: {
      type: String
    },
    totalCheckedPoint: { type: Number, default: 0 },
    totalPass: { type: Number, default: 0 },
    totalFail: { type: Number, default: 0 },
    passRate: { type: Number, default: 0 },
    totalCheckedPcs: { type: Number, default: 0 },
    rejectedDefectPcs: { type: Number, default: 0 },
    totalDefectCount: { type: Number, default: 0 },
    defectRate: { type: Number, default: 0.0 },
    defectRatio: { type: Number, default: 0.0 },
    overallFinalResult: { type: String },
    orderQty: { type: Number, default: 0 },
    colorOrderQty: { type: Number, default: 0 },
    color: { type: String, default: "" },
    washType: { type: String, default: "Normal Wash" },
    reportType: String,
    buyer: String,
    factoryName: String,
    colorName: String,
    aql: [
      {
        sampleSize: Number,
        acceptedDefect: Number,
        rejectedDefect: Number,
        levelUsed: { type: Number, default: 0 }
      }
    ],
    inspector: {
      engName: String,
      empId: String
    },
    inspectionDetails: {
      // NEW: Nested checkpoint inspection data
      checkpointInspectionData: [CheckpointInspectionDataSchema],

      // LEGACY: Keep for backward compatibility
      // checkedPoints: [LegacyCheckedPointSchema],

      // Machine processes
      machineProcesses: [
        {
          machineType: String,
          temperature: {
            actualValue: mongoose.Schema.Types.Mixed,
            standardValue: mongoose.Schema.Types.Mixed,
            status: {
              ok: { type: Boolean, default: false },
              no: { type: Boolean, default: false }
            }
          },
          time: {
            actualValue: mongoose.Schema.Types.Mixed,
            standardValue: mongoose.Schema.Types.Mixed,
            status: {
              ok: { type: Boolean, default: false },
              no: { type: Boolean, default: false }
            }
          },
          timeCool: {
            actualValue: mongoose.Schema.Types.Mixed,
            standardValue: mongoose.Schema.Types.Mixed,
            status: {
              ok: { type: Boolean, default: false },
              no: { type: Boolean, default: false }
            }
          },
          timeHot: {
            actualValue: mongoose.Schema.Types.Mixed,
            standardValue: mongoose.Schema.Types.Mixed,
            status: {
              ok: { type: Boolean, default: false },
              no: { type: Boolean, default: false }
            }
          },
          silicon: {
            actualValue: mongoose.Schema.Types.Mixed,
            standardValue: mongoose.Schema.Types.Mixed,
            status: {
              ok: { type: Boolean, default: false },
              no: { type: Boolean, default: false }
            }
          },
          softener: {
            actualValue: mongoose.Schema.Types.Mixed,
            standardValue: mongoose.Schema.Types.Mixed,
            status: {
              ok: { type: Boolean, default: false },
              no: { type: Boolean, default: false }
            }
          }
        }
      ],

      // Defect analysis parameters
      parameters: [
        {
          parameterName: String,
          checkedQty: { type: Number, default: 0 },
          defectQty: { type: Number, default: 0 },
          passRate: { type: mongoose.Schema.Types.Mixed, default: 0.0 },
          result: { type: String, default: "" },
          remark: String
        }
      ],

      // Machine settings
      timeCoolEnabled: { type: Boolean, default: false },
      timeHotEnabled: { type: Boolean, default: false },
      referenceSampleApproveDate: {
        type: Date,
        default: function () {
          const now = new Date();
          now.setHours(0, 0, 0, 0); // Set time to 00:00:00.000
          return now;
        }
      }
    },
    defectDetails: {
      checkedQty: Number,
      washQty: Number,
      result: String,
      levelUsed: Number,
      defectsByPc: [
        {
          pcNumber: String,
          isFullColumn: Boolean,
          pcDefects: [
            {
              defectId: String,
              defectName: String,
              defectQty: Number,
              remark: String,
              defectImages: [String]
            }
          ]
        }
      ],
      additionalImages: [String],
      comment: String
    },
    measurementDetails: MeasurementDetailsSchema,
    isAutoSave: { type: Boolean, default: false },
    userId: String,
    submittedAt: Date,
    status: {
      type: String,
      enum: ["processing", "auto-saved", "submitted", "approved", "rejected"],
      default: "processing"
    }
  },
  { timestamps: true }
);

// Add indexes for better performance
QCWashingSchema.index({ orderNo: 1, date: 1, color: 1 });
QCWashingSchema.index({ userId: 1, createdAt: -1 });
QCWashingSchema.index({ status: 1 });
QCWashingSchema.index({
  "inspectionDetails.checkpointInspectionData.checkpointId": 1
});

QCWashingSchema.pre("save", function (next) {
  if (this.totalCheckedPoint > 0) {
    this.passRate = Math.round((this.totalPass / this.totalCheckedPoint) * 100);
  }
  next();
});

export default (connection) => connection.model("QCWashing", QCWashingSchema);

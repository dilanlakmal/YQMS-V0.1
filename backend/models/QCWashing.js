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

// --- Main Schema ---

const QCWashingSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    orderNo: { type: String, required: true },
    before_after_wash: { type: String, default: "Before Wash" },
    checkedQty: { type: Number, default: 0 },
    washQty: { type: Number, default: 0 },
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
      checkedPoints: [
        {
          pointName: String,
          decision: { type: String },
          comparison: [String],
          remark: String
        }
      ],
      machineProcesses: [
        {
          machineType: String,
          temperature: {
            actualValue: Number,
            standardValue: Number,
            status: {
              ok: { type: Boolean, default: false },
              no: { type: Boolean, default: false }
            }
          },
          time: {
            actualValue: String,
            standardValue: String,
            status: {
              ok: { type: Boolean, default: false },
              no: { type: Boolean, default: false }
            }
          },
          timeCool: {
            actualValue: String,
            standardValue: String,
            status: {
              ok: { type: Boolean, default: false },
              no: { type: Boolean, default: false }
            }
          },
          timeHot: {
            actualValue: String,
            standardValue: String,
            status: {
              ok: { type: Boolean, default: false },
              no: { type: Boolean, default: false }
            }
          },
          silicon: {
            actualValue: Number,
            standardValue: Number,
            status: {
              ok: { type: Boolean, default: false },
              no: { type: Boolean, default: false }
            }
          },
          softener: {
            actualValue: Number,
            standardValue: Number,
            status: {
              ok: { type: Boolean, default: false },
              no: { type: Boolean, default: false }
            }
          }
        }
      ],

      parameters: [
        {
          parameterName: String,
          checkedQty: { type: Number, default: 0 },
          defectQty: { type: Number, default: 0 },
          passRate: { type: Number, default: 0.0 },
          result: { type: String, default: "" },
          remark: String
        }
      ]
    },
    defectDetails: {
      checkedQty: Number,
      washQty: Number,
      result: String,
      levelUsed: Number,
      defectsByPc: [
        {
          pcNumber: Number,
          isFullColumn: Boolean,
          pcDefects: [
            {
              defectId: String,
              defectName: String,
              defectQty: Number,
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

QCWashingSchema.pre("save", function (next) {
  if (this.totalCheckedPoint > 0) {
    this.passRate = Math.round((this.totalPass / this.totalCheckedPoint) * 100);
  }
  next();
});

export default (connection) => connection.model("QCWashing", QCWashingSchema);

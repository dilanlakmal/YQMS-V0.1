import mongoose from "mongoose";

  const QCWashingSchema = new mongoose.Schema({
    date: {type: Date,default: Date.now},
    orderNo: {type: String,required: true},
    before_after_wash: { type: String,default: 'Before Wash'},
    checkedQty: {type: Number,default: 0},
    washQty: {type: Number,default: 0},
    totalCheckedPoint: { type: Number,default: 0},
    totalPass: {type: Number,default: 0},
    totalFail: {type: Number,default: 0},
    passRate: {type: Number,default: 0},
    totalCheckedPcs: { type: Number, default: 0  },
    rejectedDefectPcs: { type: Number, default: 0  },
    totalDefectCount: { type: Number, default: 0  },
    defectRate: { type: Number },
    defectRatio: { type: Number },
    overallFinalResult: { type: String },
    orderQty: { type: Number, default: 0 },
    colorOrderQty: { type: Number, default: 0 },
    color: { type: String, default: '' },
    washType: {type: String,default: 'Normal Wash'},
    reportType: String,
    buyer: String,
    factoryName: String,
    colorName: String,
    aql:[{
      sampleSize: Number,
      acceptedDefect: Number,
      rejectedDefect: Number,
      levelUsed: { type:Number, default: 0 },
    }],
    inspector: {
      engName: String,
      empId: String
    },
    inspectionDetails: {
       checkedPoints: [{
        pointName: String,
        decision: Boolean,
        comparison:[String],
        remark: String,
      }],
      machineProcesses: [{
          machineType:String,
          temperature: Number,
          time:Number,
          chemical: Number // optional for Tumble Dry
        }
      ],
      parameters: [{
        parameterName: String,
        checkedQty: { type: Number, default: 0 },
        defectQty: { type: Number, default: 0 },
        passRate: { type: Number, default: 0.00 },
        result: { type: String, default: '' },
        remark: String,
      }]
    },
      defectDetails: {
        checkedQty: Number,
        washQty: Number,
        result: String,
        levelUsed: Number,
        defectsByPc: [{
          pcNumber: Number, // track PC number
          pcDefects: [{
            defectId: String,
            defectName: String,
            defectQty: Number,
            defectImages: [String]
          }]
        }],
        additionalImages: [String],
        comment: String
      },
      measurementDetails: [
        {
         measurementSizeSummary: {
            size: String,
            checkedPcs: Number,
            checkedPoints: Number,
            totalPass: Number,
            totalFail: Number,
            plusToleranceFailCount: Number,
            minusToleranceFailCount: Number,
            tolerancePlus: Number,
            toleranceMinus: Number
          },
            measurement: {
              size: String,
              qty: Number,
              before_after_wash: {
                type: String,
                enum: ['beforeWash', 'afterWash'],
              required: true
            },
            pcs: [{
              pcNumber: Number,
              isFullColumn: Boolean,
              measurementPoints: [{
                pointName: String,
                pointNo: Number, // from dt_order/specs
                decimal: Number, // measured value as decimal
                fraction: String, // measured value as fraction
                specs: String,
                toleranceMinus: Number, // decimal
                tolerancePlus: Number,  // decimal
                rowNo: Number, // instead of specIndex
                result: { type: String, enum: ['pass', 'fail'], default: 'pass' }
              }]
            }],
            selectedRows: [Boolean],
            fullColumns: [Boolean],
            measurements: mongoose.Schema.Types.Mixed,
            savedAt: Date
          }
        },
      ],
    isAutoSave: {
      type: Boolean,
      default: false
    },
    userId: String,
    // savedAt: Date,
    submittedAt: Date,
    status: {
      type: String,
      enum: ['draft', 'auto-saved', 'submitted', 'approved', 'rejected'],
      default: 'draft'
    }
  }, {
    timestamps: true
  });

  QCWashingSchema.pre('save', function(next) {
    if (this.totalCheckedPoint > 0) {
      this.passRate = Math.round((this.totalPass / this.totalCheckedPoint) * 100);
    }
    next();
  });

  export default (connection) => connection.model("QCWashing", QCWashingSchema);

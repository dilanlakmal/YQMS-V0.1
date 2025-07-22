  import mongoose from "mongoose";

  const QCWashingSchema = new mongoose.Schema({
    date: {
      type: Date,
      default: Date.now
    },
    orderNo: {
      type: String,
      required: true
    },
    reportType: {
      type: String,
      default: 'Before Wash'
    },
    checkedQty: {type: String},
    washQty: {type: String},
    totalCheckedPoint: {
      type: Number,
      default: 0
    },
    totalPass: {
      type: Number,
      default: 0
    },
    totalFail: {
      type: Number,
      default: 0
    },
    passRate: {
      type: Number,
      default: 0
    },
    totalCheckedPcs: { type: Number, default: 0  },
    rejectedDefectPcs: { type: Number, default: 0  },
    totalDefectCount: { type: Number, default: 0  },
    defectRate: { type: Number },
    defectRatio: { type: Number },
    overallFinalResult: { type: String },
    aqlLevelUsed: { type: String },
    colors: [{
      colorName: String,
      orderDetails: {
        orderQty: String,
        color: String,
        washingType: {
          type: String,
          default: 'Normal Wash'
        },
        daily: String,
        buyer: String,
        factoryName: String,
        reportType: {
          type: String,
          default: 'Before Wash'
        },
        aqlSampleSize: String,
        aqlAcceptedDefect: String,
        aqlRejectedDefect: String,
        aqlLevelUsed: String,
        inspector: {
          engName: String,
          empId: String
        }
      },
      inspectionDetails: {
        temp: String,
        time: String,
        chemical: String,
        checkedPoints: [{
          pointName: String,
          approvedDate: String,
          condition: String,
          remark: String,
        }],
        parameters: [{
          parameterName: String,
          checkedQty: { type: Number, default: 0 },
          failedQty: { type: Number, default: 0 },
          passRate: { type: String, default: '0.00' },
          result: { type: String, default: '' },
          remark: String,
          ok: { type: Boolean, default: true },   
          no: { type: Boolean, default: false }, 
          checkboxes: mongoose.Schema.Types.Mixed,
        }]
      },
      defectDetails: {
        checkedQty: String,
        washQty: String,
        result: String,
        aqlLevelUsed: String,
        defectsByPc: [{
          pcNumber: String, // track PC number
          pcDefects: [{
            defectName: String,
            defectQty: Number,
            defectImages: [String]
          }]
        }],
        additionalImages: [String],
        comment: String
      },
      measurementDetails: [{
        size: String,
        qty: Number,
        washType: {
          type: String,
          enum: ['beforeWash', 'afterWash'],
          required: true
        },
      
        pcs: [{
          pcNumber: Number,
          measurementPoints: [{
            pointName: String,
            value: String,
            specs: String,
            toleranceMinus: String,
            tolerancePlus: String,
            specIndex: Number,
            isFullColumn: Boolean,
            result: {
              type: String,
              enum: ['pass', 'fail'],
              default: 'pass'
            }
          }]
        }],
        selectedRows: [Boolean],
        fullColumns: [Boolean],
        measurements: mongoose.Schema.Types.Mixed,
        savedAt: Date
      }]
    }],
    isAutoSave: {
      type: Boolean,
      default: false
    },
    userId: String,
    savedAt: Date,
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

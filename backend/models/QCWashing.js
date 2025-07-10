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
        status: String,
        qty: String,
        remark: String,
        checkboxes: {
          type: Map,
          of: Boolean
        }
      }]
    },
    defectDetails: {
      checkedQty: String,
      washQty: String,
      defects: [{
        defectName: String,
        defectQty: Number
      }],
      defectImages: [String],
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

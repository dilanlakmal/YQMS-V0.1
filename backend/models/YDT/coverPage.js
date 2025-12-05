// models/YDT/coverPage.js
import mongoose from 'mongoose';

const createCoverPageSchema = (connection) => {
  const CoverPageItemSchema = new mongoose.Schema({
    poNumber: {
      type: String,
      required: true
    },
    customerStyle: {
      type: String,
      required: true
    },
    quantity: {
      type: String,
      required: true
    },
    retailSingle: {
      type: String,
      default: ''
    },
    majorPoints: {
      type: String,
      default: ''
    },
    testInstructions: {
      type: String,
      default: ''
    },
    uploadedImage: {
      type: String,
      default: null
    },
    styleTable: [{
      orderNo: {
        type: String,
        required: true
      },
      customerStyle: {
        type: String,
        required: true
      },
      poNumber: {
        type: String,
        required: true
      },
      colors: [{
        type: String
      }],
      quantity: {
        type: Number,
        default: 0
      },
      remarks: {
        type: String,
        default: ''
      }
    }],
    sizeTable: [{
      orderTotalQty: {
        type: Number,
        default: 0
      },
      sizeDetails: {
        type: String,
        default: ''
      },
      sizes: [{         
        type: String
      }],
      colors: [{        
        type: String
      }]
    }],
    stampData: {
      name: {
        type: String,
        default: ''
      },
      date: {
        type: Date,
        default: Date.now
      }
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: String,
      default: 'system'
    }
  }, {
    _id: true
  });

  const CoverPageSchema = new mongoose.Schema({
    orderNo: {
      type: String,
      required: true,
      unique: true
    },
    coverPages: [CoverPageItemSchema],
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }, {
    timestamps: true
  });

  // Create indexes for better performance
  CoverPageSchema.index({ createdAt: -1 });

  return connection.model('CoverPage', CoverPageSchema);
};

export default createCoverPageSchema;

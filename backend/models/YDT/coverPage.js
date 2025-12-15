// models/YDT/coverPage.js
import mongoose from 'mongoose';

const createCoverPageSchema = (connection) => {
  const SketchTechnicalSchema = new mongoose.Schema({
    // Header information
    styleId: { type: String, default: '' },
    shortDesc: { type: String, default: '' },
    department: { type: String, default: '' },
    initialDcDate: { type: Date, default: Date.now },
    commodity: { type: String, default: '' },
    season: { type: String, default: '' },
    vendor3d: { type: String, default: 'No' },
    
    // Style details
    styleStatus: { type: String, default: 'In Work' },
    longDescription: { type: String, default: '' },
    
    // Approval and sizing
    finalFitApproval: { type: String, default: '' },
    sizeRange: [{ type: String }],
    availableSizes: [{ type: String }],
    targetCost: { type: String, default: '' },
    targetUnits: { type: String, default: '' },
    plannedColors: { type: String, default: '' },
    deliveryCount: { type: String, default: '' },
    
    fitType: { type: String, default: 'Regular' },
    coll1: { type: String, default: '' },
    coll2: { type: String, default: '' },
    retailPrice: { type: String, default: '' },
    floorSet: { type: Date, default: Date.now },
    sizeCurve: { type: String, default: '' },
    
    // Order-related fields
    orderNo: { type: String, default: '' },
    buyerEngName: { type: String, default: '' },
    custStyle: { type: String, default: '' },
    orderQty: { type: String, default: '' },
    
    // Canvas and image data
    originalImage: { type: String, default: null },
    mainSketchImage: { type: String, default: null },
    secondaryImage: { type: String, default: null },
    canvasData: { type: Array, default: [] },

    selectedOrderData: { type: mongoose.Schema.Types.Mixed, default: null },
    
    // Metadata
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    createdBy: { type: String, default: 'system' },
  }, {
    _id: true,
    timestamps: true
  });
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
    testInstructionsHTML: {
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
        default:''
      },
      customerStyle: {
        type: String,
         default:''
      },
      poNumber: {
        type: String,
         default:''
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
    sketchTechnical: [SketchTechnicalSchema], 
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
  CoverPageSchema.index({ createdAt: 1 });

  return connection.model('CoverPage', CoverPageSchema);
};

export default createCoverPageSchema;

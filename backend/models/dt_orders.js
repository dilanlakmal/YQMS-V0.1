import mongoose from 'mongoose';

// Schema for OrderQty - array of objects with size names as keys
const OrderQtyItemSchema = new mongoose.Schema({}, { 
  strict: false, // Allow dynamic keys like {"XS": 167}
  _id: false 
});

const CutQtySchema = new mongoose.Schema({}, { 
  strict: false, // Allow dynamic keys with nested objects
  _id: false 
});

const SpecsSchema = new mongoose.Schema({}, { 
  strict: false, // Allow dynamic size keys
  _id: false 
});

const SizeSpecSchema = new mongoose.Schema({
  Seq: {
    type: Number,
    required: true,
    default: 0
  },
  AtoZ: {
    type: String,
    required: false,
    default: null
  },
  Area: {
    type: String,
    required: false,
    default: null
  },
  ChineseArea: {
    type: String,
    required: false,
    default: null
  },
  EnglishRemark: {
    type: String,
    required: false,
    default: null
  },
  ChineseRemark: {
    type: String,
    required: false,
    default: null
  },
  ChineseName: {
    type: String,
    required: false,
    default: null
  },
  AreaCode: {
    type: String,
    required: false,
    default: null
  },
  IsMiddleCalc: {
    type: String,
    required: false,
    default: null
  },
  ToleranceMin: {
    fraction: {
      type: String,
      default: ''
    },
    decimal: {
      type: Number,
      default: 0,
      validate: {
        validator: function(v) {
          return !isNaN(v);
        },
        message: 'Decimal must be a valid number'
      }
    }
  },
  TolerancePlus: {
    fraction: {
      type: String,
      default: ''
    },
    decimal: {
      type: Number,
      default: 0,
      validate: {
        validator: function(v) {
          return !isNaN(v);
        },
        message: 'Decimal must be a valid number'
      }
    }
  },
  SpecMemo: {
    type: String,
    required: false,
    default: null
  },
  SizeSpecMeasUnit: {
    type: String,
    required: false,
    default: null
  },
  Specs: [SpecsSchema] // Array of objects with dynamic keys
}, { _id: false });

const ShipSeqNoSchema = new mongoose.Schema({
  seqNo: {
    type: Number,
    required: true
  },
   sizes: [OrderQtyItemSchema]
}, { _id: false });

const OrderColorShipSchema = new mongoose.Schema({
  ColorCode: {
    type: String,
    required: false
  },
  Color: {
    type: String,
    required: false
  },
  ChnColor: {
    type: String,
    required: false
  },
  ColorKey: {
    type: Number,
    required: false
  },
  ShipSeqNo: [ShipSeqNoSchema]
}, { _id: false });

const OrderColorsSchema = new mongoose.Schema({
  ColorCode: {
    type: String,
    required: false
  },
  Color: {
    type: String,
    required: false
  },
  ChnColor: {
    type: String,
    required: false
  },
  ColorKey: {
    type: Number,
    required: false
  },
  OrderQty: [OrderQtyItemSchema], // Array of objects like [{"XS": 167}, {"S": 493}]
  CutQty: CutQtySchema // Single object with dynamic keys
}, { _id: false });

// Main Schema
const DtOrderSchema = new mongoose.Schema({
  // Top level data
  SC_Heading: {
    type: String,
    required: false
  },
  Factory: {
    type: String,
    required: false
  },
  SalesTeamName: {
    type: String,
    required: false
  },
  Cust_Code: {
    type: String,
    required: false
  },
  ShortName: {
    type: String,
    required: false
  },
  EngName: {
    type: String,
    required: false
  },
  Order_No: {
    type: String,
    required: true,
    unique: true
  },
  Ccy: {
    type: String,
    required: false
  },
  Style: {
    type: String,
    required: false
  },
  CustStyle: {
    type: String,
    required: false
  },
  Mode: {
    type: String,
    required: false
  },
  Country: {
    type: String,
    required: false
  },
  Origin: {
    type: String,
    required: false
  },
  CustPORef: {
    type: String,
    required: false
  },
  TotalQty: {
    type: Number,
    required: false,
    default: 0
  },
  NoOfSize: {
    type: Number,
    required: false,
    default: 0
  },
  
  // Nested Arrays
  SizeSpec: [SizeSpecSchema],
  OrderColors: [OrderColorsSchema],
  OrderColorShip: [OrderColorShipSchema]
}, {
  timestamps: true,
  collection: 'dt_orders'
});

// Indexes for better performance
DtOrderSchema.index({ Factory: 1 });
DtOrderSchema.index({ Cust_Code: 1 });
DtOrderSchema.index({ createdAt: -1 });

export default (connection) => connection.model("DtOrder", DtOrderSchema);

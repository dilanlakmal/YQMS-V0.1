import mongoose from "mongoose";

// Schema for OrderQty - array of objects with size names as keys
const OrderQtyItemSchema = new mongoose.Schema(
  {},
  {
    strict: false, // Allow dynamic keys like {"XS": 167}
    _id: false,
  },
);

// Schema for individual size cut quantity data
const SizeCutQtySchema = new mongoose.Schema(
  {
    ActualCutQty: {
      type: Number,
      required: false,
      default: 0,
    },
    PlanCutQty: {
      type: Number,
      required: false,
      default: 0,
    },
  },
  { _id: false },
);

// Updated CutQty Schema - more explicit structure
const CutQtySchema = new mongoose.Schema(
  {},
  {
    strict: false, // Allow dynamic size keys like "XS", "S", "M", etc.
    _id: false,
  },
);

// Alternative approach - if you want to be more explicit about the structure
// You can also define it this way, but the above approach is more flexible
/*
const CutQtySchema = new mongoose.Schema({
  // This would require you to know all possible size names in advance
  // XS: SizeCutQtySchema,
  // S: SizeCutQtySchema,
  // M: SizeCutQtySchema,
  // etc...
}, { 
  strict: false, // Still allow other dynamic keys
  _id: false 
});
*/

const SpecsSchema = new mongoose.Schema(
  {},
  {
    strict: false, // Allow dynamic size keys
    _id: false,
  },
);

const SizeSpecSchema = new mongoose.Schema(
  {
    Seq: {
      type: Number,
      required: true,
      default: 0,
    },
    AtoZ: {
      type: String,
      required: false,
      default: null,
    },
    Area: {
      type: String,
      required: false,
      default: null,
    },
    ChineseArea: {
      type: String,
      required: false,
      default: null,
    },
    EnglishRemark: {
      type: String,
      required: false,
      default: null,
    },
    ChineseRemark: {
      type: String,
      required: false,
      default: null,
    },
    ChineseName: {
      type: String,
      required: false,
      default: null,
    },
    AreaCode: {
      type: String,
      required: false,
      default: null,
    },
    IsMiddleCalc: {
      type: String,
      required: false,
      default: null,
    },
    ToleranceMinus: {
      fraction: {
        type: String,
        default: "",
      },
      decimal: {
        type: Number,
        default: 0,
        validate: {
          validator: function (v) {
            return !isNaN(v);
          },
          message: "Decimal must be a valid number",
        },
      },
    },
    TolerancePlus: {
      fraction: {
        type: String,
        default: "",
      },
      decimal: {
        type: Number,
        default: 0,
        validate: {
          validator: function (v) {
            return !isNaN(v);
          },
          message: "Decimal must be a valid number",
        },
      },
    },
    SpecMemo: {
      type: String,
      required: false,
      default: null,
    },
    SizeSpecMeasUnit: {
      type: String,
      required: false,
      default: null,
    },
    Specs: [SpecsSchema], // Array of objects with dynamic keys
  },
  { _id: false },
);

const ShipSeqNoSchema = new mongoose.Schema(
  {
    seqNo: {
      type: Number,
      required: true,
    },
    Ship_ID: {
      type: Number,
      required: false,
      default: null,
    },
    sizes: [OrderQtyItemSchema],
  },
  { _id: false },
);

const OrderColorShipSchema = new mongoose.Schema(
  {
    ColorCode: {
      type: String,
      required: false,
    },
    Color: {
      type: String,
      required: false,
    },
    ChnColor: {
      type: String,
      required: false,
    },
    ColorKey: {
      type: Number,
      required: false,
    },
    ShipSeqNo: [ShipSeqNoSchema],
  },
  { _id: false },
);

const OrderColorsSchema = new mongoose.Schema(
  {
    ColorCode: {
      type: String,
      required: false,
    },
    Color: {
      type: String,
      required: false,
    },
    ChnColor: {
      type: String,
      required: false,
    },
    ColorKey: {
      type: Number,
      required: false,
    },
    OrderQty: [OrderQtyItemSchema], // Array of objects like [{"XS": 167}, {"S": 493}]
    CutQty: CutQtySchema, // Object with dynamic size keys, each containing ActualCutQty and PlanCutQty
  },
  { _id: false },
);

// Main Schema
const DtOrderSchema = new mongoose.Schema(
  {
    // Top level data
    SC_Heading: {
      type: String,
      required: false,
    },
    Factory: {
      type: String,
      required: false,
    },
    SalesTeamName: {
      type: String,
      required: false,
    },
    Cust_Code: {
      type: String,
      required: false,
    },
    ShortName: {
      type: String,
      required: false,
    },
    EngName: {
      type: String,
      required: false,
    },
    Order_No: {
      type: String,
      required: true,
      unique: true,
    },
    Ccy: {
      type: String,
      required: false,
    },
    Style: {
      type: String,
      required: false,
    },
    CustStyle: {
      type: String,
      required: false,
    },
    Mode: {
      type: String,
      required: false,
    },
    Country: {
      type: String,
      required: false,
    },
    Origin: {
      type: String,
      required: false,
    },
    CustPORef: {
      type: String,
      required: false,
    },
    TotalQty: {
      type: Number,
      required: false,
      default: 0,
    },
    NoOfSize: {
      type: Number,
      required: false,
      default: 0,
    },
    SizeList: {
      type: [String],
      required: false,
      default: [],
    },
    isModify: {
      type: Boolean,
      required: false,
      default: false,
    },
    modifiedAt: {
      type: Date,
      required: false,
      default: null,
    },
    modifiedBy: {
      type: String,
      required: false,
      default: null,
    },
    modificationHistory: [
      {
        modifiedAt: {
          type: Date,
          default: Date.now,
        },
        modifiedBy: {
          type: String,
          required: false,
        },
        changes: {
          type: String,
          required: false,
        },
      },
    ],

    // Nested Arrays
    SizeSpec: [SizeSpecSchema],
    OrderColors: [OrderColorsSchema],
    OrderColorShip: [OrderColorShipSchema],
  },
  {
    timestamps: true,
    collection: "dt_orders",
  },
);

// Indexes for better performance
DtOrderSchema.index({ Factory: 1 });
DtOrderSchema.index({ Cust_Code: 1 });
DtOrderSchema.index({ Style: 1 }); // Added index for Style since we're using it for mapping
DtOrderSchema.index({ createdAt: -1 });
DtOrderSchema.index({ isModify: 1 });

export default (connection) => connection.model("DtOrder", DtOrderSchema);

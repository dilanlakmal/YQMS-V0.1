import mongoose from "mongoose";

const createFincheckInspectionReportsModel = (connection) => {
  // 1. Sub-Schemas
  const AQLConfigItemSchema = new mongoose.Schema(
    {
      status: { type: String, enum: ["Minor", "Major", "Critical"] },
      // Ac/Re are whole numbers
      ac: { type: Number, default: 0 },
      re: { type: Number, default: 0 }
    },
    { _id: false }
  );

  const ProductionStatusSchema = new mongoose.Schema(
    {
      cutting: { type: Number, default: 0 },
      sewing: { type: Number, default: 0 },
      ironing: { type: Number, default: 0 },
      qc2FinishedChecking: { type: Number, default: 0 },
      folding: { type: Number, default: 0 },
      packing: { type: Number, default: 0 }
    },
    { _id: false }
  );

  const PackingListSchema = new mongoose.Schema(
    {
      totalCartons: { type: Number, default: 0 },
      totalPcs: { type: Number, default: 0 },
      finishedCartons: { type: Number, default: 0 },
      finishedPcs: { type: Number, default: 0 }
    },
    { _id: false }
  );

  // 2. Inspection Details Schema (Specifics)
  const InspectionDetailsSchema = new mongoose.Schema(
    {
      supplier: { type: String, default: "" },
      isSubCon: { type: Boolean, default: false },
      subConFactory: { type: String, default: "" },
      subConFactoryId: { type: mongoose.Schema.Types.ObjectId, default: null },
      factory: { type: String, default: "" },

      inspectedQty: { type: Number, default: null },
      aqlSampleSize: { type: Number, default: 0 },
      cartonQty: { type: Number, default: null },
      shippingStage: { type: String, default: "" },
      remarks: { type: String, default: "" },

      totalOrderQty: { type: Number, default: 0 },
      custStyle: { type: String, default: "" },
      customer: { type: String, default: "" },

      // --- MODIFIED AQL CONFIG STRUCTURE ---
      aqlConfig: {
        inspectionType: { type: String, default: "" }, // e.g., "General"
        level: { type: String, default: "" }, // e.g., "II"

        // Specific Float Fields for AQL Levels
        minorAQL: { type: Number, default: 0 },
        majorAQL: { type: Number, default: 0 },
        criticalAQL: { type: Number, default: 0 },

        inspectedQty: { type: Number, default: 0 }, // e.g., 500
        batch: { type: String, default: "" }, // e.g., "501 ~ 1200"
        sampleLetter: { type: String, default: "" }, // e.g., "J"
        sampleSize: { type: Number, default: 0 }, // e.g., 80

        // Array for Ac/Re values
        items: [AQLConfigItemSchema]
      },

      productionStatus: { type: ProductionStatusSchema, default: () => ({}) },
      packingList: { type: PackingListSchema, default: () => ({}) },
      qualityPlanEnabled: { type: Boolean, default: false }
    },
    { _id: false }
  );

  // --- NEW: Header Data Schemas ---
  const HeaderImageSchema = new mongoose.Schema(
    {
      imageId: { type: String, required: true }, // Frontend ID for tracking
      imageURL: { type: String, required: true }, // Path: /storage/...
      uploadedAt: { type: Date, default: Date.now }
    },
    { _id: false }
  );

  const HeaderDataItemSchema = new mongoose.Schema(
    {
      headerId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Ref to QASectionsHome
      name: { type: String, required: true }, // Section Name
      selectedOption: { type: String, default: "" },
      remarks: { type: String, default: "" },
      images: [HeaderImageSchema]
    },
    { _id: false }
  );

  // --- Photo Data Schemas ---
  const PhotoImageSchema = new mongoose.Schema(
    {
      imageId: { type: String, required: true }, // Frontend ID or generated
      imageURL: { type: String, required: true }, // /storage/...
      uploadedAt: { type: Date, default: Date.now }
    },
    { _id: false }
  );

  const PhotoItemSchema = new mongoose.Schema(
    {
      itemNo: { type: Number, required: true },
      itemName: { type: String, required: true },
      remarks: { type: String, default: "" },
      images: [PhotoImageSchema]
    },
    { _id: false }
  );

  const PhotoSectionDataSchema = new mongoose.Schema(
    {
      sectionId: { type: mongoose.Schema.Types.ObjectId, required: true },
      sectionName: { type: String, required: true },
      items: [PhotoItemSchema]
    },
    { _id: false }
  );

  // --- Inspection Config Schema ---
  const InspectionConfigItemSchema = new mongoose.Schema(
    {
      reportName: { type: String, required: true },
      inspectionMethod: { type: String, default: "Fixed" }, // "AQL" or "Fixed"
      sampleSize: { type: Number, default: 0 }, // Total Calculated Qty
      // Stores the array of groups (Line, Table, Color, Assignments) dynamically
      configGroups: { type: mongoose.Schema.Types.Mixed, default: [] },
      updatedAt: { type: Date, default: Date.now }
    },
    { _id: false }
  );

  // --- Measurement Data Schema ---
  const MeasurementDataItemSchema = new mongoose.Schema(
    {
      // Context / Config Link
      groupId: { type: Number, required: true }, // Matches the ID from InspectionConfig

      // Scopes
      line: { type: String, default: "" },
      table: { type: String, default: "" },
      color: { type: String, default: "" },

      // Visual Helpers (Snapshot names in case config changes)
      lineName: { type: String, default: "" },
      tableName: { type: String, default: "" },
      colorName: { type: String, default: "" },
      qcUser: { type: mongoose.Schema.Types.Mixed, default: null }, // Stores QC Object

      // Measurement Context
      size: { type: String, required: true },
      kValue: { type: String, default: "" }, // For Before Wash
      displayMode: { type: String, default: "all" }, // "all" or "selected"

      // --- Heavy Data (Using Mixed for flexibility) ---
      // Structure: { [specId]: { [pcsIndex]: { decimal: 0, fraction: "0" } } }
      allMeasurements: { type: mongoose.Schema.Types.Mixed, default: {} },
      criticalMeasurements: { type: mongoose.Schema.Types.Mixed, default: {} },

      // Qty & Enabled Pieces (Stored as Arrays in DB, converted to Sets in Frontend)
      allQty: { type: Number, default: 1 },
      criticalQty: { type: Number, default: 2 },
      allEnabledPcs: { type: [Number], default: [] },
      criticalEnabledPcs: { type: [Number], default: [] },

      // Decisions & Metadata
      inspectorDecision: { type: String, default: "pass" },
      systemDecision: { type: String, default: "pending" },
      remark: { type: String, default: "" },
      timestamp: { type: Date, default: Date.now }
    },
    { _id: false }
  );

  // 3. Main Report Schema
  const FincheckInspectionReportsSchema = new mongoose.Schema(
    {
      inspectionDate: { type: Date, required: true },
      inspectionType: { type: String, enum: ["first", "re"], required: true },
      orderNos: { type: [String], required: true },
      orderNosString: { type: String, required: true },
      orderType: {
        type: String,
        enum: ["single", "multi", "batch"],
        default: "single"
      },
      buyer: { type: String, required: true },
      productType: { type: String, required: true },
      productTypeId: { type: mongoose.Schema.Types.ObjectId, default: null },
      reportType: { type: String, required: true },
      reportTypeId: { type: mongoose.Schema.Types.ObjectId, required: true },
      empId: { type: String, required: true },
      empName: { type: String },
      measurementMethod: {
        type: String,
        enum: ["Before", "After", "N/A"],
        default: "N/A"
      },
      inspectionMethod: {
        type: String,
        enum: ["Fixed", "AQL", "N/A"],
        default: "N/A"
      },

      // --- Report ID is a Number ---
      reportId: {
        type: Number,
        unique: true,
        index: true
      },
      status: {
        type: String,
        enum: ["draft", "in_progress", "completed", "cancelled"],
        default: "draft"
      },
      inspectionDetails: InspectionDetailsSchema,
      // --- Header Data Array ---
      headerData: { type: [HeaderDataItemSchema], default: [] },
      // --- Photo Data Array ---
      photoData: { type: [PhotoSectionDataSchema], default: [] },
      // --- Inspection Configuration Data ---
      inspectionConfig: { type: [InspectionConfigItemSchema], default: [] },
      // --- Measurement Data Array ---
      measurementData: { type: [MeasurementDataItemSchema], default: [] }
    },
    {
      timestamps: true,
      collection: "fincheck_inspection_reports"
    }
  );

  FincheckInspectionReportsSchema.index(
    {
      inspectionDate: 1,
      inspectionType: 1,
      orderNos: 1,
      productTypeId: 1,
      reportTypeId: 1,
      empId: 1
    },
    { unique: true }
  );

  return connection.model(
    "FincheckInspectionReports",
    FincheckInspectionReportsSchema
  );
};

export default createFincheckInspectionReportsModel;

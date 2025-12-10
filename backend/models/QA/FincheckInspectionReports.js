import mongoose from "mongoose";

const createFincheckInspectionReportsModel = (connection) => {
  const AQLConfigItemSchema = new mongoose.Schema(
    {
      status: { type: String, enum: ["Minor", "Major", "Critical"] },
      aqlLevel: { type: mongoose.Schema.Types.Mixed },
      ac: { type: mongoose.Schema.Types.Mixed },
      re: { type: mongoose.Schema.Types.Mixed }
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

  const InspectionDetailsSchema = new mongoose.Schema(
    {
      buyer: { type: String },
      buyerCode: { type: String },
      productType: { type: String },
      productTypeId: { type: mongoose.Schema.Types.ObjectId },
      supplier: { type: String, default: "YM" },
      isSubCon: { type: Boolean, default: false },
      subConFactory: { type: String },
      subConFactoryId: { type: mongoose.Schema.Types.ObjectId },
      reportTypeName: { type: String },
      reportTypeId: { type: mongoose.Schema.Types.ObjectId },
      measurement: { type: String, enum: ["Before", "After", "N/A"] },
      method: { type: String, enum: ["Fixed", "AQL", "N/A"] },
      inspectedQty: { type: Number },
      aqlSampleSize: { type: Number },
      cartonQty: { type: Number },
      shippingStage: { type: String },
      remarks: { type: String },
      totalOrderQty: { type: Number },
      custStyle: { type: String },
      customer: { type: String },
      factory: { type: String },

      // AQL Configuration - only populated if method is AQL
      aqlConfig: {
        inspectionType: { type: String },
        level: { type: String },
        batch: { type: String },
        sampleLetter: { type: String },
        sampleSize: { type: Number },
        items: [AQLConfigItemSchema]
      },

      // Production Status - only populated if QualityPlan is "Yes"
      productionStatus: ProductionStatusSchema,
      packingList: PackingListSchema,
      qualityPlanEnabled: { type: Boolean, default: false }
    },
    { _id: false }
  );

  const FincheckInspectionReportsSchema = new mongoose.Schema(
    {
      reportId: {
        type: String,
        required: true,
        unique: true,
        index: true
      },
      inspectionDate: {
        type: Date,
        required: true
      },
      inspectionType: {
        type: String,
        enum: ["first", "re"],
        required: true
      },
      orderNos: {
        type: [String],
        required: true
      },
      orderType: {
        type: String,
        enum: ["single", "multi", "batch"],
        default: "single"
      },
      empId: {
        type: String,
        required: true
      },
      empName: {
        type: String
      },
      status: {
        type: String,
        enum: ["draft", "in_progress", "completed", "cancelled"],
        default: "draft"
      },
      inspectionDetails: InspectionDetailsSchema
    },
    {
      timestamps: true,
      collection: "fincheck_inspection_reports"
    }
  );

  // Indexes
  FincheckInspectionReportsSchema.index({ inspectionDate: -1 });
  FincheckInspectionReportsSchema.index({ empId: 1 });
  FincheckInspectionReportsSchema.index({ orderNos: 1 });
  FincheckInspectionReportsSchema.index({ status: 1 });

  return connection.model(
    "FincheckInspectionReports",
    FincheckInspectionReportsSchema
  );
};

export default createFincheckInspectionReportsModel;

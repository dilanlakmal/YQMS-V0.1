import mongoose from "mongoose";

// Sub-schema for selected defect categories
const SelectedCategorySchema = new mongoose.Schema(
  {
    categoryId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Reference ID
    CategoryCode: { type: String, required: true },
    CategoryNameEng: { type: String, required: true }
  },
  { _id: false }
);

const qaSectionsTemplatesSchema = new mongoose.Schema(
  {
    no: { type: Number, required: true, unique: true },
    ReportType: { type: String, required: true },

    // Config Fields
    Measurement: {
      type: String,
      enum: ["No", "Before", "After"],
      default: "No"
    },
    Header: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes"
    },
    Photos: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes"
    },
    QualityPlan: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes"
    },
    Conclusion: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes"
    },

    // List of selected categories
    DefectCategoryList: [SelectedCategorySchema]
  },
  {
    collection: "qa_sections_templates",
    timestamps: true
  }
);

export default (connection) =>
  connection.model("QASectionsTemplates", qaSectionsTemplatesSchema);

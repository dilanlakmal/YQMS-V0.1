import mongoose from "mongoose";

// Sub-schema for individual defects within a B-graded garment
const defectDetailSchema = new mongoose.Schema(
  {
    defectName: { type: String, required: true },
    defectCount: { type: Number, required: true },
    status: { type: String, required: true, enum: ["B Grade", "Pass", "OK"] } // Status of this specific defect
  },
  { _id: false }
);

// Sub-schema for the B-graded garment itself
const bGradeGarmentSchema = new mongoose.Schema(
  {
    garmentNumber: { type: Number, required: true },
    record_date: { type: String, required: true },
    record_time: { type: String, required: true },
    defectDetails: [defectDetailSchema], // Array of all defects in that garment
    leader_status: {
      type: String,
      enum: ["B Grade", "Not B Grade"],
      default: "B Grade"
    }
  },
  { _id: false }
);

const qc2BGradeSchema = new mongoose.Schema(
  {
    // Header information copied from the original defect card
    package_no: { type: Number, required: true },
    moNo: { type: String, required: true },
    custStyle: { type: String, required: true },
    color: { type: String, required: true },
    size: { type: String, required: true },
    lineNo: { type: String, required: true },
    department: { type: String, required: true },
    buyer: { type: String, required: false },
    factory: { type: String },
    sub_con: { type: String },
    sub_con_factory: { type: String },
    defect_print_id: { type: String, required: true }, // The original defect card ID
    // ADDED: The random_id of the main inspection document for easy linking.
    bundle_random_id: { type: String, required: true },
    totalBgradeQty: {
      type: Number,
      default: 0,
      required: true
    },

    // Array to hold B-graded garments from this defect card
    bgradeArray: [bGradeGarmentSchema]
  },
  {
    collection: "qc2_bgrade",
    timestamps: true
  }
);

// A unique index on defect_print_id ensures only one B-Grade document per defect card
qc2BGradeSchema.index({ defect_print_id: 1 }, { unique: true });

export default function createQC2BGradeModel(connection) {
  return connection.model("QC2BGrade", qc2BGradeSchema);
}

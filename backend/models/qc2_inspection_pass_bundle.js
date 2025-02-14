import mongoose from 'mongoose';

const qc2InspectionPassBundleSchema = new mongoose.Schema(
  {
    bundleNo: { type: String, required: true }, // extracted from bundleData.bundle_id
    moNo: { type: String, required: true }, // from bundleData.selectedMono
    custStyle: { type: String, required: true }, // from bundleData.custStyle
    color: { type: String, required: true }, // from bundleData.color
    size: { type: String, required: true }, // from bundleData.size
    lineNo: { type: String, required: true }, // from bundleData.lineNo
    department: { type: String, required: true }, // from bundleData.department
    checkedQty: { type: Number, required: true }, // e.g. bundleData.count
    totalPass: { type: Number, required: true },
    totalRejects: { type: Number, required: true },
    defectQty: { type: Number, required: true },
    defectArray: [
      {
        defectName: { type: String, required: true },
        totalCount: { type: Number, required: true },
      },
    ],
    inspection_time: { type: String, required: true }, // "HH:MM:SS"
    inspection_date: { type: String, required: true }, // "MM/DD/YYYY"
  },
  { collection: "qc2_inspection_pass_bundle" }
);

export default (connection) => connection.model("QC2InspectionPassBundle", qc2InspectionPassBundleSchema);


import mongoose from "mongoose";

const defectSchema = new mongoose.Schema({
  defectCode: { type: String, required: true },
  defectName: { type: String, required: true },
  defectQty: { type: Number, required: true, default: 0 }
});

const qc1SunriseSchema = new mongoose.Schema({
  inspectionDate: { type: String, required: true }, // Format: MM/DD/YYYY
  lineNo: { type: String, required: true }, // From WorkLine
  MONo: { type: String, required: true },
  Size: { type: String, required: true }, // From SizeName
  Color: { type: String, required: true }, // From ColorName
  ColorNo: { type: String, required: true }, // From ColorNo
  Buyer: { type: String, required: true }, // Calculated field
  CheckedQtyT38: { type: Number, default: 0 }, // From TotalQtyT38
  CheckedQtyT39: { type: Number, default: 0 }, // From TotalQtyT39
  CheckedQty: { type: Number, required: true }, // Max of CheckedQtyT38 and CheckedQtyT39
  DefectArray: [defectSchema], // Array of defects
  totalDefectsQty: { type: Number, required: true, default: 0 } // Sum of defectQty in DefectArray
});

export default (connection) => connection.model("QC1Sunrise", qc1SunriseSchema);

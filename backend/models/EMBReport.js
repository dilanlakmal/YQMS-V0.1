import mongoose from "mongoose";

const defectDetailSchema = new mongoose.Schema(
  {
    no: { type: Number, required: true },
    defectNameEng: { type: String, required: true },
    defectNameKhmer: { type: String },
    defectNameChine: { type: String },
    count: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const MAX_REMARKS_LENGTH = 250;

const embReportSchema = new mongoose.Schema(
  {
    inspectionDate: { type: Date, required: true },
    factoryName: {
      type: String,
      required: true,
      enum: ["Tong Chai", "WEL", "Da Feng", "Sunwahyu"]
    },
    moNo: { type: String, required: true },
    buyer: { type: String },
    buyerStyle: { type: String },
    color: { type: String, required: true },
    batchNo: { type: String, required: true, match: /^[0-9]{3}$/ },
    tableNo: { type: String, required: true },
    actualLayers: { type: Number, required: true, min: 1 },
    totalBundle: { type: Number, required: true, min: 1 },
    totalPcs: { type: Number, required: true, min: 1 },

    aqlData: {
      type: { type: String, default: "General" },
      level: { type: String, default: "II" },
      sampleSizeLetterCode: { type: String },
      sampleSize: { type: Number, required: true, min: 0 },
      acceptDefect: { type: Number, required: true, min: 0 },
      rejectDefect: { type: Number, required: true, min: 0 }
    },

    defectsQty: { type: Number, required: true, default: 0 },
    defectRate: { type: Number, default: 0 },
    result: {
      type: String,
      enum: ["Pass", "Reject", "Pending"],
      required: true,
      default: "Pending"
    },
    defects: [defectDetailSchema],

    remarks: { type: String, default: "NA", maxlength: MAX_REMARKS_LENGTH },
    defectImageUrl: { type: String, default: null },

    emp_id: { type: String, required: true },
    emp_kh_name: { type: String },
    emp_eng_name: { type: String },
    emp_dept_name: { type: String },
    emp_sect_name: { type: String },
    emp_job_title: { type: String },
    inspectionTime: { type: String }
  },
  {
    timestamps: true,
    collection: "emb_inspection_reports"
  }
);

embReportSchema.index(
  {
    inspectionDate: 1,
    factoryName: 1,
    moNo: 1,
    color: 1,
    batchNo: 1,
    tableNo: 1
  },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

embReportSchema.pre("save", function (next) {
  if (this.remarks && this.remarks.trim() === "") {
    this.remarks = "NA";
  }
  this.defectsQty = this.defects.reduce((sum, defect) => sum + defect.count, 0);

  if (this.aqlData && this.aqlData.sampleSize > 0) {
    this.defectRate = this.defectsQty / this.aqlData.sampleSize; // Store as decimal
  } else {
    this.defectRate = 0;
  }

  if (
    this.aqlData &&
    this.aqlData.acceptDefect !== null &&
    this.aqlData.sampleSize > 0
  ) {
    this.result =
      this.defectsQty <= this.aqlData.acceptDefect ? "Pass" : "Reject";
  } else if (this.aqlData && this.aqlData.sampleSize === 0) {
    this.result = this.defectsQty === 0 ? "Pass" : "Reject";
  } else {
    this.result = "Pending";
  }
  next();
});

export default function createEMBReportModel(connection) {
  return connection.model("EMBReport", embReportSchema);
}

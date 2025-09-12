import mongoose from "mongoose";

const RemarkSchema = new mongoose.Schema({
  english: { type: String, required: true, trim: true },
  khmer: { type: String, trim: true },
  chinese: { type: String, trim: true }
}, { _id: false });

const OptionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  isDefault: { type: Boolean, default: false },
  isFail: { type: Boolean, default: false },
  hasRemark: { type: Boolean, default: false },
  remark: { type: RemarkSchema, default: null }
}, { _id: false });

const SubPointSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  optionType: { 
    type: String, 
    enum: ['passfail', 'custom'], 
    default: 'passfail' 
  },
  options: [OptionSchema]
  // Removed any parent reference - subPoints are self-contained
}, { _id: false });

const qcWashingCheckpointSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  optionType: { 
    type: String, 
    enum: ['passfail', 'custom'], 
    default: 'passfail' 
  },
  options: [OptionSchema],
  subPoints: [SubPointSchema], // Child components stored as objects array
  failureImpact: {
    type: String,
    enum: ["customize", "any", "all", "majority"],
    default: 'customize'
  },
  addedBy: {
    emp_id: { type: String, required: true },
    eng_name: { type: String, required: true }
  },
  updatedBy: {
    emp_id: { type: String },
    eng_name: { type: String }
  }
}, {
  collection: "qc_washing_checklist",
  timestamps: true
});

export default (connection) => connection.model("QCWashingCheckpoints", qcWashingCheckpointSchema);

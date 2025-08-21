import mongoose from "mongoose";

const MachineStandardSchema = new mongoose.Schema({
  washType: { type: String, enum: ['Normal Wash', 'Acid Wash', 'Garment Dye','Soft Wash'], required: true },
  washingMachine: {
    temperature: Number,
    time: Number,
    silicon: Number,
    softener: Number,
  },
  tumbleDry: {
    temperature: Number,
    time: Number,
  }
}, { timestamps: true });

export default (connection) => connection.model("QCWashingMachineStandard", MachineStandardSchema);

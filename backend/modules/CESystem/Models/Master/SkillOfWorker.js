import mongoose from "mongoose";

const skillOfWorkerSchema = new mongoose.Schema(
  {
    Machine_Name: { type: String },
    AllSewing_Worker: { type: Number },
    lines: {
      Line01: { type: Number },
      Line02: { type: Number },
      Line03: { type: Number },
      Line04: { type: Number },
      Line05: { type: Number },
      Line06: { type: Number },
      Line07: { type: Number },
      Line08: { type: Number },
      Line09: { type: Number },
      Line10: { type: Number },
      Line11: { type: Number },
      Line12: { type: Number },
      Line13: { type: Number },
      Line14: { type: Number },
      Line15: { type: Number },
      Line16: { type: Number },
      Line17: { type: Number },
      Line18: { type: Number },
      Line19: { type: Number },
      Line20: { type: Number },
      Line21: { type: Number },
      Line22: { type: Number },
      Line23: { type: Number },
      Line24: { type: Number },
      Line25: { type: Number },
      Line26: { type: Number },
      Line27: { type: Number },
      Line28: { type: Number },
      Line29: { type: Number },
      Line30: { type: Number },
      Line31: { type: Number },
      Line32: { type: Number },
      Line33: { type: Number },
      Line34: { type: Number },
      Line35: { type: Number }
    }
  },
  {
    timestamps: true
  }
);

export default (connection) => connection.models.ce_skillofworker ||
  connection.model("ce_skillofworker", skillOfWorkerSchema, "ce_skillofworker");


import mongoose from "mongoose";

const qcWashingFirstOutputSchema = new mongoose.Schema(
  {
    style: { type: String, required: true },
    quantity: { type: Number, required: true },
    addedBy: {
      emp_id: String,
      eng_name: String,
    },
    updatedBy: {
      emp_id: String,
      eng_name: String,
    },
  },
  {
    collection: "qc_washing_first_outputs",
    timestamps: true
  }
);


export default (connection) => connection.model("QCWashingFirstOutput", qcWashingFirstOutputSchema);

import mongoose from "mongoose";

const ieWorkerTaskSchema = new mongoose.Schema(
  {
    emp_id: { type: String, required: true, unique: true, index: true },
    emp_code: { type: String, required: true },
    // This will store an array of task numbers assigned to the worker
    tasks: { type: [Number], default: [] }
  },
  {
    collection: "ie_worker_tasks",
    timestamps: true
  }
);

export default (connection) =>
  connection.model("IEWorkerTask", ieWorkerTaskSchema);

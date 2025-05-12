// d:\Yash\Projects\YQMS\YQMS-V0.1\backend\models\LineSewingWorker.js
import mongoose from "mongoose";

const historyEntrySchema = new mongoose.Schema({
    edited_worker_count: { type: Number, required: true },
    // updated_by_emp_id: { type: String, required: true },
    // updated_by_eng_name: { type: String, required: true },
    updated_at: { type: Date, required: true }
}, { _id: false });

const lineSewingWorkerSchema = new mongoose.Schema({
    line_no: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    real_worker_count: { type: Number, required: true },
    edited_worker_count: {
        type: Number,
        required: true,
        min: 0
    },
    
    updated_at: {
        type: Date,
        default: Date.now
    },
    history: [historyEntrySchema] // Array to store edit history
}, { timestamps: true }); // Adds createdAt and updatedAt automatically

const createLineSewingWorkerModel = (connection) => {
    return connection.model("LineSewingWorker", lineSewingWorkerSchema, "line_sewing_workers");
};

export default createLineSewingWorkerModel;

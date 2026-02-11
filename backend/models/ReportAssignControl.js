import mongoose from "mongoose";

const reportAssignControlSchema = new mongoose.Schema(
    {
        // Store both ID and name to avoid lookup issues
        preparedBy: {
            type: String,
            default: null
        },
        preparedByName: {
            type: String,
            default: null
        },
        checkedBy: {
            type: String,
            default: null
        },
        checkedByName: {
            type: String,
            default: null
        },
        approvedBy: {
            type: String,
            default: null
        },
        approvedByName: {
            type: String,
            default: null
        },
        updatedAt: { type: Date, default: Date.now }
    },
    {
        timestamps: true
    }
);

export default function createReportAssignControlModel(connection) {
    return connection.model("ReportAssignControl", reportAssignControlSchema, "report_assign_control");
}

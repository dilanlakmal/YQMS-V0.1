import mongoose from "mongoose";

const reportAssignControlSchema = new mongoose.Schema(
    {
        checkedBy: { type: String, default: null },
        approvedBy: { type: String, default: null },
        updatedAt: { type: Date, default: Date.now }
    },
    {
        timestamps: true
    }
);

export default function createReportAssignControlModel(connection) {
    return connection.model("ReportAssignControl", reportAssignControlSchema, "report_assign_control");
}

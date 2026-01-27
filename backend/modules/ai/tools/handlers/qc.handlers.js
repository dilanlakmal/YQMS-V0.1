import { ymEcoConnection } from "../../../MongoDB/dbConnectionController.js";
import createQCAccuracyReportModel from "../../../models/production/qc_accuracy_report.model.js";

// We need to initialize the model with the connection
const QCAccuracyReport = createQCAccuracyReportModel(ymEcoConnection);

/**
 * Handlers contain the actual logic that interacts with the system.
 */

export const getMoNumbers = async () => {
    try {
        const docs = await QCAccuracyReport.find({}, { moNo: 1, _id: 0 });
        const moNumbers = [...new Set(docs.map(doc => doc.moNo))];
        return moNumbers;
    } catch (error) {
        console.error("AI Tool [getMoNumbers] Error:", error);
        return [];
    }
};

export const getReportSummaryByMO = async ({ moNo }) => {
    try {
        const reports = await QCAccuracyReport.find({ moNo });
        if (!reports.length) return `No reports found for MO: ${moNo}`;

        const totalChecked = reports.reduce((sum, r) => sum + (r.checkedQty || 0), 0);
        const totalDefects = reports.reduce((sum, r) => sum + (r.totalDefects || 0), 0);

        return {
            moNo,
            reportCount: reports.length,
            totalChecked,
            totalDefects,
            passRate: totalChecked > 0 ? ((totalChecked - totalDefects) / totalChecked * 100).toFixed(2) + "%" : "0%"
        };
    } catch (error) {
        console.error("AI Tool [getReportSummaryByMO] Error:", error);
        return "Error fetching report summary.";
    }
};

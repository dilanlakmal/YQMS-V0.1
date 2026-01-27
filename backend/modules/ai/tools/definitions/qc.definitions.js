import { defineTool, createParams, createProperty } from "../tool.builder.js";

/**
 * Definitions describe the tools to the AI (Name, Description, Parameters).
 */

export const getMoNumbersDefinition = defineTool(
    "get_mo_numbers",
    "Retrieves a list of all unique Manufacturing Order (MO) numbers available in the QC Accuracy reports."
);

export const getReportSummaryByMODefinition = defineTool(
    "get_report_summary_by_mo",
    "Provides a summary of QC accuracy statistics (total checked, defects, pass rate) for a specific Manufacturing Order number.",
    createParams(
        ["moNo"],
        {
            moNo: createProperty("string", "The Manufacturing Order number to look up.")
        }
    )
);

export const qcToolsDefinition = [
    getMoNumbersDefinition,
    getReportSummaryByMODefinition
];

import bcrypt from "bcrypt";
import {
  QCRovingPairing,                
} from "../../Config/mongodb.js";

// --- Endpoint to get dynamic filter options ---
export const getDynamicFilterOptions = async (req, res) => {
    try {
    const { date } = req.query; // Expecting date in 'M/D/YYYY' format
    if (!date) {
      return res.status(400).json({ message: "Date is a required parameter." });
    }

    const matchQuery = { inspection_date: date };

    const [uniqueQCs, uniqueOperators, uniqueLines, uniqueMOs] =
      await Promise.all([
        // Get unique QC IDs (emp_id)
        QCRovingPairing.distinct("emp_id", matchQuery),
        // Get unique Operator IDs (operator_emp_id)
        QCRovingPairing.distinct("pairingData.operator_emp_id", matchQuery),
        // Get unique Line Numbers
        QCRovingPairing.distinct("lineNo", matchQuery),
        // Get unique MO Numbers
        QCRovingPairing.distinct("moNo", matchQuery)
      ]);

    res.json({
      qcIds: uniqueQCs.sort(),
      operatorIds: uniqueOperators.sort(),
      lineNos: uniqueLines.sort((a, b) => Number(a) - Number(b)),
      moNos: uniqueMOs.sort()
    });
  } catch (error) {
    console.error("Error fetching filter options for Roving Pairing:", error);
    res.status(500).json({
      message: "Failed to fetch filter options.",
      error: error.message
    });
  }
};

// --- Endpoint to get aggregated data for the report table ---
export const getRovingPairingReportData = async (req, res) => {
  try {
    const { date, qcId, operatorId, lineNo, moNo } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Date is required." });
    }

    // Build the initial match pipeline stage
    const matchPipeline = { inspection_date: date };
    if (qcId) matchPipeline.emp_id = qcId;
    if (lineNo) matchPipeline.lineNo = lineNo;
    if (moNo) matchPipeline.moNo = moNo;

    const pipeline = [{ $match: matchPipeline }, { $unwind: "$pairingData" }];

    if (operatorId) {
      pipeline.push({
        $match: { "pairingData.operator_emp_id": operatorId }
      });
    }

    pipeline.push({
      $group: {
        _id: {
          operatorId: "$pairingData.operator_emp_id",
          lineNo: "$lineNo",
          moNo: "$moNo"
        },
        operatorName: { $first: "$pairingData.operator_eng_name" },
        inspections: {
          $push: {
            rep_name: "$pairingData.inspection_rep_name",
            accessoryComplete: "$pairingData.accessoryComplete",
            totalSummary: "$pairingData.totalSummary"
          }
        }
      }
    });

    // **** START OF CORRECTION ****
    // The keys being accessed here now correctly match the keys defined in the $group stage's _id object.
    pipeline.push({
      $project: {
        _id: 0,
        operatorId: "$_id.operatorId", // Was "$_id.opId"
        lineNo: "$_id.lineNo", // Was "$_id.line"
        moNo: "$_id.moNo", // Was "$_id.mo"
        operatorName: "$operatorName",
        inspections: "$inspections"
      }
    });
    // **** END OF CORRECTION ****

    pipeline.push({ $sort: { lineNo: 1, moNo: 1, operatorId: 1 } });

    const reportData = await QCRovingPairing.aggregate(pipeline);

    res.json(reportData);
  } catch (error) {
    console.error("Error fetching report data for Roving Pairing:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch report data.", error: error.message });
  }
};
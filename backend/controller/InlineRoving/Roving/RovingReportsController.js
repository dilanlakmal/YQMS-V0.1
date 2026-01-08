import {
 QCInlineRoving,
} from "../../MongoDB/dbConnectionController.js";
import {
    normalizeDateString,
    getBuyerFromMoNumber,
 } from "../../../helpers/helperFunctions.js";



 /* ------------------------------
   QC Inline Roving New
------------------------------ */

// Roving data filter function
export const getFilterQCInlineRoving = async (req, res) => {
  try {
    const { inspection_date, qcId, operatorId, lineNo, moNo } = req.query;

    let queryConditions = {};

    if (inspection_date) {
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(inspection_date)) {
        const parts = inspection_date.split("/");

        const month = parseInt(parts[0], 10);
        const day = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);

        const monthRegexPart = month < 10 ? `0?${month}` : `${month}`;
        const dayRegexPart = day < 10 ? `0?${day}` : `${day}`;

        const dateRegex = new RegExp(
          `^${monthRegexPart}\\/${dayRegexPart}\\/${year}$`
        );
        queryConditions.inspection_date = { $regex: dateRegex };
      } else {
        console.warn(
          "Received date for filtering is not in MM/DD/YYYY format:",
          inspection_date,
          "- Date filter will not be applied effectively."
        );
      }
    }

    if (qcId) {
      queryConditions.emp_id = qcId;
    }

    if (lineNo) {
      queryConditions.line_no = lineNo;
    }

    if (moNo) {
      queryConditions.mo_no = moNo;
    }

    if (operatorId) {
      const orConditions = [{ operator_emp_id: operatorId }];
      if (/^\d+$/.test(operatorId)) {
        orConditions.push({ operator_emp_id: parseInt(operatorId, 10) });
      }
      queryConditions.inlineData = { $elemMatch: { $or: orConditions } };
    }

    const reports = await QCInlineRoving.find(queryConditions);

    res.json(reports);
  } catch (error) {
    console.error("Error fetching filtered QC inline roving reports:", error);
    res.status(500).json({
      message: "Failed to fetch filtered reports",
      error: error.message
    });
  }
};

// Endpoint to fetch QC Inline Roving reports
export const getQCRovingReports = async (req, res) => {
    try {
    const reports = await QCInlineRoving.find();
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: "Error fetching reports", error });
  }
};

// New endpoint to fetch filtered QC Inline Roving reports with date handling
export const getFilteredQCRovingReports = async (req, res) => {
    try {
        const { startDate, endDate, line_no, mo_no, emp_id, buyer_name } =
          req.query;

        let match = {};

        // Date filtering using $expr for string dates
        if (startDate || endDate) {
          match.$expr = match.$expr || {};
          match.$expr.$and = match.$expr.$and || [];
          if (startDate) {
            const normalizedStartDate = normalizeDateString(startDate);
            match.$expr.$and.push({
              $gte: [
                {
                  $dateFromString: {
                    dateString: "$inspection_date",
                    format: "%m/%d/%Y"
                  }
                },
                {
                  $dateFromString: {
                    dateString: normalizedStartDate,
                    format: "%m/%d/%Y"
                  }
                }
              ]
            });
          }
          if (endDate) {
            const normalizedEndDate = normalizeDateString(endDate);
            match.$expr.$and.push({
              $lte: [
                {
                  $dateFromString: {
                    dateString: "$inspection_date",
                    format: "%m/%d/%Y"
                  }
                },
                {
                  $dateFromString: {
                    dateString: normalizedEndDate,
                    format: "%m/%d/%Y"
                  }
                }
              ]
            });
          }
        }

        // Other filters
        if (line_no) {
          match.line_no = line_no;
        }
        if (mo_no) {
          match.mo_no = mo_no;
        }
        // In the report, qcId is passed as emp_id
        if (emp_id) {
          match["inspection_rep.emp_id"] = emp_id;
        }

        // First, fetch reports using the filters that can be applied at the database level
        const reportsFromDb = await QCInlineRoving.find(match);

        // *** NEW LOGIC: Apply the derived buyer filter after fetching from DB ***
        let finalFilteredReports = reportsFromDb;

        if (buyer_name) {
          finalFilteredReports = reportsFromDb.filter((report) => {
            // For each report, determine the buyer from its MO number
            const derivedBuyer = getBuyerFromMoNumber(report.mo_no);
            // Keep the report only if its derived buyer matches the filter
            return derivedBuyer === buyer_name;
          });
        }

        // Send the final, fully filtered data to the client
        res.json(finalFilteredReports);

        // const reports = await QCInlineRoving.find(match);
        // res.json(reports);
      } catch (error) {
        console.error("Error fetching filtered roving reports:", error);
        res.status(500).json({ message: "Error fetching filtered reports", error });
      }
};

// Endpoint to fetch distinct MO Nos
export const getQCInlineRovingMOs = async (req, res) => {
   try {
    const moNos = await QCInlineRoving.distinct("mo_no");
    res.json(moNos.filter((mo) => mo)); // Filter out null/empty values
  } catch (error) {
    console.error("Error fetching MO Nos:", error);
    res.status(500).json({ message: "Failed to fetch MO Nos" });
  }
};

import bcrypt from "bcrypt";
import {
 QCInlineRoving,
 LineSewingWorker,                
} from "../../Config/mongodb.js";
import { 
    getOrdinal,
    normalizeDateString,
    determineBuyerRoving,
 } from "../../Helpers/helperFunction.js";



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
        const { startDate, endDate, line_no, mo_no, emp_id } = req.query;
    
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
        if (emp_id) {
          match.emp_id = emp_id;
        }
    
        const reports = await QCInlineRoving.find(match);
        res.json(reports);
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

// Endpoint to fetch distinct Buyer Names for Roving Report filters
export const getQCInlineRovingBuyers = async (req, res) => {
    try {
        const buyers = await QCInlineRoving.distinct("buyer_name");
        res.json(buyers.filter(b => b).sort()); // Filter out null/empty and sort
      } catch (error) {
        console.error("Error fetching buyers for Roving Report:", error);
        res.status(500).json({ message: "Error fetching buyers", error: error.message });
      }
};

// Endpoint to fetch distinct Operation Names from inlineData for Roving Report filters
export const getQCInlineRovingOperations = async (req, res) => {
    try {
        const operations = await QCInlineRoving.aggregate([
          { $unwind: "$inlineData" },
          { $match: { "inlineData.operation_name": { $ne: null, $ne: "" } } }, // Ensure operation_name exists and is not empty
          { $group: { _id: "$inlineData.operation_name" } },
          { $sort: { _id: 1 } },
          { $project: { _id: 0, operation_name: "$_id" } }
        ]);
        res.json(operations.map(op => op.operation_name));
      } catch (error)
     {
        console.error("Error fetching operations for Roving Report:", error);
        res.status(500).json({ message: "Error fetching operations", error: error.message });
      }
};

// Endpoint to fetch distinct QC IDs (emp_id)
export const getQCInlineRovingQCIDs = async (req, res) => {
    try {
        const qcIds = await QCInlineRoving.distinct("emp_id");
        res.json(qcIds.filter((id) => id)); // Filter out null/empty values
      } catch (error) {
        console.error("Error fetching QC IDs:", error);
        res.status(500).json({ message: "Failed to fetch QC IDs" });
      }
};

//Save the inline Roving data
export const saveQCInlineRovingData = async (req, res) => {
    try {
        const {
          inspection_date,
          mo_no,
          line_no,
          report_name,
          inspection_rep_item,
        } = req.body;
    
        if (!inspection_date || !mo_no || !line_no || !inspection_rep_item) {
          return res
            .status(400)
            .json({
              message:
                "Missing required fields: inspection_date, mo_no, line_no, or inspection_rep_item.",
            });
        }
    
        if (typeof inspection_rep_item !== "object" || inspection_rep_item === null) {
          return res
            .status(400)
            .json({ message: "inspection_rep_item must be a valid object." });
        }
    
        if (
          !inspection_rep_item.inspection_rep_name ||
          !inspection_rep_item.emp_id ||
          !inspection_rep_item.eng_name
        ) {
          return res
            .status(400)
            .json({
              message:
                "inspection_rep_item is missing required fields like inspection_rep_name, emp_id, or eng_name.",
            });
        }
    
        let doc = await QCInlineRoving.findOne({ inspection_date, mo_no, line_no });
    
        if (doc) {
          const existingRepIndex = doc.inspection_rep.findIndex(
            (rep) => rep.inspection_rep_name === inspection_rep_item.inspection_rep_name
          );
    
          if (existingRepIndex !== -1) {
            const repToUpdate = doc.inspection_rep[existingRepIndex];
    
            if (!Array.isArray(repToUpdate.inlineData)) {
              repToUpdate.inlineData = [];
            }
    
            if (inspection_rep_item.inlineData && inspection_rep_item.inlineData.length > 0) {
              repToUpdate.inlineData.push(inspection_rep_item.inlineData[0]);
            }
    
            repToUpdate.inspection_rep_name = inspection_rep_item.inspection_rep_name;
            repToUpdate.emp_id = inspection_rep_item.emp_id;
            repToUpdate.eng_name = inspection_rep_item.eng_name;
            repToUpdate.complete_inspect_operators = repToUpdate.inlineData.length;
            repToUpdate.Inspect_status =
              repToUpdate.total_operators > 0 &&
              repToUpdate.complete_inspect_operators >= repToUpdate.total_operators
                ? "Completed"
                : "Not Complete";
          } else {
            if (doc.inspection_rep.length < 5) {
              const newRepItem = { ...inspection_rep_item };
              if (!Array.isArray(newRepItem.inlineData)) {
                newRepItem.inlineData = [];
              }
    
              newRepItem.complete_inspect_operators = newRepItem.inlineData.length;
              newRepItem.Inspect_status =
                newRepItem.total_operators > 0 &&
                newRepItem.complete_inspect_operators >= newRepItem.total_operators
                  ? "Completed"
                  : "Not Complete";
    
              doc.inspection_rep.push(newRepItem);
            } else {
              return res
                .status(400)
                .json({
                  message:
                    "Maximum number of 5 inspection reports already recorded for this combination.",
                });
            }
          }
    
          if (report_name && doc.report_name !== report_name) {
            doc.report_name = report_name;
          }
    
          await doc.save();
          res.status(200).json({
            message: "QC Inline Roving data updated successfully.",
            data: doc,
          });
        } else {
          const lastDoc = await QCInlineRoving.findOne()
            .sort({ inline_roving_id: -1 })
            .select("inline_roving_id");
    
          const newId =
            lastDoc && typeof lastDoc.inline_roving_id === "number"
              ? lastDoc.inline_roving_id + 1
              : 1;
    
          const initialRepItem = { ...inspection_rep_item };
          if (!Array.isArray(initialRepItem.inlineData)) {
            initialRepItem.inlineData = [];
          }
    
          initialRepItem.complete_inspect_operators = initialRepItem.inlineData.length;
          initialRepItem.Inspect_status =
            initialRepItem.total_operators > 0 &&
            initialRepItem.complete_inspect_operators >= initialRepItem.total_operators
              ? "Completed"
              : "Not Complete";
    
          const newQCInlineRovingDoc = new QCInlineRoving({
            inline_roving_id: newId,
            report_name:
              report_name || `Report for ${inspection_date} - ${line_no} - ${mo_no}`,
            inspection_date,
            mo_no,
            line_no,
            inspection_rep: [initialRepItem],
          });
    
          await newQCInlineRovingDoc.save();
          res.status(201).json({
            message: "QC Inline Roving data saved successfully (new record created).",
            data: newQCInlineRovingDoc,
          });
        }
      } catch (error) {
        console.error("Error saving/updating QC Inline Roving data:", error);
        res.status(500).json({
          message: "Failed to save/update QC Inline Roving data",
          error: error.message,
        });
      }
};

//Get the inspection Number
export const getInspectionNumber = async (req, res) => {
    try {
        const { line_no, inspection_date } = req.query;
        if (!line_no || !inspection_date) {
          return res
            .status(400)
            .json({ message: "Line number and inspection date are required." });
        }
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(inspection_date)) {
          return res
            .status(400)
            .json({ message: "Invalid inspection date format. Expected MM/DD/YYYY." });
        }
    
        const lineWorkerInfo = await LineSewingWorker.findOne({ line_no });
    
        if (!lineWorkerInfo) {
          return res.json({ inspectionTimeOrdinal: "N/A (Line not configured)" });
        }
    
        const target_worker_count = lineWorkerInfo.edited_worker_count;
    
        if (target_worker_count === 0) {
          return res.json({ inspectionTimeOrdinal: "N/A (Target 0 workers)" });
        }
    
        const rovingRecords = await QCInlineRoving.find({
          line_no: line_no,
          inspection_date: inspection_date,
        });
    
        if (rovingRecords.length === 0) {
          return res.json({ inspectionTimeOrdinal: getOrdinal(1) });
        }
    
        const operatorInspectionCounts = {};
    
        rovingRecords.forEach((record) => {
          record.inlineData.forEach((entry) => {
            const operatorId = entry.operator_emp_id;
            if (operatorId) {
              operatorInspectionCounts[operatorId] =
                (operatorInspectionCounts[operatorId] || 0) + 1;
            }
          });
        });
    
        if (Object.keys(operatorInspectionCounts).length === 0) {
          return res.json({ inspectionTimeOrdinal: getOrdinal(1) });
        }
    
        let completed_rounds = 0;
    
        for (let round_num = 1; round_num <= 5; round_num++) {
          let operators_finished_this_round = 0;
    
          for (const operator_id in operatorInspectionCounts) {
            if (operatorInspectionCounts[operator_id] >= round_num) {
              operators_finished_this_round++;
            }
          }
    
          if (operators_finished_this_round >= target_worker_count) {
            completed_rounds = round_num;
          } else {
            break;
          }
        }
    
        const current_inspection_time_number = completed_rounds + 1;
    
        const ordinal =
          current_inspection_time_number > 5
            ? `${getOrdinal(5)} (Completed)`
            : getOrdinal(current_inspection_time_number);
    
        res.json({ inspectionTimeOrdinal: ordinal });
      } catch (error) {
        console.error("Error fetching inspection time info:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch inspection time info.", error: error.message });
      }
};

//Get the completed inspect operators
export const getCompletedInspectOperators = async (req, res) => {
    const { line_no, inspection_date, mo_no, operation_id, inspection_rep_name } =
        req.query;
    
      try {
        const findQuery = {
          line_no,
          inspection_date,
        };
    
        if (mo_no) {
          findQuery.mo_no = mo_no;
        }
    
        const elemMatchConditions = { inspection_rep_name };
    
        if (operation_id) {
          elemMatchConditions["inlineData.tg_no"] = operation_id;
        }
    
        findQuery.inspection_rep = { $elemMatch: elemMatchConditions };
    
        const inspection = await QCInlineRoving.findOne(findQuery);
    
        if (!inspection) {
          return res.json({ completeInspectOperators: 0 });
        }
    
        const specificRep = inspection.inspection_rep.find(
          (rep) => rep.inspection_rep_name === inspection_rep_name
        );
    
        if (!specificRep) {
          return res.json({ completeInspectOperators: 0 });
        }
    
        const completeInspectOperators = specificRep.complete_inspect_operators || 0;
    
        res.json({ completeInspectOperators });
      } catch (error) {
        console.error("Error fetching inspections completed:", error);
        res.status(500).json({ message: "Internal server error" });
      }
};

// Endpoint for get the buyer status
export const getBuyerStatus = async (req, res) => {
    const { moNo } = req.query;
      if (!moNo) {
        return res.status(400).json({ message: "MO number is required" });
      }
      const buyerName = determineBuyerRoving(moNo);
      res.json({ buyerName });
};

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
  
          const dateRegex = new RegExp(`^${monthRegexPart}\\/${dayRegexPart}\\/${year}$`);
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
      res
        .status(500)
        .json({ message: "Failed to fetch filtered reports", error: error.message });
    }
};

// Updated Endpoint to Search MO Numbers (St_No) from inline_orders in MongoDB with partial matching
export const searchMoNumbers = async (req, res) => {
  try {
    const searchTerm = req.query.search; // Get the search term from query params
    if (!searchTerm) {
      return res.status(400).json({ error: "Search term is required" });
    }

    // Use a case-insensitive regex to match the term anywhere in St_No
    const regexPattern = new RegExp(searchTerm, "i");
    const { InlineOrders } = await import("../../Config/mongodb.js");

    // Query the inline_orders collection
    const results = await InlineOrders.find({
      St_No: { $regex: regexPattern }
    })
      .select("St_No") // Only return the St_No field (equivalent to .project({ St_No: 1, _id: 0 }))
      .limit(100) // Limit results to prevent overwhelming the UI
      .sort({ St_No: 1 }) // Sort alphabetically
      .exec();

    // Extract unique St_No values
    const uniqueMONos = [...new Set(results.map((r) => r.St_No))];

    res.json(uniqueMONos);
  } catch (err) {
    console.error("Error fetching MO numbers from inline_orders:", err);
    res.status(500).json({
      message: "Failed to fetch MO numbers from inline_orders",
      error: err.message
    });
  }
};

// New Endpoint to Fetch Inline Order Details for a given MO No (St_No)
export const getInlineOrderDetails = async (req, res) => {
  try {
    const stNo = req.query.stNo;
    if (!stNo) {
      return res.status(400).json({ error: "St_No is required" });
    }

    const { InlineOrders } = await import("../../Config/mongodb.js");

    // Find the document where St_No matches
    const document = await InlineOrders.findOne({ St_No: stNo }).exec();

    if (!document) {
      return res.status(404).json({ error: "MO No not found" });
    }

    res.json(document);
  } catch (err) {
    console.error("Error fetching Inline Order details:", err);
    res.status(500).json({
      message: "Failed to fetch Inline Order details",
      error: err.message
    });
  }
};
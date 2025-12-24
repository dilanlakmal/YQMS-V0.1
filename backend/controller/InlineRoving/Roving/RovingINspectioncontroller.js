import {
 UserMain,
 LineSewingWorker, 
 QCInlineRoving,               
} from "../../MongoDB/dbConnectionController.js";

import { 
    getBuyerFromMoNumber,
 } from "../../../helpers/helperFunctions.js";

/* ------------------------------
   QC Inline Roving New
------------------------------ */
// Endpoint for get the buyer status
export const getBuyerStatus = async (req, res) => {
     const { moNo } = req.query;
  if (!moNo) {
    return res.status(400).json({ message: "MO number is required" });
  }

  const buyerName = getBuyerFromMoNumber(moNo);

  res.json({ buyerName })
};

//get the each line related working worker count
export const getLineSummary = async (req, res) => {
    try {
    const lineSummaries = await UserMain.aggregate([
      {
        $match: {
          sect_name: { $ne: null, $ne: "" },
          working_status: "Working",
          job_title: "Sewing Worker"
        }
      },
      {
        $group: {
          _id: "$sect_name",
          worker_count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          line_no: "$_id",
          real_worker_count: "$worker_count"
        }
      },
      { $sort: { line_no: 1 } }
    ]);

    const editedCountsDocs = await LineSewingWorker.find(
      {},
      "line_no edited_worker_count"
    ).lean();

    const editedCountsMap = new Map(
      editedCountsDocs.map((doc) => [doc.line_no, doc.edited_worker_count])
    );

    const mergedSummaries = lineSummaries.map((realSummary) => ({
      ...realSummary,
      edited_worker_count: editedCountsMap.get(realSummary.line_no)
    }));

    res.json(mergedSummaries);
  } catch (error) {
    console.error("Error fetching line summary:", error);
    res.status(500).json({
      message: "Failed to fetch line summary data.",
      error: error.message
    });
  }
};

//Get the completed inspect operators
export const getCompletedInspectOperators = async (req, res) => {
    const { line_no, inspection_date, mo_no, operation_id, inspection_rep_name } =
    req.query;

  try {
    const findQuery = {
      line_no,
      inspection_date
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

    const completeInspectOperators =
      specificRep.complete_inspect_operators || 0;

    res.json({ completeInspectOperators });
  } catch (error) {
    console.error("Error fetching inspections completed:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//Edit the line worker count
export const editLineWorker = async (req, res) => {
    const { lineNo } = req.params;
  const { edited_worker_count } = req.body;

  if (
    typeof edited_worker_count !== "number" ||
    edited_worker_count < 0 ||
    !Number.isInteger(edited_worker_count)
  ) {
    return res
      .status(400)
      .json({ message: "Edited worker count must be a non-negative integer." });
  }
  try {
    const now = new Date();
    const realCountResult = await UserMain.aggregate([
      {
        $match: {
          sect_name: lineNo,
          working_status: "Working",
          job_title: "Sewing Worker"
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 }
        }
      }
    ]);

    const current_real_worker_count =
      realCountResult.length > 0 ? realCountResult[0].count : 0;

    const historyEntry = {
      edited_worker_count,
      updated_at: now
    };

    const updatedLineWorker = await LineSewingWorker.findOneAndUpdate(
      { line_no: lineNo },
      {
        $set: {
          real_worker_count: current_real_worker_count,
          edited_worker_count,
          updated_at: now
        },
        $push: { history: historyEntry }
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      message: "Line worker count updated successfully.",
      data: updatedLineWorker
    });
  } catch (error) {
    console.error(
      `Error updating line worker count for line ${lineNo}:`,
      error
    );
    res.status(500).json({
      message: "Failed to update line worker count.",
      error: error.message
    });
  }
};

export const saveQCInlineRovingData = async (req, res) => {
    try {
    const {
      inspection_date,
      mo_no,
      line_no,
      report_name,
      inspection_rep_item
    } = req.body;

    if (!inspection_date || !mo_no || !line_no || !inspection_rep_item) {
      return res.status(400).json({
        message:
          "Missing required fields: inspection_date, mo_no, line_no, or inspection_rep_item."
      });
    }

    if (
      typeof inspection_rep_item !== "object" ||
      inspection_rep_item === null
    ) {
      return res
        .status(400)
        .json({ message: "inspection_rep_item must be a valid object." });
    }

    if (
      !inspection_rep_item.inspection_rep_name ||
      !inspection_rep_item.emp_id ||
      !inspection_rep_item.eng_name
    ) {
      return res.status(400).json({
        message:
          "inspection_rep_item is missing required fields like inspection_rep_name, emp_id, or eng_name."
      });
    }

    let doc = await QCInlineRoving.findOne({ inspection_date, mo_no, line_no });

    if (doc) {
      const existingRepIndex = doc.inspection_rep.findIndex(
        (rep) =>
          rep.inspection_rep_name === inspection_rep_item.inspection_rep_name
      );

      if (existingRepIndex !== -1) {
        const repToUpdate = doc.inspection_rep[existingRepIndex];

        if (!Array.isArray(repToUpdate.inlineData)) {
          repToUpdate.inlineData = [];
        }

        if (
          inspection_rep_item.inlineData &&
          inspection_rep_item.inlineData.length > 0
        ) {
          repToUpdate.inlineData.push(inspection_rep_item.inlineData[0]);
        }

        repToUpdate.inspection_rep_name =
          inspection_rep_item.inspection_rep_name;
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
          return res.status(400).json({
            message:
              "Maximum number of 5 inspection reports already recorded for this combination."
          });
        }
      }

      if (report_name && doc.report_name !== report_name) {
        doc.report_name = report_name;
      }

      await doc.save();
      res.status(200).json({
        message: "QC Inline Roving data updated successfully.",
        data: doc
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

      initialRepItem.complete_inspect_operators =
        initialRepItem.inlineData.length;
      initialRepItem.Inspect_status =
        initialRepItem.total_operators > 0 &&
        initialRepItem.complete_inspect_operators >=
          initialRepItem.total_operators
          ? "Completed"
          : "Not Complete";

      const newQCInlineRovingDoc = new QCInlineRoving({
        inline_roving_id: newId,
        report_name:
          report_name ||
          `Report for ${inspection_date} - ${line_no} - ${mo_no}`,
        inspection_date,
        mo_no,
        line_no,
        inspection_rep: [initialRepItem]
      });

      await newQCInlineRovingDoc.save();
      res.status(201).json({
        message:
          "QC Inline Roving data saved successfully (new record created).",
        data: newQCInlineRovingDoc
      });
    }
  } catch (error) {
    console.error("Error saving/updating QC Inline Roving data:", error);
    res.status(500).json({
      message: "Failed to save/update QC Inline Roving data",
      error: error.message
    });
  }
};
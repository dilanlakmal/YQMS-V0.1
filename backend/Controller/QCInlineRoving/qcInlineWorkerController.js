import bcrypt from "bcrypt";
import {
 UserMain,
 LineSewingWorker,                
} from "../../Config/mongodb.js";

/* ------------------------------
   QC Inline Roving New
------------------------------ */

//get the each line related working worker count
export const getLineSummary = async (req, res) => {
    try {
        const lineSummaries = await UserMain.aggregate([
          {
            $match: {
              sect_name: { $ne: null, $ne: "" },
              working_status: "Working",
              job_title: "Sewing Worker",
            },
          },
          {
            $group: {
              _id: "$sect_name",
              worker_count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              line_no: "$_id",
              real_worker_count: "$worker_count",
            },
          },
          { $sort: { line_no: 1 } },
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
          edited_worker_count: editedCountsMap.get(realSummary.line_no),
        }));
    
        res.json(mergedSummaries);
      } catch (error) {
        console.error("Error fetching line summary:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch line summary data.", error: error.message });
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
              job_title: "Sewing Worker",
            },
          },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
            },
          },
        ]);
    
        const current_real_worker_count =
          realCountResult.length > 0 ? realCountResult[0].count : 0;
    
        const historyEntry = {
          edited_worker_count,
          updated_at: now,
        };
    
        const updatedLineWorker = await LineSewingWorker.findOneAndUpdate(
          { line_no: lineNo },
          {
            $set: {
              real_worker_count: current_real_worker_count,
              edited_worker_count,
              updated_at: now,
            },
            $push: { history: historyEntry },
          },
          { new: true, upsert: true, runValidators: true }
        );
    
        res.json({
          message: "Line worker count updated successfully.",
          data: updatedLineWorker,
        });
      } catch (error) {
        console.error(`Error updating line worker count for line ${lineNo}:`, error);
        res
          .status(500)
          .json({ message: "Failed to update line worker count.", error: error.message });
      }
};
import { 
  CuttingInspection,
} from "../MongoDB/dbConnectionController.js";
import { buildReportMatchPipeline } from "../../Helpers/helperFunctions.js";

// GET Dynamic Filter Options for the Report Page
export const getDynamicFilterOptions = async (req, res) => {
  try {
      const pipeline = buildReportMatchPipeline(req.query);
  
      pipeline.push({
        $facet: {
          moNos: [
            { $group: { _id: "$moNo" } },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, value: "$_id", label: "$_id" } }
          ],
          tableNos: [
            { $group: { _id: "$tableNo" } },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, value: "$_id", label: "$_id" } }
          ],
          colors: [
            { $group: { _id: "$color" } },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, value: "$_id", label: "$_id" } }
          ],
          garmentTypes: [
            { $group: { _id: "$garmentType" } },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, value: "$_id", label: "$_id" } }
          ],
          spreadTables: [
            { $group: { _id: "$cuttingTableDetails.spreadTable" } },
            { $match: { _id: { $ne: null } } },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, value: "$_id", label: "$_id" } }
          ],
          materials: [
            { $group: { _id: "$fabricDetails.material" } },
            { $match: { _id: { $ne: null } } },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, value: "$_id", label: "$_id" } }
          ]
        }
      });
  
      const result = await CuttingInspection.aggregate(pipeline);
      res.json(result[0]);
    } catch (error) {
      console.error("Error fetching cutting report filter options:", error);
      res.status(500).json({
        message: "Failed to fetch filter options",
        error: error.message
      });
    }
};

// GET QC IDs (cutting_emp_id and names) from cuttinginspections
export const getQCIds = async (req, res) => {
  try {
      const inspectors = await CuttingInspection.aggregate([
        {
          $group: {
            _id: "$cutting_emp_id",
            engName: { $first: "$cutting_emp_engName" },
            khName: { $first: "$cutting_emp_khName" }
          }
        },
        {
          $project: {
            _id: 0,
            emp_id: "$_id",
            eng_name: "$engName",
            kh_name: "$khName"
          }
        },
        { $sort: { emp_id: 1 } }
      ]);
      res.json(inspectors);
    } catch (error) {
      console.error(
        "Error fetching QC inspectors from cutting inspections:",
        error
      );
      res
        .status(500)
        .json({ message: "Failed to fetch QC inspectors", error: error.message });
    }
};

export const getCuttingInspection = async (req, res) => {
  try {
      const { moNo, tableNo, startDate, endDate, qcId } = req.query;
  
      if (!moNo) {
        return res.status(400).json({ message: "MO Number is required" });
      }
  
      const matchQuery = { moNo };
  
      // Add optional filters if they are provided
      if (tableNo) {
        matchQuery.tableNo = tableNo;
      }
      if (qcId) {
        matchQuery.cutting_emp_id = qcId;
      }
  
      // If dates are provided, we must use an aggregation pipeline for proper date conversion
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = endDate ? new Date(endDate) : new Date(startDate);
        end.setHours(23, 59, 59, 999);
  
        const pipeline = [
          { $match: matchQuery }, // Apply non-date filters first
          {
            $addFields: {
              inspectionDateAsDate: {
                $dateFromString: {
                  dateString: "$inspectionDate",
                  format: "%m/%d/%Y"
                }
              }
            }
          },
          {
            $match: {
              inspectionDateAsDate: { $gte: start, $lte: end }
            }
          },
          { $sort: { tableNo: 1 } }
        ];
  
        const reports = await CuttingInspection.aggregate(pipeline);
        res.json(reports);
      } else {
        // If no dates, a simpler 'find' query is sufficient
        const reports = await CuttingInspection.find(matchQuery).sort({
          tableNo: 1
        });
        res.json(reports);
      }
    } catch (error) {
      console.error("Error querying cutting inspection reports:", error);
      res.status(500).json({
        message: "Failed to fetch inspection reports",
        error: error.message
      });
    }
};


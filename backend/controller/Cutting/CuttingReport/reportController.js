import { 
  CuttingInspection,
} from "../../MongoDB/dbConnectionController.js";
import { buildReportMatchPipeline } from "../../../helpers/helperFunctions.js";
import mongoose from "mongoose";

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
export const getCuttingQCInspectors = async (req, res) => {
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

// GET Paginated Cutting Inspection Reports
export const getCuttingInspectionRepo = async (req, res) => {
    try {
        const { page = 1, limit = 15 } = req.query;
    
        const pipeline = buildReportMatchPipeline(req.query);
        const countPipeline = [...pipeline]; // For counting total documents
    
        const skip = (parseInt(page) - 1) * parseInt(limit);
    
        // Add sorting, skipping, and limiting for the data fetch
        pipeline.push(
          {
            $addFields: {
              convertedDate: {
                $dateFromString: {
                  dateString: "$inspectionDate",
                  format: "%m/%d/%Y",
                  onError: new Date(0),
                  onNull: new Date(0)
                }
              }
            }
          },
          { $sort: { convertedDate: -1, moNo: 1, tableNo: 1 } },
          { $skip: skip },
          { $limit: parseInt(limit) },
          {
            $project: {
              _id: 1,
              inspectionDate: 1,
              buyer: 1,
              moNo: 1,
              tableNo: 1,
              buyerStyle: 1, // Cust. Style
              cuttingTableDetails: 1, // For Spread Table, Layer Details, Macker No
              fabricDetails: 1, // For Material
              lotNo: 1,
              cutting_emp_id: 1,
              color: 1,
              garmentType: 1,
              mackerRatio: 1,
              totalBundleQty: 1,
              bundleQtyCheck: 1,
              totalInspectionQty: 1,
              numberOfInspectedSizes: {
                $size: { $ifNull: ["$inspectionData", []] }
              },
              sumTotalPcs: { $sum: "$inspectionData.totalPcsSize" },
              sumTotalPass: { $sum: "$inspectionData.passSize.total" },
              sumTotalReject: { $sum: "$inspectionData.rejectSize.total" },
              sumTotalRejectMeasurement: {
                $sum: "$inspectionData.rejectMeasurementSize.total"
              },
              sumTotalRejectDefects: {
                $sum: "$inspectionData.rejectGarmentSize.total"
              }
            }
          },
          {
            $addFields: {
              overallPassRate: {
                $cond: [
                  { $gt: ["$sumTotalPcs", 0] },
                  {
                    $multiply: [{ $divide: ["$sumTotalPass", "$sumTotalPcs"] }, 100]
                  },
                  0
                ]
              }
            }
          }
        );
    
        const reports = await CuttingInspection.aggregate(pipeline);
    
        // Get total count
        countPipeline.push({ $count: "total" });
        const countResult = await CuttingInspection.aggregate(countPipeline);
        const totalDocuments = countResult.length > 0 ? countResult[0].total : 0;
    
        res.json({
          reports,
          totalPages: Math.ceil(totalDocuments / parseInt(limit)),
          currentPage: parseInt(page),
          totalReports: totalDocuments
        });
      } catch (error) {
        console.error("Error fetching cutting inspection reports:", error);
        res.status(500).json({
          message: "Failed to fetch cutting inspection reports",
          error: error.message
        });
      }
};

// GET Single Cutting Inspection Report Detail
export const getCuttingInspectionReportDetail = async (req, res) => {
  try {
      const { id } = req.params;
      const report = await CuttingInspection.findById(id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      res.json(report);
    } catch (error) {
      console.error("Error fetching cutting inspection report detail:", error);
      res.status(500).json({
        message: "Failed to fetch report detail",
        error: error.message
      });
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

// Get summarized measurement issues for a specific report
export const getMeasurementIssues = async (req, res) => {
  try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid report ID format" });
      }
  
      const measurementIssuesPipeline = [
        // Step 1: Match the specific report document
        { $match: { _id: new mongoose.Types.ObjectId(id) } },
  
        // Step 2: Deconstruct the nested arrays to get to individual measurements
        { $unwind: "$inspectionData" },
        { $unwind: "$inspectionData.bundleInspectionData" },
        {
          $unwind:
            "$inspectionData.bundleInspectionData.measurementInsepctionData"
        },
        {
          $unwind:
            "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData"
        },
        {
          $unwind:
            "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues"
        },
        {
          $unwind:
            "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements"
        },
  
        // Step 3: Filter for only the measurements that have a status of "Fail"
        {
          $match: {
            "inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.status":
              "Fail"
          }
        },
  
        // Step 4: Group the results by Inspected Size and Measurement Point Name
        {
          $group: {
            _id: {
              inspectedSize: "$inspectionData.inspectedSize",
              measurementPointName:
                "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementPointName"
            },
            // Create an array of all the failed values with their context
            measuredValues: {
              $push: {
                value:
                  "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.valuefraction",
  
                bundleNo: "$inspectionData.bundleInspectionData.bundleNo",
                pcsName:
                  "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.pcsName",
                //partNo: "$inspectionData.bundleInspectionData.measurementInsepctionData.partNo",
                valuedecimal:
                  "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.valuedecimal"
              }
            }
          }
        },
  
        // Step 5: Reshape the data and calculate counts
        {
          $project: {
            _id: 0,
            inspectedSize: "$_id.inspectedSize",
            measurementPointName: "$_id.measurementPointName",
            measuredValues: 1,
            totalCount: { $size: "$measuredValues" },
            totalNegTol: {
              $sum: {
                $map: {
                  input: "$measuredValues",
                  as: "mv",
                  in: { $cond: [{ $lt: ["$$mv.valuedecimal", 0] }, 1, 0] }
                }
              }
            },
            totalPosTol: {
              $sum: {
                $map: {
                  input: "$measuredValues",
                  as: "mv",
                  in: { $cond: [{ $gt: ["$$mv.valuedecimal", 0] }, 1, 0] }
                }
              }
            }
          }
        },
        // Step 6: Sort the final results for consistent display
        { $sort: { inspectedSize: 1, measurementPointName: 1 } }
      ];
  
      const issues = await CuttingInspection.aggregate(measurementIssuesPipeline);
      res.json(issues);
    } catch (error) {
      console.error("Error fetching measurement issues:", error);
      res.status(500).json({
        message: "Failed to fetch measurement issues",
        error: error.message
      });
    }
};


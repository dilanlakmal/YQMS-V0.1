import { 
SubconSewingQc1Report,
UserMain,           
} from "../../MongoDB/dbConnectionController.js";

// --- NEW, ENHANCED, UNIFIED ENDPOINT FOR THE ENTIRE REPORT PAGE ---
export const getSubConQC1SewingReportData = async (req, res) => {
  try {
      const { startDate, endDate, factory, lineNo, moNo, color } = req.query;
  
      const matchQuery = {};
      if (startDate && endDate) {
        matchQuery.inspectionDate = {
          $gte: new Date(startDate),
          $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
        };
      }
      if (factory) matchQuery.factory = factory;
      if (lineNo) matchQuery.lineNo = lineNo;
      if (moNo) matchQuery.moNo = moNo;
      if (color) matchQuery.color = color;
  
      // --- Main Aggregation Pipeline ---
  
      const result = await SubconSewingQc1Report.aggregate([
        { $match: matchQuery },
        { $sort: { inspectionDate: -1, _id: -1 } },
        // --- NEW: Join with QA reports collection using $lookup ---
        {
          $lookup: {
            from: "subcon_sewing_qa_reports", // The exact name of the QA reports collection
            let: {
              insp_date: "$inspectionDate",
              insp_factory: "$factory",
              insp_line: "$lineNo",
              insp_mo: "$moNo",
              insp_color: "$color"
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$factory", "$$insp_factory"] },
                      { $eq: ["$lineNo", "$$insp_line"] },
                      { $eq: ["$moNo", "$$insp_mo"] },
                      { $eq: ["$color", "$$insp_color"] },
                      // Robustly match the date part only, ignoring time
                      {
                        $eq: [
                          {
                            $dateToString: {
                              format: "%Y-%m-%d",
                              date: "$inspectionDate",
                              timezone: "UTC"
                            }
                          },
                          {
                            $dateToString: {
                              format: "%Y-%m-%d",
                              date: "$$insp_date",
                              timezone: "UTC"
                            }
                          }
                        ]
                      }
                    ]
                  }
                }
              },
              { $limit: 1 } // Ensure only one matching QA report is returned
            ],
            as: "qaData" // Store the result in a temporary array 'qaData'
          }
        },
        // --- NEW: Promote the matched QA report to a top-level object ---
        {
          $addFields: {
            qaReport: { $arrayElemAt: ["$qaData", 0] } // Get the first (or only) item from qaData
          }
        },
        // Use $facet to run multiple aggregations on the filtered data in parallel
        {
          $facet: {
            // --- 1. Get the report data for the main table ---
            reports: [{ $sort: { inspectionDate: -1, _id: -1 } }],
            // --- 2. Calculate summary statistics for the cards ---
            summary: [
              {
                $group: {
                  _id: null,
                  totalCheckedQty: { $sum: "$checkedQty" },
                  totalDefectQty: { $sum: "$totalDefectQty" },
                  totalQASampleSize: { $sum: "$qaReport.sampleSize" },
                  totalQADefectQty: { $sum: "$qaReport.totalDefectQty" },
                  allDefects: { $push: "$defectList" }
                }
              },
              { $unwind: "$allDefects" },
              { $unwind: "$allDefects" },
              {
                $group: {
                  _id: "$allDefects.defectName",
                  totalQty: { $sum: "$allDefects.qty" },
                  totalCheckedQty: { $first: "$totalCheckedQty" },
                  totalDefectQty: { $first: "$totalDefectQty" },
                  totalQASampleSize: { $first: "$totalQASampleSize" },
                  totalQADefectQty: { $first: "$totalQADefectQty" }
                }
              },
              { $sort: { totalQty: -1 } },
              {
                $group: {
                  _id: null,
                  totalCheckedQty: { $first: "$totalCheckedQty" },
                  totalDefectQty: { $first: "$totalDefectQty" },
                  totalQASampleSize: { $first: "$totalQASampleSize" },
                  totalQADefectQty: { $first: "$totalQADefectQty" },
                  topDefects: { $push: { defectName: "$_id", qty: "$totalQty" } }
                }
              },
              {
                $project: {
                  _id: 0,
                  totalCheckedQty: { $ifNull: ["$totalCheckedQty", 0] },
                  totalDefectQty: { $ifNull: ["$totalDefectQty", 0] },
                  totalQASampleSize: { $ifNull: ["$totalQASampleSize", 0] },
                  totalQADefectQty: { $ifNull: ["$totalQADefectQty", 0] },
                  overallDefectRate: {
                    $cond: [
                      { $eq: [{ $ifNull: ["$totalCheckedQty", 0] }, 0] },
                      0,
                      {
                        $multiply: [
                          { $divide: ["$totalDefectQty", "$totalCheckedQty"] },
                          100
                        ]
                      }
                    ]
                  },
                  topDefects: {
                    $map: {
                      input: { $slice: ["$topDefects", 3] },
                      as: "d",
                      in: {
                        name: "$$d.defectName",
                        qty: "$$d.qty",
                        rate: {
                          $cond: [
                            { $eq: [{ $ifNull: ["$totalCheckedQty", 0] }, 0] },
                            0,
                            {
                              $multiply: [
                                { $divide: ["$$d.qty", "$totalCheckedQty"] },
                                100
                              ]
                            }
                          ]
                        }
                      }
                    }
                  }
                }
              }
            ],
            // --- 3. Get available options for cascading filters ---
            filterOptions: [
              {
                $group: {
                  _id: null,
                  factories: { $addToSet: "$factory" },
                  lineNos: { $addToSet: "$lineNo" },
                  moNos: { $addToSet: "$moNo" },
                  colors: { $addToSet: "$color" }
                }
              },
              {
                $project: {
                  _id: 0,
                  factories: { $sortArray: { input: "$factories", sortBy: 1 } },
                  lineNos: { $sortArray: { input: "$lineNos", sortBy: 1 } },
                  moNos: { $sortArray: { input: "$moNos", sortBy: 1 } },
                  colors: { $sortArray: { input: "$colors", sortBy: 1 } }
                }
              }
            ]
          }
        },
        // --- Reshape the final output ---
        {
          $project: {
            reports: "$reports",
            summary: { $arrayElemAt: ["$summary", 0] },
            filterOptions: { $arrayElemAt: ["$filterOptions", 0] }
          }
        }
      ]);
  
      // --- GUARANTEE A SAFE RESPONSE STRUCTURE ---
      const rawData = result[0];
      const responseData = {
        reports: rawData?.reports || [],
        summary: rawData?.summary || {
          totalCheckedQty: 0,
          totalDefectQty: 0,
          overallDefectRate: 0,
          topDefects: []
        },
        filterOptions: rawData?.filterOptions || {
          factories: [],
          lineNos: [],
          moNos: [],
          colors: []
        }
      };
  
      res.json(responseData);
    } catch (error) {
      console.error("Error fetching Sub-Con QC report data:", error);
      res.status(500).json({ error: "Failed to fetch report data" });
    }
};

// --- NEW ENDPOINT: Get specific user info for QA ID popups ---
export const getSubConQAUserInfo = async (req, res) => {
  try {
      const { empId } = req.params;
      // --- CORRECTED: Using 'UserMain' as the model name ---
      const user = await UserMain.findOne({ emp_id: empId }).select(
        "emp_id eng_name face_photo job_title"
      );
  
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user info:", error);
      res.status(500).json({ error: "Failed to fetch user details" });
    }
};
import {
  QC2InspectionPassBundle,
  QC2DefectPrint, 
  QC2OrderData,             
} from "../MongoDB/dbConnectionController.js";

import { 
    normalizeDateString,
    escapeRegExp,
 } from "../../Helpers/helperFunctions.js";

/* ------------------------------
   QC2 - Inspection Pass Bundle, Reworks
------------------------------ */

// Filter Pane for Live Dashboard - EndPoints
export const getQC2PassbundleData = async (req, res) => {
    try {
        const filterOptions = await QC2InspectionPassBundle.aggregate([
          {
            $group: {
              _id: null,
              moNo: { $addToSet: "$moNo" },
              color: { $addToSet: "$color" },
              size: { $addToSet: "$size" },
              department: { $addToSet: "$department" },
              emp_id_inspection: { $addToSet: "$emp_id_inspection" },
              buyer: { $addToSet: "$buyer" },
              package_no: { $addToSet: "$package_no" }, // Added package_no
              lineNo: { $addToSet: "$lineNo" } // Add Line No
            }
          },
          {
            $project: {
              _id: 0,
              moNo: 1,
              color: 1,
              size: 1,
              department: 1,
              emp_id_inspection: 1,
              buyer: 1,
              package_no: 1,
              lineNo: 1 // Include Line No
            }
          }
        ]);
    
        const result =
          filterOptions.length > 0
            ? filterOptions[0]
            : {
                moNo: [],
                color: [],
                size: [],
                department: [],
                emp_id_inspection: [],
                buyer: [],
                package_no: [],
                lineNo: [] // Include Line No
              };
    
        Object.keys(result).forEach((key) => {
          result[key] = result[key]
            .filter(Boolean)
            .sort((a, b) => (key === "package_no" ? a - b : a.localeCompare(b))); // Numeric sort for package_no
          //.sort((a, b) => a.localeCompare(b));
        });
    
        res.json(result);
      } catch (error) {
        console.error("Error fetching filter options:", error);
        res.status(500).json({ error: "Failed to fetch filter options" });
      }
};

// New endpoint to fetch by bundle_random_id
export const getQC2PassbundleDataByBundleRandomId = async (req, res) => {
  try {
      const { bundle_random_id } = req.params;
      const record = await QC2InspectionPassBundle.findOne({
        bundle_random_id
      });
      if (record) {
        res.json(record);
      } else {
        res.status(404).json({ message: "Record not found" });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
};

// New GET endpoint to fetch record by defect_print_id
export const getQC2PassbundleDataByDefectPrintId = async (req, res) => {
    try {
      const { defect_print_id } = req.params;
      const { includeCompleted } = req.query;

      let query = {
        "printArray.defect_print_id": defect_print_id
      };

      if (includeCompleted !== "true") {
        query["printArray.isCompleted"] = false;
      }

      const record = await QC2InspectionPassBundle.findOne(query);

      if (record) {
        res.json(record);
      } else {
        res
          .status(404)
          .json({ message: "Record not found or already completed" });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
};

// GET endpoint to fetch all inspection records
export const getAllQC2PassbundleData = async (req, res) => {
    try {
      const {
        moNo,
        package_no,
        emp_id_inspection,
        line_no, // Added
        taskNo,  // Added
        date, 
        startDate,
        endDate,
        color,
        size,
        department,
        page = 1,
        limit = 50 // Default to 50 records per page
      } = req.query;
  
      let match = {};
      if (moNo) match.moNo = { $regex: new RegExp(moNo.trim(), "i") };
      if (package_no) {
        const packageNoNumber = Number(package_no);
        if (isNaN(packageNoNumber)) {
          return res.status(400).json({ error: "Package No must be a number" });
        }
        match.package_no = packageNoNumber;
      }
      if (emp_id_inspection)
        match.emp_id_inspection = {
          $regex: new RegExp(emp_id_inspection.trim(), "i")
        };
  
        if (line_no) {
        match.lineNo = line_no;
      }
      // Handle taskNo from query, matching against the 'taskNo' field in the database
      if (taskNo) {
        match.taskNo = taskNo;
      }
      if (color) match.color = color;
      if (size) match.size = size;
      if (department) match.department = department;
  
      if (date) {
          if (date) match.inspection_date = normalizeDateString(date);
        
      } 
      if (startDate || endDate) {
        match.inspection_date = {};
        if (startDate)
          match.inspection_date.$gte = normalizeDateString(startDate);
        if (endDate) match.inspection_date.$lte = normalizeDateString(endDate);
      }
  
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;
  
      const pipeline = [
        { $match: match },
        { $sort: { createdAt: -1 } },
        {
          $facet: {
            data: [{ $skip: skip }, { $limit: limitNum }],
            total: [{ $count: "count" }]
          }
        }
      ];
  
      const result = await QC2InspectionPassBundle.aggregate(pipeline);
      const data = result[0].data || [];
      const total = result[0].total.length > 0 ? result[0].total[0].count : 0;
  
      // console.log("Search result:", { data, total });
      res.json({ data, total });
    } catch (error) {
      console.error("Error searching data cards:", error);
      res.status(500).json({ error: error.message });
    }
};

export const getQC2Defect = async (req, res) => {
    try {
    const { moNo, package_no, repair,date, page = 1, limit = 50 } = req.query;
    let match = {};
    if (moNo) match.moNo = { $regex: new RegExp(moNo.trim(), "i") };
    if (date) match.inspection_date = normalizeDateString(date);
    if (package_no) {
      const packageNoNumber = Number(package_no);
      if (isNaN(packageNoNumber))
        return res.status(400).json({ error: "Package No must be a number" });
      match.package_no = packageNoNumber;
    }
    if (repair) match.repair = { $regex: new RegExp(repair.trim(), "i") };

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const pipeline = [
      { $match: match },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limitNum }],
          total: [{ $count: "count" }]
        }
      }
    ];

    const result = await QC2DefectPrint.aggregate(pipeline);
    const data = result[0].data || [];
    const total = result[0].total.length > 0 ? result[0].total[0].count : 0;

    res.json({ data, total });
  } catch (error) {
    console.error("Error searching defect print cards:", error);
    res.status(500).json({ error: error.message });
  }
};

// Endpoint to get summary data
export const getQC2SummaryData = async (req, res) => {
    try {
    const {
      moNo,
      emp_id_inspection,
      startDate,
      endDate,
      color,
      size,
      department,
      buyer,
      lineNo
    } = req.query;

    // --- Filter logic (This part is correct and remains unchanged) ---
    let match = {};
    if (moNo) match.moNo = { $regex: new RegExp(moNo.trim(), "i") };
    if (emp_id_inspection)
      match.emp_id_inspection = {
        $regex: new RegExp(emp_id_inspection.trim(), "i")
      };
    if (color) match.color = color;
    if (size) match.size = size;
    if (department) match.department = department;
    if (buyer)
      match.buyer = { $regex: new RegExp(escapeRegExp(buyer.trim()), "i") };
    if (lineNo) match.lineNo = lineNo.trim();

    if (startDate || endDate) {
      match.$expr = match.$expr || { $and: [] };
      const parseDate = (dateStr) => {
        const [month, day, year] = dateStr.split("/");
        return new Date(
          `${year}-${month.padStart(2, "0")}-${day.padStart(
            2,
            "0"
          )}T00:00:00.000Z`
        );
      };
      if (startDate) {
        match.$expr.$and.push({
          $gte: [
            {
              $dateFromString: {
                dateString: "$inspection_date",
                format: "%m/%d/%Y"
              }
            },
            parseDate(startDate)
          ]
        });
      }
      if (endDate) {
        match.$expr.$and.push({
          $lte: [
            {
              $dateFromString: {
                dateString: "$inspection_date",
                format: "%m/%d/%Y"
              }
            },
            parseDate(endDate)
          ]
        });
      }
    }
    // if (startDate || endDate) {
    //   match.inspection_date = {};
    //   if (startDate)
    //     match.inspection_date.$gte = normalizeDateString(startDate);
    //   if (endDate) match.inspection_date.$lte = normalizeDateString(endDate);
    // }

    const data = await QC2InspectionPassBundle.aggregate([
      // Stage 1: Match documents based on user's filters
      { $match: match },

      // Stage 2: Group all matching documents to get the final totals for all fields.
      {
        $group: {
          _id: null,
          totalGarments: { $sum: "$checkedQty" },
          totalPass: { $sum: "$totalPass" },
          totalRejects: { $sum: "$totalRejects" },
          defectsQty: { $sum: "$defectQty" },

          // Repair Left is the sum of the `totalRepair`
          totalRepair: { $sum: "$totalRepair" },

          // B-Grade Qty calculation
          sumOfAllRejects: { $sum: "$totalRejects" },
          sumOfAllVar: { $sum: { $sum: "$printArray.totalRejectGarment_Var" } },

          totalBundles: { $sum: 1 }
        }
      },

      // Stage 3: Project the final shape, calculate B-Grade Qty, and rates
      {
        $project: {
          _id: 0,
          totalGarments: 1,
          totalPass: 1,
          totalRejects: 1,
          totalRepair: 1,
          defectsQty: 1,
          bGradeQty: { $subtract: ["$sumOfAllRejects", "$sumOfAllVar"] },
          totalBundles: 1,
          defectRate: {
            $cond: [
              { $eq: ["$totalGarments", 0] },
              0,
              { $divide: ["$defectsQty", "$totalGarments"] }
            ]
          },
          defectRatio: {
            $cond: [
              { $eq: ["$totalGarments", 0] },
              0,
              { $divide: ["$totalRejects", "$totalGarments"] }
            ]
          }
        }
      }
    ]);

    if (data.length > 0) {
      res.json(data[0]);
    } else {
      // Return a default object with all fields if no data is found
      res.json({
        totalGarments: 0,
        totalPass: 0,
        totalRejects: 0,
        totalRepair: 0,
        bGradeQty: 0,
        defectsQty: 0,
        totalBundles: 0,
        defectRate: 0,
        defectRatio: 0
      });
    }
  } catch (error) {
    console.error("Error fetching summary data:", error);
    res.status(500).json({ error: "Failed to fetch summary data" });
  }
};

// Endpoint to get summaries per MO No with dynamic grouping
export const getQC2SummaryDataByMoNo = async (req, res) => {
    try {
      const {
        moNo,
        emp_id_inspection,
        startDate,
        endDate,
        color,
        size,
        department,
        buyer,
        lineNo,
        groupByDate, // "true" to group by date
        groupByLine, // "true" to group by lineNo
        groupByMO, // "true" to group by moNo
        groupByBuyer, // "true" to group by buyer
        groupByColor, // "true" to group by color
        groupBySize, // "true" to group by size
        groupByWeek // New parameter for weekly grouping
      } = req.query;
  
      let match = {};
  
      if (moNo && moNo.trim()) {
        match.moNo = { $regex: new RegExp(moNo.trim(), "i") };
      }
      if (emp_id_inspection) {
        match.emp_id_inspection = {
          $regex: new RegExp(emp_id_inspection.trim(), "i")
        };
      }
      if (color) match.color = color;
      if (size) match.size = size;
      if (department) match.department = department;
      if (buyer) {
        match.buyer = { $regex: new RegExp(escapeRegExp(buyer.trim()), "i") };
      }
      if (lineNo) match.lineNo = lineNo.trim();
  
      // Normalize and convert dates to Date objects for proper comparison
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
                  format: "%m/%d/%Y",
                  onError: null // Handle invalid dates gracefully
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
                  format: "%m/%d/%Y",
                  onError: null // Handle invalid dates gracefully
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
  
      // Dynamically build the _id object for grouping based on query params
      const groupBy = {};
      const projectFields = {};
  
      // Order matters: Week, Date, Line No, MO No, Buyer, Color, Size
      if (groupByWeek === "true") {
        groupBy.weekInfo = {
          $let: {
            vars: {
              parsedDate: {
                $dateFromString: {
                  dateString: "$inspection_date",
                  format: "%m/%d/%Y",
                  onError: null // Return null if date parsing fails
                }
              },
              monday: {
                $cond: {
                  if: {
                    $ne: [
                      {
                        $dateFromString: {
                          dateString: "$inspection_date",
                          format: "%m/%d/%Y",
                          onError: null
                        }
                      },
                      null
                    ]
                  },
                  then: {
                    $dateSubtract: {
                      startDate: {
                        $dateFromString: {
                          dateString: "$inspection_date",
                          format: "%m/%d/%Y",
                          onError: null
                        }
                      },
                      unit: "day",
                      amount: {
                        $subtract: [
                          {
                            $dayOfWeek: {
                              $dateFromString: {
                                dateString: "$inspection_date",
                                format: "%m/%d/%Y",
                                onError: null
                              }
                            }
                          },
                          1 // Adjust for Monday (1 = Sunday, 2 = Monday, etc.)
                        ]
                      }
                    }
                  },
                  else: null // If date is invalid, set monday to null
                }
              }
            },
            in: {
              weekNumber: {
                $cond: {
                  if: { $ne: ["$$monday", null] },
                  then: { $week: "$$monday" },
                  else: -1 // Use -1 for invalid weeks
                }
              },
              startDate: {
                $cond: {
                  if: { $ne: ["$$monday", null] },
                  then: {
                    $dateToString: {
                      format: "%Y-%m-%d",
                      date: "$$monday"
                    }
                  },
                  else: "Invalid Date"
                }
              },
              endDate: {
                $cond: {
                  if: { $ne: ["$$monday", null] },
                  then: {
                    $dateToString: {
                      format: "%Y-%m-%d",
                      date: {
                        $dateAdd: {
                          startDate: "$$monday",
                          unit: "day",
                          amount: 6
                        }
                      }
                    }
                  },
                  else: "Invalid Date"
                }
              }
            }
          }
        };
        projectFields.weekInfo = "$_id.weekInfo";
      } else if (groupByDate === "true") {
        groupBy.inspection_date = {
          $dateToString: {
            format: "%Y-%m-%d",
            date: {
              $dateFromString: {
                dateString: "$inspection_date",
                format: "%m/%d/%Y",
                onError: null // Handle invalid dates
              }
            }
          }
        };
        projectFields.inspection_date = "$_id.inspection_date";
      }
      if (groupByLine === "true") {
        groupBy.lineNo = "$lineNo";
        projectFields.lineNo = "$_id.lineNo";
      }
      if (groupByMO === "true") {
        groupBy.moNo = "$moNo";
        projectFields.moNo = "$_id.moNo";
      }
      if (groupByBuyer === "true") {
        groupBy.buyer = "$buyer";
        projectFields.buyer = "$_id.buyer";
      }
      if (groupByColor === "true") {
        groupBy.color = "$color";
        projectFields.color = "$_id.color";
      }
      if (groupBySize === "true") {
        groupBy.size = "$size";
        projectFields.size = "$_id.size";
      }
  
      const data = await QC2InspectionPassBundle.aggregate([
        // Step 1: Filter out documents with invalid inspection_date
        {
          $match: {
            inspection_date: { $exists: true, $ne: null, $ne: "" },
            ...match
          }
        },
        // Step 2: Group the data
        {
          $group: {
            _id: groupBy,
            checkedQty: { $sum: "$checkedQty" },
            totalPass: { $sum: "$totalPass" },
            totalRejects: { $sum: "$totalRejects" },
            defectsQty: { $sum: "$defectQty" },
            totalBundles: { $sum: 1 },
            defectiveBundles: {
              $sum: { $cond: [{ $gt: ["$totalRepair", 0] }, 1, 0] }
            },
            defectArray: { $push: "$defectArray" },
            firstInspectionDate: { $first: "$inspection_date" },
            firstLineNo: { $first: "$lineNo" },
            firstMoNo: { $first: "$moNo" },
            firstBuyer: { $first: "$buyer" },
            firstColor: { $first: "$color" },
            firstSize: { $first: "$size" }
          }
        },
        // Step 3: Project the required fields
        {
          $project: {
            ...projectFields,
            inspection_date:
              groupByDate !== "true"
                ? "$firstInspectionDate"
                : "$_id.inspection_date",
            weekInfo:
              groupByWeek !== "true"
                ? null
                : {
                    weekNumber: "$_id.weekInfo.weekNumber",
                    startDate: "$_id.weekInfo.startDate",
                    endDate: "$_id.weekInfo.endDate"
                  },
            lineNo: groupByLine !== "true" ? "$firstLineNo" : "$_id.lineNo",
            moNo: groupByMO !== "true" ? "$firstMoNo" : "$_id.moNo",
            buyer: groupByBuyer !== "true" ? "$firstBuyer" : "$_id.buyer",
            color: groupByColor !== "true" ? "$firstColor" : "$_id.color",
            size: groupBySize !== "true" ? "$firstSize" : "$_id.size",
            checkedQty: 1,
            totalPass: 1,
            totalRejects: 1,
            defectsQty: 1,
            totalBundles: 1,
            defectiveBundles: 1,
            defectArray: {
              $reduce: {
                input: "$defectArray",
                initialValue: [],
                in: { $concatArrays: ["$$value", "$$this"] }
              }
            },
            defectRate: {
              $cond: [
                { $eq: ["$checkedQty", 0] },
                0,
                { $divide: ["$defectsQty", "$checkedQty"] }
              ]
            },
            defectRatio: {
              $cond: [
                { $eq: ["$checkedQty", 0] },
                0,
                { $divide: ["$totalRejects", "$checkedQty"] }
              ]
            },
            _id: 0
          }
        },
        // Step 4: Sort the results
        {
          $sort: {
            ...(groupByWeek === "true" && { "weekInfo.startDate": 1 }),
            ...(groupByDate === "true" && { inspection_date: 1 }),
            lineNo: 1,
            moNo: 1
          }
        }
      ]);
  
      res.json(data);
    } catch (error) {
      console.error("Error fetching MO summaries:", error);
      res.status(500).json({ error: "Failed to fetch MO summaries" });
    }
};

export const getQC2DefectRates = async (req, res) => {
    try {
        const {
          moNo,
          emp_id_inspection,
          startDate,
          endDate,
          color,
          size,
          department,
          buyer,
          lineNo
        } = req.query;
    
        // Build the match stage with filters
        let match = {};
        if (moNo) match.moNo = { $regex: new RegExp(moNo.trim(), "i") };
        if (emp_id_inspection)
          match.emp_id_inspection = {
            $regex: new RegExp(emp_id_inspection.trim(), "i")
          };
        if (color) match.color = color;
        if (size) match.size = size;
        if (department) match.department = department;
        if (buyer)
          match.buyer = { $regex: new RegExp(escapeRegExp(buyer.trim()), "i") };
        if (lineNo) match.lineNo = lineNo.trim();
    
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
    
        // Aggregation pipeline
        const pipeline = [
          { $match: match },
          {
            $facet: {
              totalChecked: [
                {
                  $group: {
                    _id: null,
                    totalCheckedQty: { $sum: "$checkedQty" }
                  }
                }
              ],
              defects: [
                { $unwind: "$defectArray" },
                {
                  $group: {
                    _id: "$defectArray.defectName",
                    totalCount: { $sum: "$defectArray.totalCount" }
                  }
                }
              ]
            }
          },
          {
            $project: {
              totalCheckedQty: {
                $arrayElemAt: ["$totalChecked.totalCheckedQty", 0]
              },
              defects: "$defects"
            }
          },
          { $unwind: "$defects" },
          {
            $project: {
              defectName: "$defects._id",
              totalCount: "$defects.totalCount",
              defectRate: {
                $cond: [
                  { $eq: ["$totalCheckedQty", 0] },
                  0,
                  { $divide: ["$defects.totalCount", "$totalCheckedQty"] }
                ]
              }
            }
          },
          { $sort: { defectRate: -1 } }
        ];
    
        const data = await QC2InspectionPassBundle.aggregate(pipeline);
        res.json(data);
      } catch (error) {
        console.error("Error fetching defect rates:", error);
        res.status(500).json({ error: "Failed to fetch defect rates" });
      }
};

//Defect rate by Hour - Endpoint
export const getQC2DefectRatesByHour = async (req, res) => {
    try {
    const {
      moNo,
      emp_id_inspection,
      startDate,
      endDate,
      color,
      size,
      department,
      buyer
    } = req.query;

    let match = {};
    if (moNo) match.moNo = { $regex: new RegExp(moNo.trim(), "i") };
    if (emp_id_inspection)
      match.emp_id_inspection = {
        $regex: new RegExp(emp_id_inspection.trim(), "i")
      };
    if (color) match.color = color;
    if (size) match.size = size;
    if (department) match.department = department;
    if (buyer)
      match.buyer = { $regex: new RegExp(escapeRegExp(buyer.trim()), "i") };

    // Update date filtering using $expr and $dateFromString
    if (startDate || endDate) {
      match.$expr = match.$expr || {}; // Initialize $expr if not present
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

    match.inspection_time = { $regex: /^\d{2}:\d{2}:\d{2}$/ };

    const data = await QC2InspectionPassBundle.aggregate([
      { $match: match },
      {
        $project: {
          moNo: 1,
          checkedQty: 1,
          defectQty: 1,
          defectArray: 1,
          inspection_time: 1,
          hour: { $toInt: { $substr: ["$inspection_time", 0, 2] } },
          minute: { $toInt: { $substr: ["$inspection_time", 3, 2] } },
          second: { $toInt: { $substr: ["$inspection_time", 6, 2] } }
        }
      },
      {
        $match: {
          minute: { $gte: 0, $lte: 59 },
          second: { $gte: 0, $lte: 59 }
        }
      },
      {
        $group: {
          _id: { moNo: "$moNo", hour: "$hour" },
          totalCheckedQty: { $sum: "$checkedQty" },
          totalDefectQty: { $sum: "$defectQty" },
          defectRecords: { $push: "$defectArray" }
        }
      },
      { $unwind: { path: "$defectRecords", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$defectRecords", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: {
            moNo: "$_id.moNo",
            hour: "$_id.hour",
            defectName: "$defectRecords.defectName"
          },
          totalCheckedQty: { $first: "$totalCheckedQty" },
          totalDefectQty: { $first: "$totalDefectQty" },
          defectCount: { $sum: "$defectRecords.totalCount" }
        }
      },
      {
        $group: {
          _id: { moNo: "$_id.moNo", hour: "$_id.hour" },
          checkedQty: { $first: "$totalCheckedQty" },
          totalDefectQty: { $first: "$totalDefectQty" },
          defects: {
            $push: {
              name: "$_id.defectName",
              count: {
                $cond: [{ $eq: ["$defectCount", null] }, 0, "$defectCount"]
              }
            }
          }
        }
      },
      {
        $group: {
          _id: "$_id.moNo",
          hours: {
            $push: {
              hour: "$_id.hour",
              checkedQty: "$checkedQty",
              defects: "$defects",
              defectQty: "$totalDefectQty"
            }
          },
          totalCheckedQty: { $sum: "$checkedQty" },
          totalDefectQty: { $sum: "$totalDefectQty" }
        }
      },
      {
        $project: {
          moNo: "$_id",
          hourData: {
            $arrayToObject: {
              $map: {
                input: "$hours",
                as: "h",
                in: {
                  k: { $toString: { $add: ["$$h.hour", 1] } },
                  v: {
                    rate: {
                      $cond: [
                        { $eq: ["$$h.checkedQty", 0] },
                        0,
                        {
                          $multiply: [
                            { $divide: ["$$h.defectQty", "$$h.checkedQty"] },
                            100
                          ]
                        }
                      ]
                    },
                    hasCheckedQty: { $gt: ["$$h.checkedQty", 0] },
                    checkedQty: "$$h.checkedQty",
                    defects: "$$h.defects"
                  }
                }
              }
            }
          },
          totalRate: {
            $cond: [
              { $eq: ["$totalCheckedQty", 0] },
              0,
              {
                $multiply: [
                  { $divide: ["$totalDefectQty", "$totalCheckedQty"] },
                  100
                ]
              }
            ]
          },
          _id: 0
        }
      },
      { $sort: { moNo: 1 } }
    ]);

    const totalData = await QC2InspectionPassBundle.aggregate([
      { $match: match },
      {
        $project: {
          checkedQty: 1,
          defectQty: 1,
          hour: { $toInt: { $substr: ["$inspection_time", 0, 2] } }
        }
      },
      {
        $group: {
          _id: "$hour",
          totalCheckedQty: { $sum: "$checkedQty" },
          totalDefectQty: { $sum: "$defectQty" }
        }
      },
      {
        $project: {
          hour: "$_id",
          rate: {
            $cond: [
              { $eq: ["$totalCheckedQty", 0] },
              0,
              {
                $multiply: [
                  { $divide: ["$totalDefectQty", "$totalCheckedQty"] },
                  100
                ]
              }
            ]
          },
          hasCheckedQty: { $gt: ["$totalCheckedQty", 0] },
          _id: 0
        }
      }
    ]);

    const grandTotal = await QC2InspectionPassBundle.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalCheckedQty: { $sum: "$checkedQty" },
          totalDefectQty: { $sum: "$defectQty" }
        }
      },
      {
        $project: {
          rate: {
            $cond: [
              { $eq: ["$totalCheckedQty", 0] },
              0,
              {
                $multiply: [
                  { $divide: ["$totalDefectQty", "$totalCheckedQty"] },
                  100
                ]
              }
            ]
          },
          _id: 0
        }
      }
    ]);

    const result = {};
    data.forEach((item) => {
      result[item.moNo] = {};
      Object.keys(item.hourData).forEach((hour) => {
        const formattedHour = `${hour}:00`.padStart(5, "0");
        const hourData = item.hourData[hour];
        result[item.moNo][formattedHour] = {
          rate: hourData.rate,
          hasCheckedQty: hourData.hasCheckedQty,
          checkedQty: hourData.checkedQty,
          defects: hourData.defects.map((defect) => ({
            name: defect.name || "No Defect",
            count: defect.count,
            rate:
              hourData.checkedQty > 0
                ? (defect.count / hourData.checkedQty) * 100
                : 0
          }))
        };
      });
      result[item.moNo].totalRate = item.totalRate;
    });

    result.total = {};
    totalData.forEach((item) => {
      const formattedHour = `${item.hour + 1}:00`.padStart(5, "0");
      if (item.hour >= 6 && item.hour <= 20) {
        result.total[formattedHour] = {
          rate: item.rate,
          hasCheckedQty: item.hasCheckedQty
        };
      }
    });

    result.grand = grandTotal.length > 0 ? grandTotal[0] : { rate: 0 };

    const hours = [
      "07:00",
      "08:00",
      "09:00",
      "10:00",
      "11:00",
      "12:00",
      "13:00",
      "14:00",
      "15:00",
      "16:00",
      "17:00",
      "18:00",
      "19:00",
      "20:00",
      "21:00"
    ];
    Object.keys(result).forEach((key) => {
      if (key !== "grand") {
        hours.forEach((hour) => {
          if (!result[key][hour]) {
            result[key][hour] = {
              rate: 0,
              hasCheckedQty: false,
              checkedQty: 0,
              defects: []
            };
          }
        });
      }
    });

    res.json(result);
  } catch (error) {
    console.error("Error fetching defect rates by hour:", error);
    res.status(500).json({ error: "Failed to fetch defect rates by hour" });
  }
};

// Endpoint to get defect rates by line by hour
export const getQC2DefectRatesByLine = async (req, res) => {
     try {
        const {
          moNo,
          emp_id_inspection,
          startDate,
          endDate,
          color,
          size,
          department,
          buyer,
          lineNo
        } = req.query;
    
        let match = {};
        if (moNo) match.moNo = { $regex: new RegExp(moNo.trim(), "i") };
        if (emp_id_inspection)
          match.emp_id_inspection = {
            $regex: new RegExp(emp_id_inspection.trim(), "i")
          };
        if (color) match.color = color;
        if (size) match.size = size;
        if (department) match.department = department;
        if (buyer)
          match.buyer = { $regex: new RegExp(escapeRegExp(buyer.trim()), "i") };
        if (lineNo) match.lineNo = lineNo.trim();
        //if (lineNo) match.lineNo = { $regex: new RegExp(lineNo.trim(), "i") };
    
        // Normalize and convert dates to Date objects for proper comparison using $expr
        if (startDate || endDate) {
          match.$expr = match.$expr || {}; // Initialize $expr if not present
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
    
        match.inspection_time = { $regex: /^\d{2}:\d{2}:\d{2}$/ };
    
        const data = await QC2InspectionPassBundle.aggregate([
          { $match: match },
          {
            $project: {
              lineNo: 1,
              moNo: 1,
              checkedQty: 1,
              defectQty: 1,
              defectArray: 1,
              inspection_time: 1,
              hour: { $toInt: { $substr: ["$inspection_time", 0, 2] } },
              minute: { $toInt: { $substr: ["$inspection_time", 3, 2] } },
              second: { $toInt: { $substr: ["$inspection_time", 6, 2] } }
            }
          },
          {
            $match: {
              minute: { $gte: 0, $lte: 59 },
              second: { $gte: 0, $lte: 59 }
            }
          },
          {
            $group: {
              _id: { lineNo: "$lineNo", moNo: "$moNo", hour: "$hour" },
              totalCheckedQty: { $sum: "$checkedQty" },
              totalDefectQty: { $sum: "$defectQty" },
              defectRecords: { $push: "$defectArray" }
            }
          },
          { $unwind: { path: "$defectRecords", preserveNullAndEmptyArrays: true } },
          { $unwind: { path: "$defectRecords", preserveNullAndEmptyArrays: true } },
          {
            $group: {
              _id: {
                lineNo: "$_id.lineNo",
                moNo: "$_id.moNo",
                hour: "$_id.hour",
                defectName: "$defectRecords.defectName"
              },
              totalCheckedQty: { $first: "$totalCheckedQty" },
              totalDefectQty: { $first: "$totalDefectQty" },
              defectCount: { $sum: "$defectRecords.totalCount" }
            }
          },
          {
            $group: {
              _id: { lineNo: "$_id.lineNo", moNo: "$_id.moNo", hour: "$_id.hour" },
              checkedQty: { $first: "$totalCheckedQty" },
              totalDefectQty: { $first: "$totalDefectQty" },
              defects: {
                $push: {
                  name: "$_id.defectName",
                  count: {
                    $cond: [{ $eq: ["$defectCount", null] }, 0, "$defectCount"]
                  }
                }
              }
            }
          },
          {
            $group: {
              _id: { lineNo: "$_id.lineNo", moNo: "$_id.moNo" },
              hours: {
                $push: {
                  hour: "$_id.hour",
                  checkedQty: "$checkedQty",
                  defects: "$defects",
                  defectQty: "$totalDefectQty"
                }
              },
              totalCheckedQty: { $sum: "$checkedQty" },
              totalDefectQty: { $sum: "$totalDefectQty" }
            }
          },
          {
            $group: {
              _id: "$_id.lineNo",
              moNos: {
                $push: {
                  moNo: "$_id.moNo",
                  hours: "$hours",
                  totalCheckedQty: "$totalCheckedQty",
                  totalDefectQty: "$totalDefectQty",
                  totalRate: {
                    $cond: [
                      { $eq: ["$totalCheckedQty", 0] },
                      0,
                      {
                        $multiply: [
                          { $divide: ["$totalDefectQty", "$totalCheckedQty"] },
                          100
                        ]
                      }
                    ]
                  }
                }
              },
              totalCheckedQty: { $sum: "$totalCheckedQty" },
              totalDefectQty: { $sum: "$totalDefectQty" }
            }
          },
          {
            $project: {
              lineNo: "$_id",
              moData: {
                $arrayToObject: {
                  $map: {
                    input: "$moNos",
                    as: "mo",
                    in: {
                      k: "$$mo.moNo",
                      v: {
                        hourData: {
                          $arrayToObject: {
                            $map: {
                              input: "$$mo.hours",
                              as: "h",
                              in: {
                                k: { $toString: { $add: ["$$h.hour", 1] } },
                                v: {
                                  rate: {
                                    $cond: [
                                      { $eq: ["$$h.checkedQty", 0] },
                                      0,
                                      {
                                        $multiply: [
                                          {
                                            $divide: [
                                              "$$h.defectQty",
                                              "$$h.checkedQty"
                                            ]
                                          },
                                          100
                                        ]
                                      }
                                    ]
                                  },
                                  hasCheckedQty: { $gt: ["$$h.checkedQty", 0] },
                                  checkedQty: "$$h.checkedQty",
                                  defects: "$$h.defects"
                                }
                              }
                            }
                          }
                        },
                        totalRate: "$$mo.totalRate"
                      }
                    }
                  }
                }
              },
              totalRate: {
                $cond: [
                  { $eq: ["$totalCheckedQty", 0] },
                  0,
                  {
                    $multiply: [
                      { $divide: ["$totalDefectQty", "$totalCheckedQty"] },
                      100
                    ]
                  }
                ]
              },
              _id: 0
            }
          },
          { $sort: { lineNo: 1 } }
        ]);
    
        const totalData = await QC2InspectionPassBundle.aggregate([
          { $match: match },
          {
            $project: {
              checkedQty: 1,
              defectQty: 1,
              hour: { $toInt: { $substr: ["$inspection_time", 0, 2] } }
            }
          },
          {
            $group: {
              _id: "$hour",
              totalCheckedQty: { $sum: "$checkedQty" },
              totalDefectQty: { $sum: "$defectQty" }
            }
          },
          {
            $project: {
              hour: "$_id",
              rate: {
                $cond: [
                  { $eq: ["$totalCheckedQty", 0] },
                  0,
                  {
                    $multiply: [
                      { $divide: ["$totalDefectQty", "$totalCheckedQty"] },
                      100
                    ]
                  }
                ]
              },
              hasCheckedQty: { $gt: ["$totalCheckedQty", 0] },
              _id: 0
            }
          }
        ]);
    
        const grandTotal = await QC2InspectionPassBundle.aggregate([
          { $match: match },
          {
            $group: {
              _id: null,
              totalCheckedQty: { $sum: "$checkedQty" },
              totalDefectQty: { $sum: "$defectQty" }
            }
          },
          {
            $project: {
              rate: {
                $cond: [
                  { $eq: ["$totalCheckedQty", 0] },
                  0,
                  {
                    $multiply: [
                      { $divide: ["$totalDefectQty", "$totalCheckedQty"] },
                      100
                    ]
                  }
                ]
              },
              _id: 0
            }
          }
        ]);
    
        const result = {};
        data.forEach((item) => {
          result[item.lineNo] = {};
          Object.keys(item.moData).forEach((moNo) => {
            result[item.lineNo][moNo] = {};
            Object.keys(item.moData[moNo].hourData).forEach((hour) => {
              const formattedHour = `${hour}:00`.padStart(5, "0");
              const hourData = item.moData[moNo].hourData[hour];
              result[item.lineNo][moNo][formattedHour] = {
                rate: hourData.rate,
                hasCheckedQty: hourData.hasCheckedQty,
                checkedQty: hourData.checkedQty,
                defects: hourData.defects.map((defect) => ({
                  name: defect.name || "No Defect",
                  count: defect.count,
                  rate:
                    hourData.checkedQty > 0
                      ? (defect.count / hourData.checkedQty) * 100
                      : 0
                }))
              };
            });
            result[item.lineNo][moNo].totalRate = item.moData[moNo].totalRate;
          });
          result[item.lineNo].totalRate = item.totalRate;
        });
    
        result.total = {};
        totalData.forEach((item) => {
          const formattedHour = `${item.hour + 1}:00`.padStart(5, "0");
          if (item.hour >= 6 && item.hour <= 20) {
            result.total[formattedHour] = {
              rate: item.rate,
              hasCheckedQty: item.hasCheckedQty
            };
          }
        });
    
        result.grand = grandTotal.length > 0 ? grandTotal[0] : { rate: 0 };
    
        const hours = [
          "07:00",
          "08:00",
          "09:00",
          "10:00",
          "11:00",
          "12:00",
          "13:00",
          "14:00",
          "15:00",
          "16:00",
          "17:00",
          "18:00",
          "19:00",
          "20:00",
          "21:00"
        ];
        Object.keys(result).forEach((key) => {
          if (key !== "grand" && key !== "total") {
            Object.keys(result[key]).forEach((moNo) => {
              if (moNo !== "totalRate") {
                hours.forEach((hour) => {
                  if (!result[key][moNo][hour]) {
                    result[key][moNo][hour] = {
                      rate: 0,
                      hasCheckedQty: false,
                      checkedQty: 0,
                      defects: []
                    };
                  }
                });
              }
            });
          }
        });
    
        res.json(result);
      } catch (error) {
        console.error("Error fetching defect rates by line:", error);
        res.status(500).json({ error: "Failed to fetch defect rates by line" });
      }
};


/* ------------------------------
   QC2 OrderData Live Dashboard
------------------------------ */

export const getQC2OrderData = async (req, res) => {
     try {
    const filterOptions = await QC2OrderData.aggregate([
      {
        $group: {
          _id: null,
          moNo: { $addToSet: "$selectedMono" },
          color: { $addToSet: "$color" },
          size: { $addToSet: "$size" },
          department: { $addToSet: "$department" },
          empId: { $addToSet: "$emp_id" },
          buyer: { $addToSet: "$buyer" },
          lineNo: { $addToSet: "$lineNo" }
        }
      },
      {
        $project: {
          _id: 0,
          moNo: 1,
          color: 1,
          size: 1,
          department: 1,
          empId: 1,
          buyer: 1,
          lineNo: 1
        }
      }
    ]);

    const result =
      filterOptions.length > 0
        ? filterOptions[0]
        : {
            moNo: [],
            color: [],
            size: [],
            department: [],
            empId: [],
            buyer: [],
            lineNo: []
          };

    Object.keys(result).forEach((key) => {
      result[key] = result[key]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
    });

    res.json(result);
  } catch (error) {
    console.error("Error fetching filter options:", error);
    res.status(500).json({ error: "Failed to fetch filter options" });
  }
};

export const getQC2OrderDataSummary = async (req, res) => {
    try {
    const {
      moNo,
      startDate,
      endDate,
      color,
      size,
      department,
      empId,
      buyer,
      lineNo,
      page = 1,
      limit = 50
    } = req.query;

    let match = {};
    if (moNo) match.selectedMono = { $regex: new RegExp(moNo.trim(), "i") };
    if (color) match.color = color;
    if (size) match.size = size;
    if (department) match.department = department;
    if (empId) match.emp_id = { $regex: new RegExp(empId.trim(), "i") };
    if (buyer) match.buyer = { $regex: new RegExp(buyer.trim(), "i") };
    if (lineNo) match.lineNo = { $regex: new RegExp(lineNo.trim(), "i") };
    if (startDate || endDate) {
      match.updated_date_seperator = {};
      if (startDate) match.updated_date_seperator.$gte = startDate;
      if (endDate) match.updated_date_seperator.$lte = endDate;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const pipeline = [
      { $match: match },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                totalRegisteredBundleQty: { $sum: "$totalBundleQty" },
                totalGarmentsQty: { $sum: "$count" },
                uniqueMONos: { $addToSet: "$selectedMono" },
                uniqueColors: { $addToSet: "$color" }, // Add unique colors
                uniqueSizes: { $addToSet: "$size" }, // Add unique sizes
                uniqueOrderQty: {
                  $addToSet: { moNo: "$selectedMono", orderQty: "$orderQty" }
                }
              }
            },
            {
              $project: {
                _id: 0,
                totalRegisteredBundleQty: 1,
                totalGarmentsQty: 1,
                totalMO: { $size: "$uniqueMONos" },
                totalColors: { $size: "$uniqueColors" }, // Count unique colors
                totalSizes: { $size: "$uniqueSizes" }, // Count unique sizes
                totalOrderQty: {
                  $sum: {
                    $map: {
                      input: "$uniqueOrderQty",
                      in: "$$this.orderQty"
                    }
                  }
                }
              }
            }
          ],
          tableData: [
            {
              $group: {
                _id: {
                  lineNo: "$lineNo",
                  moNo: "$selectedMono",
                  custStyle: "$custStyle",
                  country: "$country",
                  buyer: "$buyer",
                  color: "$color",
                  size: "$size",
                  empId: "$emp_id" // Add emp_id to group
                },
                totalRegisteredBundleQty: { $sum: "$totalBundleQty" },
                totalGarments: { $sum: "$count" },
                orderQty: { $first: "$orderQty" } // Use $first to get orderQty for each unique MO
              }
            },
            {
              $project: {
                _id: 0,
                lineNo: "$_id.lineNo",
                moNo: "$_id.moNo",
                custStyle: "$_id.custStyle",
                country: "$_id.country",
                buyer: "$_id.buyer",
                color: "$_id.color",
                size: "$_id.size",
                empId: "$_id.empId", // Include empId in output
                totalRegisteredBundleQty: 1,
                totalGarments: 1,
                orderQty: 1 // Include orderQty in output
              }
            },
            { $sort: { lineNo: 1, moNo: 1 } },
            { $skip: skip },
            { $limit: limitNum }
          ],
          total: [{ $count: "count" }]
        }
      }
    ];

    const result = await QC2OrderData.aggregate(pipeline);
    const summary = result[0].summary[0] || {
      totalRegisteredBundleQty: 0,
      totalGarmentsQty: 0,
      totalMO: 0,
      totalColors: 0, // Default for new fields
      totalSizes: 0,
      totalOrderQty: 0
    };
    const tableData = result[0].tableData || [];
    const total = result[0].total.length > 0 ? result[0].total[0].count : 0;

    res.json({ summary, tableData, total });
  } catch (error) {
    console.error("Error fetching order data summary:", error);
    res.status(500).json({ error: "Failed to fetch order data summary" });
  }
};
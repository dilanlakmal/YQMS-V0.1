import {
  QC2OrderData,
} from "../../MongoDB/dbConnectionController.js";

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
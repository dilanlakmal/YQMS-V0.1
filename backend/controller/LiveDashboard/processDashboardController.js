import {
  Washing,
  Ironing, 
  OPA,             
} from "../MongoDB/dbConnectionController.js";

/* ------------------------------
   QC2 Washing Live Dashboard
------------------------------ */

// export const getwashingAutocomplete = async (req, res) => {
//     try {
//     const { field, query } = req.query;

//     // Validate field
//     const validFields = [
//       "selectedMono",
//       "custStyle",
//       "buyer",
//       "color",
//       "size",
//       "emp_id_washing"
//     ];
//     if (!validFields.includes(field)) {
//       return res.status(400).json({ error: "Invalid field" });
//     }

//     // Build match stage for partial search (optional)
//     const match = {};
//     if (query) {
//       match[field] = { $regex: new RegExp(query.trim(), "i") };
//     }

//     const pipeline = [
//       { $match: match },
//       {
//         $group: {
//           _id: `$${field}`
//         }
//       },
//       {
//         $project: {
//           _id: 0,
//           value: "$_id"
//         }
//       },
//       { $sort: { value: 1 } },
//       ...(query ? [{ $limit: 10 }] : []) // Limit only when searching
//     ];

//     const results = await Washing.aggregate(pipeline);
//     const suggestions = results.map((item) => item.value).filter(Boolean);

//     res.json(suggestions);
//   } catch (error) {
//     console.error("Error fetching autocomplete suggestions:", error);
//     res.status(500).json({ error: "Failed to fetch suggestions" });
//   }
// };

const createAutocompleteHandler = (Model) => async (req, res) => {
  try {
    const { field, query } = req.query;
    const validFields = [
      "selectedMono", "custStyle", "buyer", "color", "size",
      "emp_id_washing", "emp_id_ironing", "emp_id_opa" // Combine all possible emp_id fields
    ];
    if (!validFields.includes(field)) {
      return res.status(400).json({ error: "Invalid field for autocomplete" });
    }

    const match = {};
    if (query) {
      match[field] = { $regex: new RegExp(String(query).trim(), "i") };
    }

    const pipeline = [
      { $match: match },
      { $group: { _id: `$${field}` } },
      { $project: { _id: 0, value: "$_id" } },
      { $sort: { value: 1 } },
      ...(query ? [{ $limit: 10 }] : [])
    ];

    const results = await Model.aggregate(pipeline);
    const suggestions = results.map((item) => item.value).filter(Boolean);
    res.json(suggestions);
  } catch (error) {
    console.error(`Error fetching ${Model.modelName} autocomplete suggestions:`, error);
    res.status(500).json({ error: "Failed to fetch suggestions" });
  }
};

// GET /api/washing-autocomplete
export const getWashingAutocomplete = createAutocompleteHandler(Washing);

// GET /api/ironing-autocomplete
export const getIroningAutocomplete = createAutocompleteHandler(Ironing);

// GET /api/opa-autocomplete
export const getOpaAutocomplete = createAutocompleteHandler(OPA);

const createSummaryHandler = (Model, config) => async (req, res) => {
  try {
    const {
      moNo,
      custStyle,
      color,
      size,
      empId, // Generic empId from query
      buyer,
      page = 1,
      limit = 50,
    } = req.query;

    const match = {};
    if (moNo) match.selectedMono = { $regex: new RegExp(String(moNo).trim(), "i") };
    if (custStyle) match.custStyle = { $regex: new RegExp(String(custStyle).trim(), "i") };
    if (color) match.color = { $regex: new RegExp(String(color).trim(), "i") };
    if (size) match.size = { $regex: new RegExp(String(size).trim(), "i") };
    if (empId) match[config.empIdField] = { $regex: new RegExp(String(empId).trim(), "i") }; // Use specific empIdField from config
    if (buyer) match.buyer = { $regex: new RegExp(String(buyer).trim(), "i") };

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: {
            moNo: "$selectedMono",
            custStyle: "$custStyle",
            buyer: "$buyer",
            color: "$color",
            size: "$size",
          },
          goodBundleQty: {
            $sum: {
              $cond: [{ $eq: [`$${config.taskNoField}`, config.goodTaskNo] }, "$totalBundleQty", 0],
            },
          },
          defectiveBundleQty: {
            $sum: {
              $cond: [{ $eq: [`$${config.taskNoField}`, config.defectiveTaskNo] }, "$totalBundleQty", 0],
            },
          },
          goodGarments: {
            $sum: {
              $cond: [
                { $eq: [`$${config.taskNoField}`, config.goodTaskNo] },
                config.passQtyValueExpression, // Use configured expression for summing pass quantity
                0,
              ],
            },
          },
          defectiveGarments: {
            $sum: {
              $cond: [
                { $eq: [`$${config.taskNoField}`, config.defectiveTaskNo] },
                config.passQtyValueExpression, // Use configured expression for summing pass quantity
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          moNo: "$_id.moNo",
          custStyle: "$_id.custStyle",
          buyer: "$_id.buyer",
          color: "$_id.color",
          size: "$_id.size",
          goodBundleQty: 1,
          defectiveBundleQty: 1,
          goodGarments: 1,
          defectiveGarments: 1,
        },
      },
      { $sort: { moNo: 1 } },
      {
        $facet: {
          tableData: [{ $skip: skip }, { $limit: limitNum }],
          total: [{ $count: "count" }],
        },
      },
    ];

    const result = await Model.aggregate(pipeline);
    const tableData = result && result[0] && result[0].tableData ? result[0].tableData : [];
    const total = result && result[0] && result[0].total && result[0].total.length > 0 ? result[0].total[0].count : 0;

    res.json({ tableData, total });
  } catch (error) {
    console.error(`Error fetching ${config.summaryName} summary:`, error);
    res.status(500).json({ error: `Failed to fetch ${config.summaryName} summary` });
  }
};

// Configuration for Washing Summary
const washingSummaryConfig = {
  empIdField: "emp_id_washing",
  taskNoField: "task_no_washing",
  goodTaskNo: 55,
  defectiveTaskNo: 86,
  passQtyValueExpression: { $toInt: "$passQtyWash" }, // Specific expression for washing pass quantity
  summaryName: "Washing",
};

// Configuration for Ironing Summary
const ironingSummaryConfig = {
  empIdField: "emp_id_ironing",
  taskNoField: "task_no_ironing",
  goodTaskNo: 53,
  defectiveTaskNo: 84,
  passQtyValueExpression: "$passQtyIron", // Direct field for ironing pass quantity
  summaryName: "Ironing",
};

// Configuration for OPA Summary
const opaSummaryConfig = {
  empIdField: "emp_id_opa",
  taskNoField: "task_no_opa",
  goodTaskNo: 60,
  defectiveTaskNo: 85,
  passQtyValueExpression: "$passQtyOPA", // Direct field for OPA pass quantity
  summaryName: "OPA",
};

// Exported Summary Handlers
// GET /api/washing-summary
export const getWashingSummary = createSummaryHandler(Washing, washingSummaryConfig);

// GET /api/ironing-summary
export const getIroningSummary = createSummaryHandler(Ironing, ironingSummaryConfig);

// GET /api/opa-summary
export const getOpaSummary = createSummaryHandler(OPA, opaSummaryConfig);
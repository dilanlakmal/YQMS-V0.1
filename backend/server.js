// import express from "express";
// import mongoose from "mongoose";
// import cors from "cors";
// import bodyParser from "body-parser";

// const app = express();
// const PORT = 5001;

// app.use(cors());
// app.use(bodyParser.json());

// const mongoURI = "mongodb://localhost:27017/ym_prod";
// mongoose
//   .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => console.log("MongoDB connected to ym_prod database"))
//   .catch((err) => console.error("MongoDB connection error:", err));

// const qcDataSchema = new mongoose.Schema(
//   {
//     headerData: {
//       type: Object,
//       required: true,
//       transform: function (doc, ret) {
//         for (let key in ret) {
//           if (ret[key] instanceof Date) {
//             ret[key] = ret[key].toISOString();
//           }
//         }
//         return ret;
//       },
//     },
//     type: { type: String, required: true },
//     garmentNo: {
//       type: Number,
//       required: function () {
//         return !this.type.includes("return");
//       },
//     },
//     status: { type: String, required: true },
//     timestamp: { type: Number, required: true },
//     formattedTimestamp: { type: String, required: true },
//     actualtime: { type: Number, required: true },
//     formattedActualTime: { type: String, required: true },
//     defectDetails: { type: Array, default: [] },
//     checkedQty: { type: Number, required: true },
//     goodOutput: { type: Number, required: true },
//     defectQty: { type: Number, required: true },
//     defectPieces: { type: Number, required: true },
//     defectArray: { type: Array, default: [] },
//     cumulativeChecked: { type: Number, required: true },
//     cumulativeDefects: { type: Number, required: true },
//     cumulativeGoodOutput: { type: Number, required: true },
//     cumulativeDefectPieces: { type: Number, required: true },
//     returnDefectList: { type: Array, default: [] },
//     returnDefectArray: { type: Array, default: [] },
//     returnDefectQty: { type: Number, required: true },
//     cumulativeReturnDefectQty: { type: Number, required: true },
//   },
//   {
//     collection: "qc1_data",
//   }
// );

// const QCData = mongoose.model("qc1_data", qcDataSchema);

// const buildFilterQuery = (date, lineNo, moNo, customer) => {
//   const query = {};

//   if (date) {
//     const startOfDay = new Date(date);
//     startOfDay.setHours(0, 0, 0, 0);
//     const endOfDay = new Date(date);
//     endOfDay.setHours(23, 59, 59, 999);

//     query["headerData.date"] = {
//       $gte: startOfDay.toISOString(),
//       $lte: endOfDay.toISOString(),
//     };
//   }

//   if (lineNo && lineNo !== "All") {
//     query["headerData.lineNo"] = lineNo;
//   }

//   if (moNo && moNo !== "All") {
//     query["headerData.moNo"] = moNo;
//   }

//   if (customer && customer !== "All") {
//     query["headerData.customer"] = customer;
//   }

//   return query;
// };

// app.get("/api/filter-options", async (req, res) => {
//   try {
//     const lineNos = await QCData.distinct("headerData.lineNo");
//     const moNos = await QCData.distinct("headerData.moNo");
//     const customers = await QCData.distinct("headerData.customer");

//     res.json({
//       lineNos: ["All", ...lineNos].filter(Boolean),
//       moNos: ["All", ...moNos].filter(Boolean),
//       customers: ["All", ...customers].filter(Boolean),
//     });
//   } catch (error) {
//     console.error("Error fetching filter options:", error);
//     res.status(500).json({ message: "Failed to fetch filter options" });
//   }
// });

// app.get("/api/dashboard-stats", async (req, res) => {
//   try {
//     const { date, lineNo, moNo, customer, timeInterval = "1" } = req.query;
//     const filterQuery = buildFilterQuery(date, lineNo, moNo, customer);

//     const stats = await QCData.aggregate([
//       { $match: filterQuery },
//       {
//         $group: {
//           _id: null,
//           totalCheckedQty: { $sum: "$checkedQty" },
//           totalDefectQty: { $sum: "$defectQty" },
//           totalDefectPieces: { $sum: "$defectPieces" },
//           totalReturnDefectQty: { $sum: "$returnDefectQty" },
//           totalGoodOutput: { $sum: "$goodOutput" },
//           latestDefectArray: { $last: "$defectArray" },
//           latestHeaderData: { $last: "$headerData" },
//         },
//       },
//     ]);

//     const defectRateByLine = await QCData.aggregate([
//       { $match: filterQuery },
//       {
//         $group: {
//           _id: "$headerData.lineNo",
//           checkedQty: { $sum: "$checkedQty" },
//           defectQty: { $sum: "$defectQty" },
//         },
//       },
//       {
//         $project: {
//           lineNo: "$_id",
//           defectRate: {
//             $multiply: [
//               { $divide: ["$defectQty", { $max: ["$checkedQty", 1] }] },
//               100,
//             ],
//           },
//         },
//       },
//       { $sort: { defectRate: -1 } },
//     ]);

//     const defectRateByMO = await QCData.aggregate([
//       { $match: filterQuery },
//       {
//         $group: {
//           _id: "$headerData.moNo",
//           checkedQty: { $sum: "$checkedQty" },
//           defectQty: { $sum: "$defectQty" },
//         },
//       },
//       {
//         $project: {
//           moNo: "$_id",
//           defectRate: {
//             $multiply: [
//               { $divide: ["$defectQty", { $max: ["$checkedQty", 1] }] },
//               100,
//             ],
//           },
//         },
//       },
//       { $sort: { defectRate: -1 } },
//     ]);

//     const defectRateByCustomer = await QCData.aggregate([
//       { $match: filterQuery },
//       {
//         $group: {
//           _id: "$headerData.customer",
//           checkedQty: { $sum: "$checkedQty" },
//           defectQty: { $sum: "$defectQty" },
//         },
//       },
//       {
//         $project: {
//           customer: "$_id",
//           defectRate: {
//             $multiply: [
//               { $divide: ["$defectQty", { $max: ["$checkedQty", 1] }] },
//               100,
//             ],
//           },
//         },
//       },
//       { $sort: { defectRate: -1 } },
//     ]);

//     const latestRecord = await QCData.findOne(filterQuery, {
//       defectArray: 1,
//     }).sort({ timestamp: -1 });

//     const topDefects = latestRecord?.defectArray
//       ? Object.entries(
//           latestRecord.defectArray.reduce((acc, { name, count }) => {
//             acc[name] = (acc[name] || 0) + count;
//             return acc;
//           }, {})
//         )
//           .map(([name, count]) => ({
//             _id: name,
//             count: count,
//           }))
//           .sort((a, b) => b.count - a.count)
//       : [];

//     const timeSeriesData = await QCData.aggregate([
//       { $match: filterQuery },
//       {
//         $addFields: {
//           timeComponents: {
//             $let: {
//               vars: {
//                 timeParts: { $split: ["$formattedTimestamp", ":"] },
//               },
//               in: {
//                 hours: { $toInt: { $arrayElemAt: ["$$timeParts", 0] } },
//                 minutes: { $toInt: { $arrayElemAt: ["$$timeParts", 1] } },
//                 seconds: { $toInt: { $arrayElemAt: ["$$timeParts", 2] } },
//               },
//             },
//           },
//         },
//       },
//       {
//         $addFields: {
//           totalMinutes: {
//             $add: [
//               { $multiply: ["$timeComponents.hours", 60] },
//               "$timeComponents.minutes",
//             ],
//           },
//         },
//       },
//       {
//         $sort: { timestamp: 1 },
//       },
//       {
//         $group: {
//           _id: {
//             $switch: {
//               branches: [
//                 {
//                   case: { $eq: [parseInt(timeInterval), 1] },
//                   then: {
//                     $multiply: [
//                       { $floor: { $divide: ["$totalMinutes", 1] } },
//                       1,
//                     ],
//                   },
//                 },
//                 {
//                   case: { $eq: [parseInt(timeInterval), 15] },
//                   then: {
//                     $multiply: [
//                       { $floor: { $divide: ["$totalMinutes", 15] } },
//                       15,
//                     ],
//                   },
//                 },
//                 {
//                   case: { $eq: [parseInt(timeInterval), 30] },
//                   then: {
//                     $multiply: [
//                       { $floor: { $divide: ["$totalMinutes", 30] } },
//                       30,
//                     ],
//                   },
//                 },
//                 {
//                   case: { $eq: [parseInt(timeInterval), 60] },
//                   then: {
//                     $multiply: [
//                       { $floor: { $divide: ["$totalMinutes", 60] } },
//                       60,
//                     ],
//                   },
//                 },
//               ],
//               default: "$totalMinutes",
//             },
//           },
//           cumulativeChecked: { $last: "$cumulativeChecked" },
//           cumulativeDefects: { $last: "$cumulativeDefects" },
//         },
//       },
//       {
//         $project: {
//           timestamp: {
//             $switch: {
//               branches: [
//                 {
//                   case: { $eq: [parseInt(timeInterval), 60] },
//                   then: { $toString: { $divide: ["$_id", 60] } },
//                 },
//               ],
//               default: { $toString: "$_id" },
//             },
//           },
//           checkedQty: "$cumulativeChecked",
//           defectQty: "$cumulativeDefects",
//           defectRate: {
//             $round: [
//               {
//                 $multiply: [
//                   {
//                     $divide: [
//                       "$cumulativeDefects",
//                       { $max: ["$cumulativeChecked", 1] },
//                     ],
//                   },
//                   100,
//                 ],
//               },
//               2,
//             ],
//           },
//         },
//       },
//       { $sort: { _id: 1 } },
//     ]);

//     const dashboardData = stats[0] || {
//       totalCheckedQty: 0,
//       totalDefectQty: 0,
//       totalDefectPieces: 0,
//       totalReturnDefectQty: 0,
//       totalGoodOutput: 0,
//       latestHeaderData: {},
//     };

//     const totalInspected = dashboardData.totalCheckedQty || 0;

//     res.json({
//       filters: {
//         lineNos: await QCData.distinct("headerData.lineNo"),
//         moNos: await QCData.distinct("headerData.moNo"),
//         customers: await QCData.distinct("headerData.customer"),
//       },
//       headerInfo: dashboardData.latestHeaderData,
//       stats: {
//         checkedQty: dashboardData.totalCheckedQty || 0,
//         defectQty: dashboardData.totalDefectQty || 0,
//         defectPieces: dashboardData.totalDefectPieces || 0,
//         returnDefectQty: dashboardData.totalReturnDefectQty || 0,
//         goodOutput: dashboardData.totalGoodOutput || 0,
//         defectRatio: totalInspected
//           ? ((dashboardData.totalDefectQty / totalInspected) * 100).toFixed(2)
//           : 0,
//         defectRate: totalInspected
//           ? ((dashboardData.totalDefectPieces / totalInspected) * 100).toFixed(
//               2
//             )
//           : 0,
//       },
//       defectRateByLine,
//       defectRateByMO,
//       defectRateByCustomer,
//       topDefects,
//       timeSeriesData,
//     });
//   } catch (error) {
//     console.error("Error fetching dashboard stats:", error);
//     res.status(500).json({ message: "Failed to fetch dashboard stats" });
//   }
// });

// app.post("/api/save-qc-data", async (req, res) => {
//   try {
//     const sanitizedDefects = (req.body.defectDetails || []).map((defect) => ({
//       name: defect.name.toString().trim(),
//       count: Math.abs(parseInt(defect.count)) || 0,
//     }));

//     const sanitizedData = {
//       ...req.body,
//       defectArray: sanitizedDefects,
//       headerData: {
//         ...req.body.headerData,
//         date: req.body.headerData.date
//           ? new Date(req.body.headerData.date).toISOString()
//           : undefined,
//       },
//     };

//     const qcData = new QCData(sanitizedData);
//     const savedData = await qcData.save();

//     res.status(201).json({
//       message: "QC data saved successfully",
//       data: savedData,
//     });
//   } catch (error) {
//     console.error("Error saving QC data:", error);
//     res.status(500).json({
//       message: "Failed to save QC data",
//       error: error.message,
//       details: error.errors
//         ? Object.keys(error.errors).map((key) => ({
//             field: key,
//             message: error.errors[key].message,
//           }))
//         : undefined,
//     });
//   }
// });

// app.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
// });

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
const PORT = 5001;

app.use(cors());
app.use(bodyParser.json());

const mongoURI = "mongodb://localhost:27017/ym_prod";
mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected to ym_prod database"))
  .catch((err) => console.error("MongoDB connection error:", err));

const qcDataSchema = new mongoose.Schema(
  {
    headerData: {
      type: Object,
      required: true,
      transform: function (doc, ret) {
        for (let key in ret) {
          if (ret[key] instanceof Date) {
            ret[key] = ret[key].toISOString();
          }
        }
        return ret;
      },
    },
    type: { type: String, required: true },
    garmentNo: {
      type: Number,
      required: function () {
        return !this.type.includes("return");
      },
    },
    status: { type: String, required: true },
    timestamp: { type: Number, required: true },
    formattedTimestamp: { type: String, required: true },
    actualtime: { type: Number, required: true },
    formattedActualTime: { type: String, required: true },
    defectDetails: { type: Array, default: [] },
    checkedQty: { type: Number, required: true },
    goodOutput: { type: Number, required: true },
    defectQty: { type: Number, required: true },
    defectPieces: { type: Number, required: true },
    defectArray: { type: Array, default: [] },
    cumulativeChecked: { type: Number, required: true },
    cumulativeDefects: { type: Number, required: true },
    cumulativeGoodOutput: { type: Number, required: true },
    cumulativeDefectPieces: { type: Number, required: true },
    returnDefectList: { type: Array, default: [] },
    returnDefectArray: { type: Array, default: [] },
    returnDefectQty: { type: Number, required: true },
    cumulativeReturnDefectQty: { type: Number, required: true },
  },
  {
    collection: "qc1_data",
  }
);

const QCData = mongoose.model("qc1_data", qcDataSchema);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/dashboard-stats", async (req, res) => {
  try {
    const { factory, lineNo, moNo, customer, timeInterval = "1" } = req.query;
    let matchQuery = {};

    // Apply filters if provided
    if (factory) matchQuery["headerData.factory"] = factory;
    if (lineNo) matchQuery["headerData.lineNo"] = lineNo;
    if (moNo) matchQuery["headerData.moNo"] = moNo;
    if (customer) matchQuery["headerData.customer"] = customer;

    // Get unique filter values
    const filterValues = await QCData.aggregate([
      {
        $group: {
          _id: null,
          factories: { $addToSet: "$headerData.factory" },
          lineNos: { $addToSet: "$headerData.lineNo" },
          moNos: { $addToSet: "$headerData.moNo" },
          customers: { $addToSet: "$headerData.customer" },
        },
      },
    ]);

    // Get overall stats
    const stats = await QCData.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalCheckedQty: { $sum: "$checkedQty" },
          totalDefectQty: { $sum: "$defectQty" },
          totalDefectPieces: { $sum: "$defectPieces" },
          totalReturnDefectQty: { $sum: "$returnDefectQty" },
          totalGoodOutput: { $sum: "$goodOutput" },
          latestDefectArray: { $last: "$defectArray" },
          latestHeaderData: { $last: "$headerData" },
        },
      },
    ]);

    // Get defect rate by line
    const defectRateByLine = await QCData.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$headerData.lineNo",
          checkedQty: { $sum: "$checkedQty" },
          defectQty: { $sum: "$defectQty" },
        },
      },
      {
        $project: {
          lineNo: "$_id",
          defectRate: {
            $multiply: [
              { $divide: ["$defectQty", { $max: ["$checkedQty", 1] }] },
              100,
            ],
          },
        },
      },
      { $sort: { defectRate: -1 } },
    ]);

    // Get defect rate by MO
    const defectRateByMO = await QCData.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$headerData.moNo",
          checkedQty: { $sum: "$checkedQty" },
          defectQty: { $sum: "$defectQty" },
        },
      },
      {
        $project: {
          moNo: "$_id",
          defectRate: {
            $multiply: [
              { $divide: ["$defectQty", { $max: ["$checkedQty", 1] }] },
              100,
            ],
          },
        },
      },
      { $sort: { defectRate: -1 } },
    ]);

    // Get defect rate by customer
    const defectRateByCustomer = await QCData.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$headerData.customer",
          checkedQty: { $sum: "$checkedQty" },
          defectQty: { $sum: "$defectQty" },
        },
      },
      {
        $project: {
          customer: "$_id",
          defectRate: {
            $multiply: [
              { $divide: ["$defectQty", { $max: ["$checkedQty", 1] }] },
              100,
            ],
          },
        },
      },
      { $sort: { defectRate: -1 } },
    ]);

    // Get the latest record with defect array to get accurate defect counts
    const topDefects = await QCData.aggregate([
      { $match: matchQuery },
      { $unwind: "$defectArray" },
      {
        $group: {
          _id: "$defectArray.name",
          count: { $sum: "$defectArray.count" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // In server.js, replace the timeSeriesData aggregation with:
    const timeSeriesData = await QCData.aggregate([
      { $match: matchQuery },
      {
        $addFields: {
          timeComponents: {
            $let: {
              vars: {
                timeParts: { $split: ["$formattedTimestamp", ":"] },
              },
              in: {
                hours: { $toInt: { $arrayElemAt: ["$$timeParts", 0] } },
                minutes: { $toInt: { $arrayElemAt: ["$$timeParts", 1] } },
                seconds: { $toInt: { $arrayElemAt: ["$$timeParts", 2] } },
              },
            },
          },
        },
      },
      {
        $addFields: {
          totalMinutes: {
            $add: [
              { $multiply: ["$timeComponents.hours", 60] },
              "$timeComponents.minutes",
            ],
          },
        },
      },
      {
        $sort: { timestamp: 1 },
      },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                {
                  case: { $eq: [parseInt(timeInterval), 1] },
                  then: {
                    $multiply: [
                      { $floor: { $divide: ["$totalMinutes", 1] } },
                      1,
                    ],
                  },
                },
                {
                  case: { $eq: [parseInt(timeInterval), 15] },
                  then: {
                    $multiply: [
                      { $floor: { $divide: ["$totalMinutes", 15] } },
                      15,
                    ],
                  },
                },
                {
                  case: { $eq: [parseInt(timeInterval), 30] },
                  then: {
                    $multiply: [
                      { $floor: { $divide: ["$totalMinutes", 30] } },
                      30,
                    ],
                  },
                },
                {
                  case: { $eq: [parseInt(timeInterval), 60] },
                  then: {
                    $multiply: [
                      { $floor: { $divide: ["$totalMinutes", 60] } },
                      60,
                    ],
                  },
                },
              ],
              default: "$totalMinutes",
            },
          },
          // Use last record for the time period to get cumulative values
          cumulativeChecked: { $last: "$cumulativeChecked" },
          cumulativeDefects: { $last: "$cumulativeDefects" },
        },
      },
      {
        $project: {
          timestamp: {
            $switch: {
              branches: [
                {
                  case: { $eq: [parseInt(timeInterval), 60] },
                  then: { $toString: { $divide: ["$_id", 60] } },
                },
              ],
              default: { $toString: "$_id" },
            },
          },
          checkedQty: "$cumulativeChecked",
          defectQty: "$cumulativeDefects",
          defectRate: {
            $round: [
              {
                $multiply: [
                  {
                    $divide: [
                      "$cumulativeDefects",
                      { $max: ["$cumulativeChecked", 1] },
                    ],
                  },
                  100,
                ],
              },
              2,
            ],
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const dashboardData = stats[0] || {
      totalCheckedQty: 0,
      totalDefectQty: 0,
      totalDefectPieces: 0,
      totalReturnDefectQty: 0,
      totalGoodOutput: 0,
      latestHeaderData: {},
    };

    const totalInspected = dashboardData.totalCheckedQty || 0;

    res.json({
      filters: filterValues[0] || {
        factories: [],
        lineNos: [],
        moNos: [],
        customers: [],
      },
      headerInfo: dashboardData.latestHeaderData,
      stats: {
        checkedQty: dashboardData.totalCheckedQty || 0,
        defectQty: dashboardData.totalDefectQty || 0,
        defectPieces: dashboardData.totalDefectPieces || 0,
        returnDefectQty: dashboardData.totalReturnDefectQty || 0,
        goodOutput: dashboardData.totalGoodOutput || 0,
        defectRate: totalInspected
          ? ((dashboardData.totalDefectQty / totalInspected) * 100).toFixed(2)
          : 0,
        defectRatio: totalInspected
          ? ((dashboardData.totalDefectPieces / totalInspected) * 100).toFixed(
              2
            )
          : 0,
      },
      defectRateByLine,
      defectRateByMO,
      defectRateByCustomer,
      topDefects,
      timeSeriesData,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
});

app.post("/api/save-qc-data", async (req, res) => {
  try {
    // Sanitize defectDetails
    const sanitizedDefects = (req.body.defectDetails || []).map((defect) => ({
      name: defect.name.toString().trim(),
      count: Math.abs(parseInt(defect.count)) || 0,
    }));
    const sanitizedData = {
      ...req.body,
      defectArray: sanitizedDefects,
      headerData: {
        ...req.body.headerData,
        date: req.body.headerData.date
          ? new Date(req.body.headerData.date).toISOString()
          : undefined,
      },
    };

    const qcData = new QCData(sanitizedData);
    const savedData = await qcData.save();

    res.status(201).json({
      message: "QC data saved successfully",
      data: savedData,
    });
  } catch (error) {
    console.error("Error saving QC data:", error);
    res.status(500).json({
      message: "Failed to save QC data",
      error: error.message,
      details: error.errors
        ? Object.keys(error.errors).map((key) => ({
            field: key,
            message: error.errors[key].message,
          }))
        : undefined,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

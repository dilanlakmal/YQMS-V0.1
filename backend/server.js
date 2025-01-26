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
    selectedMono: String,
    buyer: String,
    orderQty: Number,
    factoryname: String,
    custStyle: String,
    country: String,
    color: String,
    size: String,
  },
  {
    collection: "qc1_data",
  }
);

const QCData = mongoose.model("qc1_data", qcDataSchema);

// Schema for qc2_orderdata collection
const qc2OrderDataSchema = new mongoose.Schema(
  {
    bundle_id: { type: String, required: true },
    date: { type: String, required: true },
    selectedMono: { type: String, required: true },
    custStyle: { type: String, required: true },
    buyer: { type: String, required: true },
    country: { type: String, required: true },
    orderQty: { type: Number, required: true },
    factory: { type: String, required: true },
    lineNo: { type: String, required: true },
    color: { type: String, required: true },
    size: { type: String, required: true },
    count: { type: String, required: true },
    totalBundleQty: { type: Number, required: true },
  },
  { collection: "qc2_orderdata" }
);

const QC2OrderData = mongoose.model("qc2_orderdata", qc2OrderDataSchema);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Save bundle data to MongoDB
app.post("/api/save-bundle-data", async (req, res) => {
  try {
    const { bundleData } = req.body;

    // Save each bundle record
    const savedRecords = await QC2OrderData.insertMany(bundleData);

    res.status(201).json({
      message: "Bundle data saved successfully",
      data: savedRecords,
    });
  } catch (error) {
    console.error("Error saving bundle data:", error);
    res.status(500).json({
      message: "Failed to save bundle data",
      error: error.message,
    });
  }
});

// Check if bundle_id already exists and get the largest number
app.post("/api/check-bundle-id", async (req, res) => {
  try {
    const { date, lineNo, selectedMono, color, size } = req.body;

    // Find all bundle IDs matching the criteria
    const existingBundles = await QC2OrderData.find({
      bundle_id: {
        $regex: `^${date}:${lineNo}:${selectedMono}:${color}:${size}`,
      },
    });

    // Extract the largest number from the bundle IDs
    let largestNumber = 0;
    existingBundles.forEach((bundle) => {
      const parts = bundle.bundle_id.split(":");
      const number = parseInt(parts[parts.length - 1]);
      if (number > largestNumber) {
        largestNumber = number;
      }
    });

    res.status(200).json({ largestNumber });
  } catch (error) {
    console.error("Error checking bundle ID:", error);
    res.status(500).json({
      message: "Failed to check bundle ID",
      error: error.message,
    });
  }
});

// Update the MONo search endpoint to handle complex pattern matching
app.get("/api/search-mono", async (req, res) => {
  try {
    const digits = req.query.digits;
    const collection = mongoose.connection.db.collection("dt_orders");

    // More robust regex pattern to match last 3 digits before any non-digit characters
    const regexPattern = new RegExp(
      `(\\d{3})(?=\\D*$)|(\\d{3}$)|(?<=\\D)(\\d{3})(?=\\D)`,
      "i"
    );

    const results = await collection
      .aggregate([
        {
          $addFields: {
            matchParts: {
              $regexFind: {
                input: "$Order_No",
                regex: regexPattern,
              },
            },
          },
        },
        {
          $match: {
            $or: [
              { "matchParts.match": { $regex: new RegExp(`${digits}$`, "i") } },
              { "matchParts.match": { $regex: new RegExp(`^${digits}`, "i") } },
            ],
          },
        },
        {
          $project: {
            Order_No: 1,
            numericMatch: {
              $substr: [
                { $ifNull: ["$matchParts.match", ""] },
                { $subtract: [{ $strLenCP: "$matchParts.match" }, 3] },
                3,
              ],
            },
          },
        },
        {
          $match: {
            numericMatch: digits,
          },
        },
        {
          $group: {
            _id: "$Order_No",
            count: { $sum: 1 },
          },
        },
        {
          $limit: 100,
        },
      ])
      .toArray();

    res.json(results.map((r) => r._id));
  } catch (error) {
    console.error("Error searching MONo:", error);
    res.status(500).json({ error: "Failed to search MONo" });
  }
});

// Updated order details endpoint
app.get("/api/order-details/:mono", async (req, res) => {
  try {
    const collection = mongoose.connection.db.collection("dt_orders");
    const order = await collection.findOne({
      Order_No: req.params.mono,
    });

    if (!order) return res.status(404).json({ error: "Order not found" });

    // Process colors with sizes
    const colorMap = new Map();
    order.OrderColors.forEach((colorObj) => {
      const colorKey = colorObj.Color.toLowerCase().trim();
      const originalColor = colorObj.Color.trim();

      if (!colorMap.has(colorKey)) {
        colorMap.set(colorKey, {
          originalColor,
          sizes: new Set(),
        });
      }

      // Process sizes for this color
      colorObj.OrderQty.forEach((sizeEntry) => {
        // Get the size name (first key in the object)
        const sizeName = Object.keys(sizeEntry)[0];
        const quantity = sizeEntry[sizeName];

        if (quantity > 0) {
          const cleanSize = sizeName.split(";")[0].trim();
          colorMap.get(colorKey).sizes.add(cleanSize);
        }
      });
    });

    const response = {
      engName: order.EngName,
      totalQty: order.TotalQty,
      // Add new fields here
      factoryname: order.Factory || "", // New field
      custStyle: order.CustStyle || "", // New field
      country: order.Country || "", // New field
      colors: Array.from(colorMap.values()).map((c) => c.originalColor),
      colorSizeMap: Array.from(colorMap.values()).reduce((acc, curr) => {
        acc[curr.originalColor.toLowerCase()] = Array.from(curr.sizes);
        return acc;
      }, {}),
    };

    res.json(response);
  } catch (error) {
    // console.error("Error fetching order details:", error);
    res.status(500).json({ error: "Failed to fetch order details" });
  }
});

// Updated order sizes endpoint
app.get("/api/order-sizes/:mono/:color", async (req, res) => {
  try {
    const collection = mongoose.connection.db.collection("dt_orders");
    const order = await collection.findOne({
      Order_No: req.params.mono,
    });

    if (!order) return res.status(404).json({ error: "Order not found" });

    // Find the matching color object (case-insensitive)
    const colorObj = order.OrderColors.find(
      (c) => c.Color.toLowerCase() === req.params.color.toLowerCase().trim()
    );

    if (!colorObj) return res.json([]);

    // Extract sizes with quantity > 0
    const sizes = colorObj.OrderQty.map((entry) => {
      const sizeName = Object.keys(entry)[0];
      return entry[sizeName] > 0 ? sizeName.split(";")[0].trim() : null;
    })
      .filter((size) => size !== null)
      .filter((size, index, self) => self.indexOf(size) === index); // Remove duplicates

    res.json(sizes);
  } catch (error) {
    console.error("Error fetching sizes:", error);
    res.status(500).json({ error: "Failed to fetch sizes" });
  }
});

async function fetchOrderDetails(mono) {
  const collection = mongoose.connection.db.collection("dt_orders");
  const order = await collection.findOne({ Order_No: mono });

  const colorMap = new Map();
  order.OrderColors.forEach((c) => {
    const key = c.Color.toLowerCase().trim();
    if (!colorMap.has(key)) {
      colorMap.set(key, {
        originalColor: c.Color.trim(),
        sizes: new Map(),
      });
    }

    c.OrderQty.forEach((q) => {
      if (q.Quantity > 0) {
        const sizeParts = q.Size.split(";");
        const cleanSize = sizeParts[0].trim();
        const sizeKey = cleanSize.toLowerCase();
        if (!colorMap.get(key).sizes.has(sizeKey)) {
          colorMap.get(key).sizes.set(sizeKey, cleanSize);
        }
      }
    });
  });

  return {
    engName: order.EngName,
    totalQty: order.TotalQty,
    colors: Array.from(colorMap.values()).map((c) => c.originalColor),
    colorSizeMap: Array.from(colorMap.values()).reduce((acc, curr) => {
      acc[curr.originalColor.toLowerCase()] = Array.from(curr.sizes.values());
      return acc;
    }, {}),
  };
}

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

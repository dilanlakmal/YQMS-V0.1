import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";

const app = express();
const PORT = 5001;

//app.use(cors());
app.use(bodyParser.json());
app.use(
  cors({
    origin: "*", //["http://localhost:3001", "https://localhost:3001"], // Allow both HTTP and HTTPS, // Update with your frontend URL
    methods: ["GET", "POST", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

const mongoURI = "mongodb://localhost:27017/ym_prod";
mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected to ym_prod database"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Add this function in server.js (before routes)
const generateRandomId = async () => {
  let randomId;
  let isUnique = false;

  while (!isUnique) {
    randomId = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const existing = await QC2OrderData.findOne({ bundle_random_id: randomId });
    if (!existing) isUnique = true;
  }

  return randomId;
};

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
    bundle_random_id: { type: String, required: true, unique: true },
    bundle_id: { type: String, required: true },
    task_no: { type: Number, default: 52 },
    date: { type: String, required: true },
    department: { type: String, required: true },
    selectedMono: { type: String, required: true },
    custStyle: { type: String, required: true },
    buyer: { type: String, required: true },
    country: { type: String, required: true },
    orderQty: { type: Number, required: true },
    factory: { type: String, required: true },
    lineNo: { type: String, required: true },
    color: { type: String, required: true },
    size: { type: String, required: true },
    colorCode: { type: String, required: true },
    chnColor: { type: String, required: true },
    colorKey: { type: Number, required: true },
    sizeOrderQty: { type: Number, required: true },
    planCutQty: { type: Number, required: true },
    count: { type: Number, required: true },
    bundleQty: { type: Number, required: true },
    totalBundleQty: { type: Number, required: true },
    sub_con: { type: String, default: "No" }, // New field
    sub_con_factory: { type: String, default: "N/A" }, // New field
    updated_date_seperator: { type: String, required: true },
    updated_time_seperator: { type: String, required: true },
  },
  { collection: "qc2_orderdata" }
);

const QC2OrderData = mongoose.model("qc2_orderdata", qc2OrderDataSchema);

// Ironing Schema
const ironingSchema = new mongoose.Schema(
  {
    ironing_record_id: Number,
    task_no: { type: Number, default: 53 },
    ironing_bundle_id: { type: String, required: true, unique: true },
    ironing_updated_date: String,
    ironing_update_time: String,
    bundle_id: String,
    selectedMono: String,
    custStyle: String,
    buyer: String,
    country: String,
    factory: String,
    lineNo: String,
    color: String,
    size: String,
    count: String,
    totalBundleQty: Number,
  },
  { collection: "ironing" }
);

const Ironing = mongoose.model("Ironing", ironingSchema);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Save bundle data to MongoDB
app.post("/api/save-bundle-data", async (req, res) => {
  try {
    const { bundleData } = req.body;
    const savedRecords = [];

    // Save each bundle record
    for (const bundle of bundleData) {
      const randomId = await generateRandomId();

      const now = new Date();

      // Format timestamps
      const updated_date_seperator = now.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      });

      const updated_time_seperator = now.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const newBundle = new QC2OrderData({
        ...bundle,
        bundle_random_id: randomId,
        factory: bundle.factory || "N/A", // Handle null factory
        custStyle: bundle.custStyle || "N/A", // Handle null custStyle
        country: bundle.country || "N/A", // Handle null country
        department: bundle.department,
        sub_con: bundle.sub_con || "No",
        sub_con_factory:
          bundle.sub_con === "Yes" ? bundle.sub_con_factory || "" : "N/A",
        updated_date_seperator,
        updated_time_seperator,
      });
      await newBundle.save();
      savedRecords.push(newBundle);
    }
    // const savedRecords = await QC2OrderData.insertMany(bundleData);

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

// New Endpoint to Get Bundle by Random ID
app.get("/api/bundle-by-random-id/:randomId", async (req, res) => {
  try {
    const bundle = await QC2OrderData.findOne({
      bundle_random_id: req.params.randomId,
    });

    if (!bundle) {
      return res.status(404).json({ error: "Bundle not found" });
    }

    res.json(bundle);
  } catch (error) {
    console.error("Error fetching bundle:", error);
    res.status(500).json({ error: "Failed to fetch bundle" });
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

// Update /api/order-details endpoint
app.get("/api/order-details/:mono", async (req, res) => {
  try {
    const collection = mongoose.connection.db.collection("dt_orders");
    const order = await collection.findOne({
      Order_No: req.params.mono,
    });

    if (!order) return res.status(404).json({ error: "Order not found" });

    const colorMap = new Map();
    order.OrderColors.forEach((colorObj) => {
      const colorKey = colorObj.Color.toLowerCase().trim();
      const originalColor = colorObj.Color.trim();

      if (!colorMap.has(colorKey)) {
        colorMap.set(colorKey, {
          originalColor,
          colorCode: colorObj.ColorCode,
          chnColor: colorObj.ChnColor,
          colorKey: colorObj.ColorKey,
          sizes: new Map(),
        });
      }

      colorObj.OrderQty.forEach((sizeEntry) => {
        const sizeName = Object.keys(sizeEntry)[0];
        const quantity = sizeEntry[sizeName];
        const cleanSize = sizeName.split(";")[0].trim();

        if (quantity > 0) {
          colorMap.get(colorKey).sizes.set(cleanSize, {
            orderQty: quantity,
            planCutQty: colorObj.CutQty?.[sizeName]?.PlanCutQty || 0,
          });
        }
      });
    });

    const response = {
      engName: order.EngName,
      totalQty: order.TotalQty,
      factoryname: order.Factory || "N/A",
      custStyle: order.CustStyle || "N/A",
      country: order.Country || "N/A",
      colors: Array.from(colorMap.values()).map((c) => ({
        original: c.originalColor,
        code: c.colorCode,
        chn: c.chnColor,
        key: c.colorKey,
      })),
      colorSizeMap: Array.from(colorMap.values()).reduce((acc, curr) => {
        acc[curr.originalColor.toLowerCase()] = {
          sizes: Array.from(curr.sizes.keys()),
          details: Array.from(curr.sizes.entries()).map(([size, data]) => ({
            size,
            orderQty: data.orderQty,
            planCutQty: data.planCutQty,
          })),
        };
        return acc;
      }, {}),
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch order details" });
  }
});

// Update /api/order-sizes endpoint
app.get("/api/order-sizes/:mono/:color", async (req, res) => {
  try {
    const collection = mongoose.connection.db.collection("dt_orders");
    const order = await collection.findOne({ Order_No: req.params.mono });

    if (!order) return res.status(404).json({ error: "Order not found" });

    const colorObj = order.OrderColors.find(
      (c) => c.Color.toLowerCase() === req.params.color.toLowerCase().trim()
    );

    if (!colorObj) return res.json([]);

    const sizesWithDetails = colorObj.OrderQty.filter(
      (entry) => entry[Object.keys(entry)[0]] > 0
    )
      .map((entry) => {
        const sizeName = Object.keys(entry)[0];
        const cleanSize = sizeName.split(";")[0].trim();
        return {
          size: cleanSize,
          orderQty: entry[sizeName],
          planCutQty: colorObj.CutQty?.[sizeName]?.PlanCutQty || 0,
        };
      })
      .filter((v, i, a) => a.findIndex((t) => t.size === v.size) === i);

    res.json(sizesWithDetails);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sizes" });
  }
});

// Bundle Qty Endpoint
app.get("/api/total-bundle-qty/:mono", async (req, res) => {
  try {
    const mono = req.params.mono;
    const total = await QC2OrderData.aggregate([
      { $match: { selectedMono: mono } }, // Match documents with the given MONo
      {
        $group: {
          _id: null, // Group all matched documents
          total: { $sum: "$totalBundleQty" }, // Correct sum using field reference with $
        },
      },
    ]);
    res.json({ total: total[0]?.total || 0 }); // Return the summed total or 0 if no documents
  } catch (error) {
    console.error("Error fetching total bundle quantity:", error);
    res.status(500).json({ error: "Failed to fetch total bundle quantity" });
  }
});

// Endpoint to get total garments count for a specific MONo, Color, and Size
app.get("/api/total-garments-count/:mono/:color/:size", async (req, res) => {
  try {
    const { mono, color, size } = req.params;

    const totalCount = await QC2OrderData.aggregate([
      { $match: { selectedMono: mono, color: color, size: size } },
      {
        $group: {
          _id: null,
          totalCount: { $sum: "$count" }, // Sum the count field
        },
      },
    ]);

    res.json({ totalCount: totalCount[0]?.totalCount || 0 }); // Return total count or 0
  } catch (error) {
    console.error("Error fetching total garments count:", error);
    res.status(500).json({ error: "Failed to fetch total garments count" });
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

// Check if ironing record exists
app.get("/api/check-ironing-exists/:bundleId", async (req, res) => {
  try {
    const record = await Ironing.findOne({
      ironing_bundle_id: req.params.bundleId,
    });
    res.json({ exists: !!record });
  } catch (error) {
    res.status(500).json({ error: "Error checking record" });
  }
});

// Save ironing record
app.post("/api/save-ironing", async (req, res) => {
  try {
    const newRecord = new Ironing(req.body);
    await newRecord.save();
    res.status(201).json({ message: "Record saved successfully" });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: "Duplicate record found" });
    } else {
      res.status(500).json({ error: "Failed to save record" });
    }
  }
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

// Helper function to format date to MM/DD/YYYY
const formatDate = (date) => {
  const d = new Date(date);
  return `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d
    .getDate()
    .toString()
    .padStart(2, "0")}/${d.getFullYear()}`;
};

// New endpoint to get unique values for filters
app.get("/api/unique-values", async (req, res) => {
  try {
    const uniqueValues = await QC2OrderData.aggregate([
      {
        $group: {
          _id: null,
          moNos: { $addToSet: "$selectedMono" },
          styleNos: { $addToSet: "$custStyle" },
          lineNos: { $addToSet: "$lineNo" },
          colors: { $addToSet: "$color" },
          sizes: { $addToSet: "$size" },
          buyers: { $addToSet: "$buyer" },
        },
      },
    ]);

    const result = uniqueValues[0] || {
      moNos: [],
      styleNos: [],
      lineNos: [],
      colors: [],
      sizes: [],
      buyers: [],
    };

    delete result._id;
    Object.keys(result).forEach((key) => {
      result[key] = result[key].filter(Boolean).sort();
    });

    res.json(result);
  } catch (error) {
    console.error("Error fetching unique values:", error);
    res.status(500).json({ error: "Failed to fetch unique values" });
  }
});

// Updated endpoint to get filtered data
app.get("/api/download-data", async (req, res) => {
  try {
    let {
      startDate,
      endDate,
      type,
      taskNo,
      moNo,
      styleNo,
      lineNo,
      color,
      size,
      buyer,
      page = 1,
      limit = 50,
    } = req.query;

    // Convert page and limit to numbers
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    // Format dates to match the stored format (MM/DD/YYYY)
    if (startDate) {
      startDate = formatDate(new Date(startDate));
    }
    if (endDate) {
      endDate = formatDate(new Date(endDate));
    }

    // Build match query
    const matchQuery = {};

    // Determine collection and date field based on type/taskNo
    const isIroning = type === "Ironing" || taskNo === "53";
    const collection = isIroning ? Ironing : QC2OrderData;
    const dateField = isIroning
      ? "ironing_updated_date"
      : "updated_date_seperator";

    // Date range filter
    if (startDate || endDate) {
      matchQuery[dateField] = {};
      if (startDate) matchQuery[dateField].$gte = startDate;
      if (endDate) matchQuery[dateField].$lte = endDate;
    }

    // Add other filters if they exist
    if (moNo) matchQuery.selectedMono = moNo;
    if (styleNo) matchQuery.custStyle = styleNo;
    if (lineNo) matchQuery.lineNo = lineNo;
    if (color) matchQuery.color = color;
    if (size) matchQuery.size = size;
    if (buyer) matchQuery.buyer = buyer;

    // Add task number filter
    if (taskNo) {
      matchQuery.task_no = parseInt(taskNo);
    }

    console.log("Match Query:", matchQuery); // For debugging

    // Get total count
    const total = await collection.countDocuments(matchQuery);

    // Get paginated data
    const data = await collection
      .find(matchQuery)
      .sort({ [dateField]: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    console.log("Found records:", data.length); // For debugging

    // Transform data for consistent response
    const transformedData = data.map((item) => ({
      date: item[dateField],
      type: isIroning ? "Ironing" : "QC2 Order Data",
      taskNo: isIroning ? "53" : "52",
      selectedMono: item.selectedMono,
      custStyle: item.custStyle,
      lineNo: item.lineNo,
      color: item.color,
      size: item.size,
      buyer: item.buyer,
      bundle_id: isIroning ? item.ironing_bundle_id : item.bundle_id,
    }));

    res.json({
      data: transformedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching download data:", error);
    res.status(500).json({ error: "Failed to fetch download data" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
const mongoURI = "mongodb://localhost:27017/ym_prod";
mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected to ym_prod database"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Define a Schema for QC Data
const qcDataSchema = new mongoose.Schema(
  {
    headerData: {
      type: Object,
      required: true,
      transform: function (doc, ret) {
        // Convert Date objects to ISO strings
        for (let key in ret) {
          if (ret[key] instanceof Date) {
            ret[key] = ret[key].toISOString();
          }
        }
        return ret;
      },
    },
    type: { type: String, required: true }, // "pass" or "reject"
    garmentNo: {
      type: Number,
      required: function () {
        // Only required if type is "pass" or "reject"
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
    collection: "qc1_data", // Explicitly set collection name
  }
);
// Create a model for the "qc1_data" collection
const QCData = mongoose.model("qc1_data", qcDataSchema);

// API Endpoint to Save QC Data
app.post("/api/save-qc-data", async (req, res) => {
  try {
    // Sanitize and prepare the data
    const sanitizedData = {
      ...req.body,
      headerData: {
        ...req.body.headerData,
        // Ensure date is properly formatted if it exists
        date: req.body.headerData.date
          ? new Date(req.body.headerData.date).toISOString()
          : undefined,
      },
    };

    // console.log("Sanitized QC Data:", sanitizedData);

    const qcData = new QCData(sanitizedData);
    const savedData = await qcData.save();

    // console.log("Data saved successfully:", savedData);
    res.status(201).json({
      message: "QC data saved successfully",
      data: savedData,
    });
  } catch (error) {
    console.error("Error saving QC data:", error);
    // Send more detailed error information
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

// Start the Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

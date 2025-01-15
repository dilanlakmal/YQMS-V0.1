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
const qcDataSchema = new mongoose.Schema({
  type: String, // "pass" or "reject"
  garmentNo: Number,
  status: String,
  timestamp: Number,
  formattedTimestamp: String, // Store formatted HH:MM:SS
  actualtime: Number,
  formattedActualTime: String, // Store formatted HH:MM:SS
  defectDetails: Array,
  checkedQty: Number, // New field
  goodOutput: Number, // New field
  defectQty: Number, // New field
  defectPieces: Number, // New field
  defectArray: Array, // New field
  cumulativeChecked: Number,
  cumulativeDefects: Number,
  cumulativeGoodOutput: Number, // Cumulative good output
  cumulativeDefectPieces: Number, // Cumulative defect pieces
  returnDefectList: Array, // Changed from Number to Array
  returnDefectArray: Array, // Changed from Number to Array
  returnDefectQty: Number,
  cumulativeReturnDefectQty: Number,
});
// Create a model for the "qc1_data" collection
const QCData = mongoose.model("qc1_data", qcDataSchema);

// API Endpoint to Save QC Data
app.post("/api/save-qc-data", async (req, res) => {
  try {
    const qcData = new QCData(req.body);
    await qcData.save();
    res.status(201).json({ message: "QC data saved successfully" });
  } catch (error) {
    console.error("Error saving QC data:", error);
    res.status(500).json({ message: "Failed to save QC data" });
  }
});

// Start the Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

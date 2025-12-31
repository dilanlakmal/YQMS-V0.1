import mongoose from "mongoose";

const reportWashingSchema = new mongoose.Schema(
  {
    ymStyle: { type: String, required: true },
    buyerStyle: { type: String, default: "" },
    color: { type: [String], default: [] }, // Array of selected colors
    po: { type: [String], default: [] }, // Array of selected POs
    exFtyDate: { type: [String], default: [] }, // Array of selected ETD dates
    factory: { type: String, default: "" },
    reportDate: { type: Date, default: null }, // Will be set when user scans QR code
    sendToHomeWashingDate: { type: Date, default: Date.now },
    images: { type: [String], default: [] }, // Array of base64 image strings
    notes: { type: String, default: "" }, // Notes added during initial form submission
    userId: { type: String, default: "" },
    userName: { type: String, default: "" },
    submittedAt: { type: Date, default: Date.now },
    // QR Scan Status Fields
    status: { type: String, default: "pending", enum: ["pending", "received", "completed"] },
    receivedDate: { type: String, default: null }, // Date string when first scanned
    receivedAt: { type: Date, default: null }, // Full timestamp when first scanned
    receivedNotes: { type: String, default: "" }, // Notes added during received status
    receivedImages: { type: [String], default: [] }, // Images added during received status
    completedDate: { type: String, default: null }, // Date string when completed
    completedAt: { type: Date, default: null }, // Full timestamp when completed
    completionNotes: { type: String, default: "" }, // Notes added during completion
    completionImages: { type: [String], default: [] } // Images added during completion
  },
  {
    timestamps: true,
    collection: "report_washing"
  }
);

// Index for faster queries
reportWashingSchema.index({ ymStyle: 1, reportDate: -1 });
reportWashingSchema.index({ factory: 1, reportDate: -1 });

export default function createReportWashingModel(connection) {
  return connection.model("ReportWashing", reportWashingSchema);
}


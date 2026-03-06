import mongoose from "mongoose";

const reportWashingSchema = new mongoose.Schema(
  {
    ymStyle: { type: String, required: true },
    buyerStyle: { type: String, default: "" },
    color: { type: [String], default: [] }, // Array of selected colors
    po: { type: [String], default: [] }, // Array of selected POs
    exFtyDate: { type: [String], default: [] }, // Array of selected ETD dates
    reportSampleSizes: { type: [String], default: [] }, // Array of sizes e.g. ["XS", "S"]
    factory: { type: String, default: "" },
    reportDate: { type: Date, default: null }, // Will be set when user scans QR code
    sendToHomeWashingDate: { type: Date, default: Date.now },
    images: { type: [String], default: [] }, // Array of base64 image strings
    notes: { type: String, default: "" }, // Notes added during initial form submission
    reporter_emp_id: { type: String, default: "" }, // Employee ID of user who submitted the report
    reporter_status: { type: String, default: "done" },
    reporter_name: { type: String, default: "" },
    submittedAt: { type: Date, default: Date.now },

    // Explicit Schema Definitions for Complex Fields
    careSymbols: { type: Object, default: {} }, // Filename map { "machineWash": "icon.png" }
    careSymbolsImages: { type: Object, default: {} }, // Base64 map { "machineWash": "data:image..." }

    colorFastnessRows: { type: Array, default: [] },
    colorStainingRows: { type: Array, default: [] },
    shrinkageRows: { type: Array, default: [] },
    visualAssessmentRows: { type: Array, default: [] },
    // QR Scan Status Fields

    receivedDate: { type: String, default: null }, // Date string when first scanned
    receivedAt: { type: Date, default: null }, // Full timestamp when first scanned
    receiver_emp_id: { type: String, default: null }, // Employee ID of user who scanned/received
    receivedNotes: { type: String, default: "" }, // Notes added during received status
    receivedImages: { type: [String], default: [] }, // Images added during received status
    completedDate: { type: String, default: null }, // Date string when completed
    completedAt: { type: Date, default: null }, // Full timestamp when completed
    completionImages: { type: [String], default: [] }, // Images added during completion
    completionNotes: { type: String, default: "" }, // Notes added during completion
    // Rejected by warehouse (e.g. color mismatch, wrong quantity)
    rejectedAt: { type: Date, default: null },
    rejectedNotes: { type: String, default: "" },
    // Warehouse color-edit notification for submitter (who edited, when, what was removed)
    colorEditedByWarehouseAt: { type: Date, default: null },
    colorEditedByWarehouseBy: { type: String, default: "" },
    colorEditedByWarehouseName: { type: String, default: "" },
    colorUncheckedByWarehouse: { type: [String], default: [] }, // Colors warehouse removed (submitter sent more, warehouse kept fewer)
    // Reporter edit notification (non-warehouse user edited report – different icon from warehouse edit)
    editedByReporterAt: { type: Date, default: null },
    editedByReporterBy: { type: String, default: "" },
    editedByReporterName: { type: String, default: "" },
    // Persistent history of updates (e.g. color edits when status is received) – so notification modal can show full history
    notificationHistory: {
      type: [
        {
          type: { type: String, default: "COLOR_UPDATE" }, // e.g. "COLOR_UPDATE"
          at: { type: Date, required: true },
          userId: { type: String, default: "" },
          userName: { type: String, default: "" },
          previousColorCount: { type: Number, default: 0 },
          newColorCount: { type: Number, default: 0 },
          rejectedColors: { type: [String], default: [] }, // Colors warehouse removed
        }
      ],
      default: []
    },
    // QR ID stored at creation – same value used in QR code scan URL (?scan=qrId)
    qrId: { type: String, default: "" },
  },
  {
    strict: false,
    timestamps: true
  }
);

// Set qrId on save so we don't need a second DB write
reportWashingSchema.pre("save", function (next) {
  if (this.isNew && this._id && !this.qrId) {
    this.qrId = this._id.toString();
  }
  next();
});

// Index for faster queries
reportWashingSchema.index({ ymStyle: 1, reportDate: -1 });
reportWashingSchema.index({ factory: 1, reportDate: -1 });
reportWashingSchema.index({ reportDate: -1, createdAt: -1 });
reportWashingSchema.index({ qrId: 1 });

export default function createReportWashingModel(connection, collectionName = "report_washing") {
  return connection.model("ReportWashing_" + collectionName, reportWashingSchema, collectionName);
}


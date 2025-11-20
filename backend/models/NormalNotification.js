// backend/models/NormalNotification.js
import mongoose from "mongoose";

const normalNotificationSchema = new mongoose.Schema({
  // Enum to help Frontend decide how to render the card (e.g. 'CUTTING_INSPECTION', 'WASHING_ALERT')
  type: { type: String, required: true },

  // Standard header/body for fallback display
  title: { type: String, required: true },
  message: { type: String, required: true },

  // DYNAMIC DATA: This can store MO No, Table No, or totally different fields for other reports
  metadata: { type: mongoose.Schema.Types.Mixed },

  // Who sent it
  sender: {
    emp_id: String,
    name: String,
    photo: String
  },

  // Array of EmpIDs who should see this
  recipients: { type: [String], index: true },

  // Array of EmpIDs who have read this
  readBy: { type: [String], default: [] },

  // Navigation link
  link: { type: String },

  createdAt: { type: Date, default: Date.now, expires: "30d" } // Auto-delete after 30 days to keep DB clean
});

export default (connection) =>
  connection.model("NormalNotification", normalNotificationSchema);

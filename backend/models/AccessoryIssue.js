import mongoose from "mongoose";

const accessoryIssueSchema = new mongoose.Schema(
  {
    no: { type: Number, required: true, unique: true },
    issueEng: { type: String, required: true, unique: true },
    issueKhmer: { type: String, required: true },
    issueChi: { type: String, required: true }
  },
  {
    // Collection name as requested. Consider changing to "accessory_issues"
    collection: "accesory_issues",
    timestamps: true // Automatically adds createdAt and updatedAt
  }
);

export default function createAccessoryIssueModel(connection) {
  return connection.model("AccessoryIssue", accessoryIssueSchema);
}

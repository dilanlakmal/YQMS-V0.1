import mongoose from "mongoose";

const qaDefectsSchema = new mongoose.Schema(
  {
    code: {
      type: Number,
      required: true,
      unique: true
    },
    defectLetter: {
      type: String,
      required: true
    },
    shortEng: {
      type: String,
      required: true
    },
    english: {
      type: String,
      required: true
    },
    khmer: {
      type: String,
      required: true
    },
    chinese: {
      type: String,
      required: true
    },
    isCommon: {
      type: String,
      required: true
    },
    statusByBuyer: {
      type: [
        {
          buyerName: {
            type: String,
            required: true
          },
          // Defines an array where each element must be a string from the enum
          defectStatus: [
            {
              type: String,
              enum: ["Critical", "Major", "Minor"]
            }
          ],
          isCommon: {
            type: String,
            enum: ["Critical", "Major", "Minor"],
            required: true
          }
        }
      ],
      default: []
    }
  },
  {
    // Mongoose options
    collection: "qa_defects",
    // This option automatically adds `createdAt` and `updatedAt` fields
    timestamps: true
  }
);

export default (connection) =>
  connection.model("QADefectsModel", qaDefectsSchema);

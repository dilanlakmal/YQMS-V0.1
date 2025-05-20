import mongoose from "mongoose";

const sewingDefectsSchema = new mongoose.Schema(
  {
    code: { type: Number, required: true, unique: true },
    shortEng: { type: String, required: true },
    english: { type: String, required: true },
    khmer: { type: String, required: true },
    chinese: { type: String, required: true },
    image: { type: String, required: true },
    repair: { type: String, required: true },
    categoryEnglish: { type: String, required: true },
    categoryKhmer: { type: String, required: true },
    categoryChinese: { type: String, required: true },
    type: { type: String, required: true },
    isCommon: { type: String, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
    statusByBuyer: {
      type: [
        {
          buyerName: { type: String, required: true },
          defectStatus: [
            { type: String, enum: ["Critical", "Major", "Minor"] }
          ],
          isCommon: {
            type: String,
            enum: ["Critical", "Minor", "Major"],
            default: "Minor"
          }
        }
      ],
      default: []
    }
  },
  { collection: "SewingDefects", timestamps: true }
);

export default (connection) =>
  connection.model("SewingDefects", sewingDefectsSchema);

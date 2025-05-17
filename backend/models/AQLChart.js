import mongoose from "mongoose";

const aqlChartSchema = new mongoose.Schema(
  {
    Type: {
      type: String,
      enum: ["General", "Special"],
      required: true
    },
    Level: {
      type: String,
      enum: ["I", "II", "III", "S1", "S2", "S3", "S4"],
      required: true
    },
    LotSize: {
      min: {
        type: Number,
        required: true
      },
      max: {
        type: Number,
        default: null
      }
    },
    SampleSizeLetterCode: {
      type: String,
      required: true
    },
    SampleSize: {
      type: Number,
      required: true
    },
    AQL: [
      {
        level: {
          type: Number,
          required: true
        },
        AcceptDefect: {
          type: Number,
          required: true
        },
        RejectDefect: {
          type: Number,
          required: true
        }
      }
    ]
  },
  { collection: "aqlcharts" }
);

export default function createAQLChartModel(connection) {
  return connection.model("AQLChart", aqlChartSchema);
}

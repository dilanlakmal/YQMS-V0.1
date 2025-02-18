import mongoose from 'mongoose';

const qc2ReworksSchema = new mongoose.Schema(
    {
      bundleNo: { type: String, required: true },
      moNo: { type: String, required: true },
      custStyle: { type: String, required: true },
      color: { type: String, required: true },
      size: { type: String, required: true },
      lineNo: { type: String, required: true },
      department: { type: String, required: true },
      reworkGarments: [
        {
          defectName: { type: String, required: true },
          count: { type: Number, required: true },
          time: { type: String, required: true }, // "HH:MM:SS"
        },
      ],
    },
    { collection: "qc2_reworks" }
  );

  export default (connection) => connection.model("qc2_reworks", qc2ReworksSchema);
  
  
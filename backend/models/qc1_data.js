import mongoose from 'mongoose';
const qcDataSchema = new mongoose.Schema(
  {
    headerData: {
      type: Object,
      required: true,
      transform: function (doc, ret) {
        for (let key in ret) {
          if (ret[key] instanceof Date) {
            ret[key] = ret[key].toISOString();
          }
        }
        return ret;
      },
    },
    type: { type: String, required: true },
    garmentNo: {
      type: Number,
      required: function () {
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
);

export default (connection) => connection.model("qc1_data", qcDataSchema);

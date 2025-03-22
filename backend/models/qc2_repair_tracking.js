// // qc2RepairTrackingSchema.js
// import mongoose from "mongoose";

// const qc2RepairTrackingSchema = new mongoose.Schema(
//   {
//     package_no: { type: Number, required: true },
//     moNo: { type: String, required: true },
//     custStyle: { type: String, required: true },
//     color: { type: String, required: true },
//     size: { type: String, required: true },
//     lineNo: { type: String, required: true },
//     department: { type: String, required: true },
//     buyer: { type: String, required: false },
//     factory: { type: String },
//     sub_con: { type: String },
//     sub_con_factory: { type: String },
//     defect_print_id: { type: String, required: true, unique: true },
//     repairArray: [
//       {
//         defectName: { type: String, required: true },
//         defectCount: { type: Number, required: true },
//         repairGroup: { type: String, required: true },
//         status: { type: String, default: "Not Repaired" }, // "Not Repaired" or "OK"
//         repair_date: { type: String }, // "MM/DD/YYYY"
//         repair_time: { type: String } // "HH:MM:SS"
//       }
//     ]
//   },
//   { collection: "qc2_repair_tracking" }
// );

// export default (connection) =>
//   connection.model("qc2_repair_tracking", qc2RepairTrackingSchema);

// qc2RepairTrackingSchema.js
import mongoose from "mongoose";

const qc2RepairTrackingSchema = new mongoose.Schema(
  {
    package_no: { type: Number, required: true },
    moNo: { type: String, required: true },
    custStyle: { type: String, required: true },
    color: { type: String, required: true },
    size: { type: String, required: true },
    lineNo: { type: String, required: true },
    department: { type: String, required: true },
    buyer: { type: String, required: false },
    factory: { type: String },
    sub_con: { type: String },
    sub_con_factory: { type: String },
    defect_print_id: { type: String, required: true, unique: true },
    repairArray: [
      {
        defectName: { type: String, required: true },
        defectCount: { type: Number, required: true },
        repairGroup: { type: String, required: true },
        garmentNumber:{ type: Number, required: true },
        status: { type: String, default: "Fail" }, // "Fail" or "OK"
        repair_date: { type: String }, // "MM/DD/YYYY"
        repair_time: { type: String },// "HH:MM:SS"
        pass_bundle: {
                type: String,
                enum: ["Pass", "Fail", "Not Checked"], // Possible values
                default: "Not Checked",
            },
      }
    ]
  },
  { collection: "qc2_repair_tracking" }
);

export default (connection) =>
  connection.model("qc2_repair_tracking", qc2RepairTrackingSchema);

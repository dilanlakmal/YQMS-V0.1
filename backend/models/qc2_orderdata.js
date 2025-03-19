// import mongoose from "mongoose";

// // Schema for qc2_orderdata collection
// const qc2OrderDataSchema = new mongoose.Schema(
//   {
//     bundle_random_id: { type: String, required: true, unique: true },
//     bundle_id: { type: String, required: true },
//     package_no: Number,
//     task_no_order: { type: Number, default: 52 },
//     date: { type: String, required: true },
//     department: { type: String, required: true },
//     selectedMono: { type: String, required: true },
//     custStyle: { type: String, required: true },
//     buyer: { type: String, required: true },
//     country: { type: String, required: true },
//     orderQty: { type: Number, required: true },
//     factory: { type: String, required: true },
//     lineNo: { type: String, required: true },
//     color: { type: String, required: true },
//     size: { type: String, required: true },
//     colorCode: { type: String, required: true },
//     chnColor: { type: String, required: true },
//     colorKey: { type: Number, required: true },
//     sizeOrderQty: { type: Number, required: true },
//     planCutQty: { type: Number, required: true },
//     count: { type: Number, required: true },
//     bundleQty: { type: Number, required: true },
//     totalBundleQty: { type: Number, required: true },
//     sub_con: { type: String, default: "No" }, // New field
//     sub_con_factory: { type: String, default: "N/A" }, // New field
//     updated_date_seperator: { type: String, required: true },
//     updated_time_seperator: { type: String, required: true },
//     emp_id: { type: String, required: true },
//     eng_name: { type: String, required: true },
//     kh_name: { type: String },
//     job_title: { type: String },
//     dept_name: { type: String, required: true },
//     sect_name: { type: String },
//     emp_id_ironing: { type: String },
//     eng_name_ironing: { type: String },
//     kh_name_ironing: { type: String },
//     job_title_ironing: { type: String },
//     dept_name_ironing: { type: String },
//     sect_name_ironing: { type: String },
//     passQtyIron: { type: Number },
//     ironing_updated_date: { type: String },
//     ironing_update_time: { type: String },
//     emp_id_washing: { type: String },
//     eng_name_washing: { type: String },
//     kh_name_washing: { type: String },
//     job_title_washing: { type: String },
//     dept_name_washing: { type: String },
//     sect_name_washing: { type: String },
//     passQtyWash: { type: Number },
//     washing_updated_date: { type: String },
//     washing_update_time: { type: String },
//     emp_id_opa: { type: String },
//     eng_name_opa: { type: String },
//     kh_name_opa: { type: String },
//     job_title_opa: { type: String },
//     dept_name_opa: { type: String },
//     sect_name_opa: { type: String },
//     passQtyOPA: { type: Number },
//     opa_updated_date: { type: String },
//     opa_update_time: { type: String },
//     emp_id_packing: { type: String },
//     eng_name_packing: { type: String },
//     kh_name_packing: { type: String },
//     job_title_packing: { type: String },
//     dept_name_packing: { type: String },
//     sect_name_packing: { type: String },
//     passQtyPack: { type: Number },
//     packing_updated_date: { type: String },
//     packing_update_time: { type: String }
//   },
//   { collection: "qc2_orderdata" }
// );

// export default (connection) =>
//   connection.model("qc2_orderdata", qc2OrderDataSchema);

// import mongoose from "mongoose";

// const qc2OrderDataSchema = new mongoose.Schema(
//   {
//     bundle_random_id: { type: String, required: true, unique: true },
//     bundle_id: { type: String, required: true },
//     package_no: Number,
//     task_no_order: { type: Number, default: 52 },
//     date: { type: String, required: true },
//     department: { type: String, required: true },
//     selectedMono: { type: String, required: true },
//     custStyle: { type: String, required: true },
//     buyer: { type: String, required: true },
//     country: { type: String, required: true },
//     orderQty: { type: Number, required: true },
//     factory: { type: String, required: true },
//     lineNo: { type: String, required: true },
//     color: { type: String, required: true },
//     size: { type: String, required: true },
//     colorCode: { type: String, required: true },
//     chnColor: { type: String, required: true },
//     colorKey: { type: Number, required: true },
//     sizeOrderQty: { type: Number, required: true },
//     planCutQty: { type: Number, required: true },
//     count: { type: Number, required: true },
//     bundleQty: { type: Number, required: true },
//     totalBundleQty: { type: Number, required: true },
//     sub_con: { type: String, default: "No" },
//     sub_con_factory: { type: String, default: "N/A" },
//     updated_date_seperator: { type: String, required: true },
//     updated_time_seperator: { type: String, required: true },
//     emp_id: { type: String, required: true },
//     eng_name: { type: String, required: true },
//     kh_name: { type: String },
//     job_title: { type: String },
//     dept_name: { type: String, required: true },
//     sect_name: { type: String },
//     inspectionFirst: [
//       {
//         process: {
//           type: String,
//           enum: ["washing", "opa", "ironing", "packing"],
//           required: true
//         },
//         task_no: { type: Number, required: true },
//         passQty: Number,
//         updated_date: String,
//         update_time: String,
//         emp_id: String,
//         eng_name: String,
//         kh_name: String,
//         job_title: String,
//         dept_name: String,
//         sect_name: String,
//         packing_record_id: { type: Number, default: null } // Only for packing
//       }
//     ],
//     inspectionDefect: [
//       {
//         defect_print_id: { type: String, required: true }, // Unique identifier for defect scans
//         process: {
//           type: String,
//           enum: ["washing", "opa", "ironing", "packing"],
//           required: true
//         },
//         task_no: { type: Number, required: true },
//         passQty: Number,
//         updated_date: String,
//         update_time: String,
//         emp_id: String,
//         eng_name: String,
//         kh_name: String,
//         job_title: String,
//         dept_name: String,
//         sect_name: String,
//         packing_record_id: { type: Number, default: null } // Only for packing
//       }
//     ]
//   },
//   { collection: "qc2_orderdata" }
// );

// export default (connection) =>
//   connection.model("qc2_orderdata", qc2OrderDataSchema);

import mongoose from "mongoose";

const qc2OrderDataSchema = new mongoose.Schema(
  {
    bundle_random_id: { type: String, required: true, unique: true },
    bundle_id: { type: String, required: true },
    package_no: Number,
    task_no_order: { type: Number, default: 52 },
    date: { type: String, required: true },
    department: { type: String, required: true },
    selectedMono: { type: String, required: true },
    custStyle: { type: String, required: true },
    buyer: { type: String, required: true },
    country: { type: String, required: true },
    orderQty: { type: Number, required: true },
    factory: { type: String, required: true },
    lineNo: { type: String, required: true },
    color: { type: String, required: true },
    size: { type: String, required: true },
    colorCode: { type: String, required: true },
    chnColor: { type: String, required: true },
    colorKey: { type: Number, required: true },
    sizeOrderQty: { type: Number, required: true },
    planCutQty: { type: Number, required: true },
    count: { type: Number, required: true },
    bundleQty: { type: Number, required: true },
    totalBundleQty: { type: Number, required: true },
    sub_con: { type: String, default: "No" },
    sub_con_factory: { type: String, default: "N/A" },
    updated_date_seperator: { type: String, required: true },
    updated_time_seperator: { type: String, required: true },
    emp_id: { type: String, required: true },
    eng_name: { type: String, required: true },
    kh_name: { type: String },
    job_title: { type: String },
    dept_name: { type: String, required: true },
    sect_name: { type: String },
    inspectionFirst: [
      {
        process: {
          type: String,
          enum: ["washing", "opa", "ironing", "packing"],
          required: true
        },
        task_no: { type: Number, required: true },
        passQty: Number,
        updated_date: String,
        update_time: String,
        emp_id: String,
        eng_name: String,
        kh_name: String,
        job_title: String,
        dept_name: String,
        sect_name: String,
        packing_record_id: { type: Number, default: null }
      }
    ],
    inspectionDefect: [
      {
        defect_print_id: { type: String, required: true },
        process: {
          type: String,
          enum: ["washing", "opa", "ironing", "packing"],
          required: true
        },
        task_no: { type: Number, required: true },
        passQty: Number,
        updated_date: String,
        update_time: String,
        emp_id: String,
        eng_name: String,
        kh_name: String,
        job_title: String,
        dept_name: String,
        sect_name: String,
        packing_record_id: { type: Number, default: null }
      }
    ],
    qc2InspectionFirst: [
      {
        process: { type: String, default: "qc2" },
        task_no: { type: Number, default: 100 },
        inspectionRecordId: { type: String }, // Add this field
        checkedQty: { type: Number },
        totalPass: { type: Number },
        totalRejects: { type: Number },
        defectQty: { type: Number },
        defectArray: [
          {
            defectName: { type: String, required: true },
            totalCount: { type: Number, required: true }
          }
        ],
        rejectGarments: [
          {
            totalCount: { type: Number, required: true },
            defects: [
              {
                name: { type: String, required: true },
                count: { type: Number, required: true },
                repair: { type: String, required: true },
                status: { type: String, default: "Fail" }
              }
            ],
            garment_defect_id: { type: String, required: true },
            rejectTime: { type: String, required: true }
          }
        ],
        updated_date: { type: String },
        update_time: { type: String },
        emp_id: { type: String },
        eng_name: { type: String },
        kh_name: { type: String },
        job_title: { type: String },
        dept_name: { type: String },
        sect_name: { type: String }
      }
    ],
    qc2InspectionDefect: [
      {
        process: { type: String, default: "qc2" },
        task_no: { type: Number, default: 101 },
        defect_print_id: { type: String },
        inspectionNo: { type: Number },
        checkedQty: { type: Number },
        totalPass: { type: Number },
        totalRejects: { type: Number },
        defectQty: { type: Number },
        rejectGarments: [
          {
            totalCount: { type: Number, required: true },
            defects: [
              {
                name: { type: String, required: true },
                count: { type: Number, required: true },
                repair: { type: String, required: true },
                status: { type: String, default: "Fail" }
              }
            ],
            garment_defect_id: { type: String, required: true },
            rejectTime: { type: String, required: true }
          }
        ],
        updated_date: { type: String },
        update_time: { type: String },
        emp_id: { type: String },
        eng_name: { type: String },
        kh_name: { type: String },
        job_title: { type: String },
        dept_name: { type: String },
        sect_name: { type: String }
      }
    ]
  },
  { collection: "qc2_orderdata" }
);

export default (connection) =>
  connection.model("qc2_orderdata", qc2OrderDataSchema);

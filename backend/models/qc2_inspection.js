// Schema for qc2_inspection_pass_bundle with header fields as separate fields
import mongoose from "mongoose";

const qc2InspectionPassBundleSchema = new mongoose.Schema(
  {
    //bundleNo: { type: String, required: true }, // extracted from bundleData.bundle_id
    package_no: { type: Number, required: true }, // extracted from bundleData.package_no
    moNo: { type: String, required: true }, // from bundleData.selectedMono
    custStyle: { type: String, required: true }, // from bundleData.custStyle
    color: { type: String, required: true }, // from bundleData.color
    size: { type: String, required: true }, // from bundleData.size
    lineNo: { type: String, required: true }, // from bundleData.lineNo
    department: { type: String, required: true }, // from bundleData.department
    buyer: { type: String, required: false }, // from bundleData.buyer
    factory: { type: String }, // Added
    country: { type: String }, // Added
    sub_con: { type: String }, // Added
    sub_con_factory: { type: String }, // Added
    checkedQty: { type: Number, required: true }, // e.g. bundleData.count
    totalPass: { type: Number, required: true },
    totalRejects: { type: Number, required: true },
    totalRepair: { type: Number, required: true, default: 0 }, // New field
    defectQty: { type: Number, required: true },
    defectArray: [
      {
        defectName: { type: String, required: true },
        totalCount: { type: Number, required: true },
      },
    ],
    rejectGarments: [
      {
        totalCount: { type: Number, required: true },
        defects: [
          {
            name: { type: String, required: true },
            count: { type: Number, required: true },
            repair: { type: String, required: true },
          },
        ],
        garment_defect_id: { type: String, required: true },
        rejectTime: { type: String, required: true }, // "HH:MM:SS"
      },
    ],
    inspection_time: {
      type: String,
      // validate: {
      //   validator: function (v) {
      //     return v === undefined || v === null || /^\d{2}:\d{2}:\d{2}$/.test(v);
      //   },
      //   message: (props) =>
      //     `${props.value} is not a valid time format! Use HH:MM:SS.`,
      // },
    }, // "HH:MM:SS"
    inspection_date: { type: String, required: true }, // "MM/DD/YYYY"
    emp_id_inspection: { type: String, required: true },
    eng_name_inspection: { type: String, required: true },
    kh_name_inspection: { type: String, required: true },
    job_title_inspection: { type: String, required: true },
    dept_name_inspection: { type: String, required: true },
    sect_name_inspection: { type: String, required: true },
    bundle_id: { type: String, required: true }, // Add this line
    bundle_random_id: { type: String, required: true }, // Add this line
    printArray: [
      {
        method: { type: String, required: true },
        defect_print_id: { type: String, required: true },
        totalRejectGarmentCount: { type: Number, required: true },
        totalPrintDefectCount: { type: Number, required: true },
        totalRejectGarment_Var: { type: Number, required: true }, // New field, remains constant
        repairGarmentsDefects: [
          // New field
          {
            inspectionNo: { type: Number, required: true },
            repairGarments: [
              {
                totalDefectCount: { type: Number, required: true },
                repairDefectArray: [
                  {
                    name: { type: String, required: true },
                    count: { type: Number, required: true },
                  },
                ],
              },
            ],
          },
        ],
        printData: [
          {
            garmentNumber: { type: Number, required: true },
            defects: [
              {
                name: { type: String, required: true },
                count: { type: Number, required: true },
                repair: { type: String, required: true },
              },
            ],
          },
        ],
        isCompleted: { type: Boolean, default: false }, // New field
        timestamp: { type: Date, default: Date.now },
      },
    ],
    totalRepair: { type: Number, default: 0 },
  },
  { collection: "qc2_inspection_pass_bundle" }
);

export default (connection) =>
  connection.model("qc2_inspection_pass_bundle", qc2InspectionPassBundleSchema);

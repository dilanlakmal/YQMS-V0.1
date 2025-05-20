import mongoose from "mongoose";

const cuttingInspectionSchema = new mongoose.Schema({
  inspectionDate: { type: String, required: true }, // 'MM/DD/YYYY'
  cutting_emp_id: { type: String, required: true },
  cutting_emp_engName: { type: String },
  cutting_emp_khName: { type: String },
  cutting_emp_dept: { type: String },
  cutting_emp_section: { type: String },
  moNo: { type: String, required: true },
  tableNo: { type: String, required: true },
  buyerStyle: { type: String },
  buyer: { type: String },
  color: { type: String, required: true },
  lotNo: { type: [String], default: [] },
  orderQty: { type: Number },
  totalOrderQtyStyle: { type: Number },
  fabricDetails: {
    fabricType: { type: String },
    material: { type: String },
    rollQty: { type: Number },
    spreadYds: { type: Number },
    unit: { type: String },
    grossKgs: { type: Number },
    netKgs: { type: Number },
    totalTTLRoll: { type: Number }
  },
  cuttingTableDetails: {
    spreadTable: { type: String },
    spreadTableNo: { type: String },
    planLayers: { type: Number },
    actualLayers: { type: Number },
    totalPcs: { type: Number },
    mackerNo: { type: String, required: true },
    mackerLength: { type: Number }
  },
  mackerRatio: [
    {
      index: { type: Number, required: true },
      markerSize: { type: String, required: true },
      ratio: { type: Number, required: true }
    }
  ],
  totalBundleQty: { type: Number, required: true },
  bundleQtyCheck: { type: Number, required: true },
  totalInspectionQty: { type: Number, required: true },
  cuttingtype: { type: String, required: true },
  garmentType: { type: String, required: true },
  inspectionData: [
    {
      inspectedSize: { type: String, required: true },
      bundleQtyCheckSize: { type: Number, required: true },
      tolerance: {
        min: { type: Number, required: true },
        max: { type: Number, required: true }
      },
      totalPcsSize: { type: Number, required: true },
      pcsSize: {
        total: { type: Number, required: true },
        top: { type: Number, required: true },
        middle: { type: Number, required: true },
        bottom: { type: Number, required: true }
      },
      passSize: {
        total: { type: Number, required: true },
        top: { type: Number, required: true },
        middle: { type: Number, required: true },
        bottom: { type: Number, required: true }
      },
      rejectSize: {
        total: { type: Number, required: true },
        top: { type: Number, required: true },
        middle: { type: Number, required: true },
        bottom: { type: Number, required: true }
      },
      rejectGarmentSize: {
        total: { type: Number, required: true },
        top: { type: Number, required: true },
        middle: { type: Number, required: true },
        bottom: { type: Number, required: true }
      },
      rejectMeasurementSize: {
        total: { type: Number, required: true },
        top: { type: Number, required: true },
        middle: { type: Number, required: true },
        bottom: { type: Number, required: true }
      },
      passrateSize: {
        total: { type: Number, required: true },
        top: { type: Number, required: true },
        middle: { type: Number, required: true },
        bottom: { type: Number, required: true }
      },
      bundleInspectionData: [
        {
          bundleNo: { type: Number, required: true },
          serialLetter: { type: String, required: true },
          totalPcs: { type: Number, required: true },
          pcs: {
            total: { type: Number, required: true },
            top: { type: Number, required: true },
            middle: { type: Number, required: true },
            bottom: { type: Number, required: true }
          },
          pass: {
            total: { type: Number, required: true },
            top: { type: Number, required: true },
            middle: { type: Number, required: true },
            bottom: { type: Number, required: true }
          },
          reject: {
            total: { type: Number, required: true },
            top: { type: Number, required: true },
            middle: { type: Number, required: true },
            bottom: { type: Number, required: true }
          },
          rejectGarment: {
            total: { type: Number, required: true },
            top: { type: Number, required: true },
            middle: { type: Number, required: true },
            bottom: { type: Number, required: true }
          },
          rejectMeasurement: {
            total: { type: Number, required: true },
            top: { type: Number, required: true },
            middle: { type: Number, required: true },
            bottom: { type: Number, required: true }
          },
          passrate: {
            total: { type: Number, required: true },
            top: { type: Number, required: true },
            middle: { type: Number, required: true },
            bottom: { type: Number, required: true }
          },
          measurementInsepctionData: [
            {
              partName: { type: String, required: true },
              partNo: { type: Number, required: true },
              partNameKhmer: { type: String, required: true },
              measurementPointsData: [
                {
                  measurementPointName: { type: String, required: true },
                  measurementPointNameKhmer: { type: String, required: true },
                  panelName: { type: String, required: true },
                  side: { type: String, required: true },
                  direction: { type: String, required: true },
                  property: { type: String, required: true },
                  measurementValues: [
                    {
                      location: { type: String, required: true },
                      measurements: [
                        {
                          pcsName: { type: String, required: true },
                          valuedecimal: { type: Number, required: true },
                          valuefraction: { type: String, required: true },
                          status: { type: String, required: true }
                        }
                      ]
                    }
                  ]
                }
              ],
              fabricDefects: [
                {
                  location: { type: String, required: true },
                  defectData: [
                    {
                      pcsName: { type: String, required: true },
                      totalDefects: { type: Number, required: true },
                      defects: [
                        {
                          defectName: { type: String },
                          defectQty: { type: Number }
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      cuttingDefects: {
        issues: [
          {
            cuttingdefectName: { type: String, default: "" },
            cuttingdefectNameKhmer: { type: String, default: "" },
            remarks: { type: String, default: "" },
            imageData: [
              {
                no: { type: Number },
                path: { type: String }
              }
            ]
          }
        ],
        additionalComments: { type: String, default: "" },
        additionalImages: [
          {
            no: { type: Number },
            path: { type: String }
          }
        ]
      },
      inspectionTime: { type: String, required: true },
      created_at: { type: Date, default: Date.now },
      updated_at: { type: Date, default: Date.now }
    }
  ]
});

export default function createCuttingInspectionModel(connection) {
  return connection.model("CuttingInspection", cuttingInspectionSchema);
}

import mongoose from "mongoose";

const cuttingInspectionSchema = new mongoose.Schema({
  inspectionDate: { type: String, required: true }, // 'MM/DD/YYYY'
  cutting_emp_id: { type: String, required: true },
  cutting_emp_engName: { type: String, required: true },
  cutting_emp_khName: { type: String, required: true },
  cutting_emp_dept: { type: String, required: true },
  cutting_emp_section: { type: String, required: true },
  moNo: { type: String, required: true },
  lotNo: { type: String, required: true },
  color: { type: String, required: true },
  tableNo: { type: String, required: true },
  planLayerQty: { type: Number, required: true },
  actualLayerQty: { type: Number, required: true },
  totalPcs: { type: Number, required: true },
  cuttingtableLetter: { type: String, required: true },
  cuttingtableNo: { type: String, required: true },
  marker: { type: String, required: true },
  markerRatio: [
    {
      index: { type: Number, required: true },
      markerSize: { type: String, required: true },
      ratio: { type: Number, required: true }
    }
  ],
  totalBundleQty: { type: Number, required: true },
  bundleQtyCheck: { type: Number, required: true },
  totalInspectionQty: { type: Number, required: true },
  cuttingtype: { type: String, required: true }, // 'Auto', 'Manual', 'Auto & Manual'
  garmentType: { type: String, required: true },
  inspectionData: [
    {
      size: { type: String, required: true },
      serialLetter: { type: String, required: true },
      tolerance: {
        min: { type: Number, required: true },
        max: { type: Number, required: true }
      },
      totalPcs: { type: Number, required: true },
      totalPass: { type: Number, required: true },
      totalReject: { type: Number, required: true },
      totalRejectMeasurement: { type: Number, required: true },
      totalRejectDefects: { type: Number, required: true },
      passRate: { type: Number, required: true },
      pcsLocation: [
        {
          location: { type: String, required: true }, // 'Top', 'Middle', 'Bottom'
          pcs: { type: Number, required: true },
          pass: { type: Number, required: true },
          reject: { type: Number, required: true },
          rejectGarment: { type: Number, required: true },
          rejectMeasurement: { type: Number, required: true },
          passrate: { type: Number, required: true },
          measurementData: [
            {
              panelIndex: { type: Number, required: true },
              totalMeasurementDefects: { type: Number, required: true },
              totalDefectPcs: { type: Number, required: true },
              measurementPointData: [
                {
                  no: { type: Number, required: true },
                  measurementPointName: { type: String, required: true },
                  panelName: { type: String, required: true },
                  side: { type: String, required: true },
                  direction: { type: String, required: true },
                  property: { type: String, required: true },
                  measurementValues: [
                    {
                      partName: { type: String, required: true }, // e.g., 'T1'
                      measurement: { type: Number, required: true },
                      status: { type: String, required: true } // 'Pass' or 'Fail'
                    }
                  ]
                }
              ],
              defectData: [
                {
                  column: { type: String, required: true }, // e.g., 'T1'
                  defects: [
                    {
                      defectName: { type: String, required: true },
                      defectQty: { type: Number, required: true }
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      inspectionTime: { type: String, required: true } // 'HH:MM:SS'
    }
  ]
});

export default function createCuttingInspectionModel(connection) {
  return connection.model("CuttingInspection", cuttingInspectionSchema);
}

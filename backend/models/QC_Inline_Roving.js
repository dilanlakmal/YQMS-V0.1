import mongoose from "mongoose";

const qcInlineRovingSchema = new mongoose.Schema(
  {
    inline_roving_id: { type: Number, required: true },
    report_name: { type: String, required: true },
    inspection_date: { type: String, required: true },
    mo_no: { type: String, required: true },
    line_no: { type: String, required: true },
    inspection_rep: [
      {
        inspection_rep_name: { type: String, required: true },
        emp_id: { type: String, required: true },
        eng_name: { type: String, required: true },
        total_operators: { type: Number, default: 0 },
        complete_inspect_operators: { type: Number, default: 0 },
        Inspect_status: { type: String, default: "Not Complete" },
        inlineData: [
          {
            operator_emp_id: { type: String, required: true },
            operator_eng_name: { type: String, required: true },
            operator_kh_name: { type: String, required: true },
            operator_job_title: { type: String, required: true },
            operator_dept_name: { type: String, required: true },
            operator_sect_name: { type: String, required: true },
            tg_no: { type: String, required: true },
            tg_code: { type: String, required: true },
            ma_code: { type: String, required: true },
            operation_ch_name: { type: String, required: true },
            operation_kh_name: { type: String, required: true },
            type: { type: String, required: true },
            spi: { type: String, required: true },
            spi_images: [{ type: String }], // Path to the SPI image
            measurement: { type: String, required: true },
            measurement_images: [{ type: String }], // Path to the Measurement image
            checked_quantity: { type: Number, required: true },
            rejectedGarmentCount: { type: Number, default: 0 },
            inspection_time: { type: String, required: true }, // Store as string in HH:MM:SS
            qualityStatus: { type: String, required: true },
            defectImages: [{ type: String }],
            overall_roving_status: {
              type: String,
              required: true,
              default: "NOT_CALCULATED"
            },
            remark: { type: String, maxLength: 250, default: "" },
            rejectGarments: [
              {
                totalCount: { type: Number, required: true },
                garments: [
                  {
                    defects: [
                      {
                        name: { type: String, required: true },
                        count: { type: Number, required: true },
                        repair: { type: String, required: true },
                        defect_status: { type: String, required: true }
                      }
                    ],
                    status: { type: String, required: true }
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  { collection: "qc_inline_roving" }
);

export default (connection) =>
  connection.model("QC2InlineRoving", qcInlineRovingSchema);

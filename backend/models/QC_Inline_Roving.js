import mongoose from 'mongoose';

const qcInlineRovingSchema = new mongoose.Schema(
  {
    inline_roving_id: { type: Number, required: true },
    report_name: { type: String, required: true },
    emp_id: { type: String, required: true },
    inspection_date: { type: String, required: true },
    inlineData: [
      {
        type: { type: String, required: true },
        spi: { type: String, required: true },
        checked_quantity: { type: Number, required: true },
        inspection_time: { type: String, required: true }, // Store as string in HH:MM:SS
        qualityStatus: { type: String, required: true },
        rejectGarments: [
          {
            totalCount: { type: Number, required: true },
            garments: [
              {
                // garment_defect_id: { type: String, required: true },
                defects: [
                  {
                    name: { type: String, required: true },
                    count: { type: Number, required: true },
                    repair: { type: String, required: true },
                  },
                ],
                status: { type: String, required: true },
              },
            ],
          },
        ],
      },
    ],
  },
  { collection: "qc_inline_roving" }
);

export default (connection) => connection.model("QC2InlineRoving", qcInlineRovingSchema);

import {
  QCData,                
} from "../MongoDB/dbConnectionController.js";

/* ------------------------------
   End Points - QC1
------------------------------ */

export const saveQCData = async (req, res) => {
    try {
        // Sanitize defectDetails
        const sanitizedDefects = (req.body.defectDetails || []).map((defect) => ({
          name: defect.name.toString().trim(),
          count: Math.abs(parseInt(defect.count)) || 0
        }));
        const sanitizedData = {
          ...req.body,
          defectArray: sanitizedDefects,
          headerData: {
            ...req.body.headerData,
            date: req.body.headerData.date
              ? new Date(req.body.headerData.date).toISOString()
              : undefined
          }
        };
    
        const qcData = new QCData(sanitizedData);
        const savedData = await qcData.save();
    
        res.status(201).json({
          message: "QC data saved successfully",
          data: savedData
        });
      } catch (error) {
        console.error("Error saving QC data:", error);
        res.status(500).json({
          message: "Failed to save QC data",
          error: error.message,
          details: error.errors
            ? Object.keys(error.errors).map((key) => ({
                field: key,
                message: error.errors[key].message
              }))
            : undefined
        });
      }
};
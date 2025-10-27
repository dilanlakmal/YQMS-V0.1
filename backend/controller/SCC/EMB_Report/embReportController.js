import {
  EMBReport,
} from "../../MongoDB/dbConnectionController.js";


export const saveEMBReport = async (req, res) => {
  try {
      const {
        _id,
        reportType,
        inspectionDate,
        factoryName,
        moNo,
        buyer,
        buyerStyle,
        color,
        batchNo,
        tableNo,
        actualLayers,
        totalBundle,
        totalPcs,
        aqlData,
        defects,
        remarks,
        defectImageUrl,
        emp_id,
        emp_kh_name,
        emp_eng_name,
        emp_dept_name,
        emp_sect_name,
        emp_job_title
      } = req.body;
  
      if (
        !reportType ||
        !inspectionDate ||
        !factoryName ||
        !moNo ||
        !color ||
        !batchNo ||
        !tableNo ||
        !actualLayers ||
        !totalBundle ||
        !totalPcs ||
        !aqlData
      ) {
        return res
          .status(400)
          .json({ message: "Missing required fields for EMB Report." });
      }
  
      const now = new Date();
      const currentInspectionTime = `${String(now.getHours()).padStart(
        2,
        "0"
      )}:${String(now.getMinutes()).padStart(2, "0")}:${String(
        now.getSeconds()
      ).padStart(2, "0")}`;
  
      const reportData = {
        reportType,
        inspectionDate: new Date(inspectionDate),
        factoryName,
        moNo,
        buyer,
        buyerStyle,
        color,
        batchNo,
        tableNo,
        actualLayers: Number(actualLayers),
        totalBundle: Number(totalBundle),
        totalPcs: Number(totalPcs),
        aqlData: {
          type: aqlData.type || "General",
          level: aqlData.level || "II",
          sampleSizeLetterCode: aqlData.sampleSizeLetterCode || "",
          sampleSize: Number(aqlData.sampleSize) || 0,
          acceptDefect: Number(aqlData.acceptDefect) || 0,
          rejectDefect: Number(aqlData.rejectDefect) || 0
        },
        defects: defects || [],
        remarks: remarks?.trim() || "NA",
        defectImageUrl: defectImageUrl || null,
        emp_id,
        emp_kh_name,
        emp_eng_name,
        emp_dept_name,
        emp_sect_name,
        emp_job_title,
        inspectionTime: currentInspectionTime
      };
  
      let savedReport;
      if (_id) {
        savedReport = await EMBReport.findByIdAndUpdate(_id, reportData, {
          new: true,
          runValidators: true
        });
        if (!savedReport)
          return res
            .status(404)
            .json({ message: "Report not found for update." });
      } else {
        const reportToSave = new EMBReport(reportData);
        savedReport = await reportToSave.save();
      }
  
      res
        .status(201)
        .json({ message: "EMB Report saved successfully.", data: savedReport });
    } catch (error) {
      console.error("Error saving EMB Report:", error);
      if (error.code === 11000) {
        return res.status(409).json({
          message: "Duplicate entry. This EMB report might already exist."
        });
      }
      if (error.name === "ValidationError") {
        return res.status(400).json({
          message: "Validation Error: " + error.message,
          errors: error.errors
        });
      }
      res
        .status(500)
        .json({ message: "Failed to save EMB Report.", error: error.message });
    }
};
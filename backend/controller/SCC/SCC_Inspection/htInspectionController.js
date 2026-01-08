import {
  HTInspectionReport,
  UserMain,
} from "../../MongoDB/dbConnectionController.js";

// 1. POST /api/scc/ht-inspection-report
export const saveHtInspectionReport = async (req, res) => {
  try {
      const {
        _id,
        inspectionDate,
        machineNo,
        moNo,
        buyer,
        buyerStyle,
        color,
        batchNo,
        operatorData, // <-- New: Expect operatorData
        tableNo,
        actualLayers,
        totalBundle,
        totalPcs,
        aqlData,
        // defectsQty, result, defectRate will be calculated by pre-save hook
        defects,
        remarks,
        defectImageUrl,
        emp_id,
        emp_kh_name,
        emp_eng_name,
        emp_dept_name,
        emp_sect_name,
        emp_job_title
        // inspectionTime is also generated now
      } = req.body;

      if (
        !inspectionDate ||
        !machineNo ||
        !moNo ||
        !color ||
        !batchNo ||
        !tableNo ||
        actualLayers === undefined ||
        actualLayers === null ||
        !totalPcs ||
        !aqlData
      ) {
        return res
          .status(400)
          .json({ message: "Missing required fields for HT Inspection Report." });
      }

      const now = new Date();
      const currentInspectionTime = `${String(now.getHours()).padStart(
        2,
        "0"
      )}:${String(now.getMinutes()).padStart(2, "0")}:${String(
        now.getSeconds()
      ).padStart(2, "0")}`;

      const reportData = {
        inspectionDate: new Date(inspectionDate), // Store as ISODate
        machineNo,
        moNo,
        buyer,
        buyerStyle,
        color,
        batchNo,
        operatorData:
          operatorData && operatorData.emp_id && operatorData.emp_reference_id
            ? operatorData
            : null, // Save valid operatorData
        tableNo,
        actualLayers: Number(actualLayers),
        totalBundle: Number(totalBundle),
        totalPcs: Number(totalPcs),
        aqlData: {
          // Ensure all AQL fields are present or defaulted
          type: aqlData.type || "General",
          level: aqlData.level || "II",
          sampleSizeLetterCode: aqlData.sampleSizeLetterCode || "",
          sampleSize: Number(aqlData.sampleSize) || 0,
          acceptDefect: Number(aqlData.acceptDefect) || 0,
          rejectDefect: Number(aqlData.rejectDefect) || 0
        },
        defects: defects || [], // Ensure defects is an array
        remarks: remarks?.trim() || "NA",
        defectImageUrl: defectImageUrl || null,
        emp_id,
        emp_kh_name,
        emp_eng_name,
        emp_dept_name,
        emp_sect_name,
        emp_job_title,
        inspectionTime: currentInspectionTime
        // defectsQty, result, defectRate will be set by pre-save hook
      };

      let savedReport;
      if (_id) {
        // For updates, the pre('findOneAndUpdate') hook will handle calculations
        savedReport = await HTInspectionReport.findByIdAndUpdate(
          _id,
          reportData,
          { new: true, runValidators: true }
        );
        if (!savedReport)
          return res
            .status(404)
            .json({ message: "Report not found for update." });
      } else {
        // For new documents, pre('save') hook handles calculations
        const reportToSave = new HTInspectionReport(reportData);
        savedReport = await reportToSave.save();
      }

      // Populate operatorData for the response
      if (savedReport.operatorData && savedReport.operatorData.emp_reference_id) {
        await savedReport.populate({
          path: "operatorData.emp_reference_id",
          model: UserMain,
          select: "emp_id eng_name face_photo"
        });
      }

      res.status(201).json({
        message: "HT Inspection Report saved successfully.",
        data: savedReport
      });
    } catch (error) {
      console.error("Error saving HT Inspection Report:", error);
      if (error.code === 11000) {
        return res.status(409).json({
          message: "Duplicate entry. This report might already exist.",
          error: error.message,
          errorCode: "DUPLICATE_KEY"
        });
      }
      if (error.name === "ValidationError") {
        return res.status(400).json({
          message: "Validation Error: " + error.message,
          errors: error.errors
        });
      }
      res.status(500).json({
        message: "Failed to save HT Inspection Report.",
        error: error.message,
        details: error
      });
    }
};

// GET endpoint to load an existing HT Inspection Report (Optional - for editing/viewing later)
export const loadHtInspectionReport = async (req, res) => {
  try {
      const { inspectionDate, machineNo, moNo, color, batchNo, tableNo } =
        req.query; // Added tableNo
      if (
        !inspectionDate ||
        !machineNo ||
        !moNo ||
        !color ||
        !batchNo ||
        !tableNo
      ) {
        return res.status(400).json({
          message:
            "Date, Machine, MO, Color, Batch No, and Table No are required to fetch report."
        });
      }

      // Convert string date from query to Date object for matching if dates are stored as ISODate
      // If dates are stored as "MM/DD/YYYY" strings, this query needs adjustment.
      // Assuming inspectionDate in schema is ISODate
      const searchDateStart = new Date(inspectionDate);
      searchDateStart.setHours(0, 0, 0, 0);
      const searchDateEnd = new Date(inspectionDate);
      searchDateEnd.setHours(23, 59, 59, 999);

      const report = await HTInspectionReport.findOne({
        inspectionDate: { $gte: searchDateStart, $lte: searchDateEnd },
        machineNo,
        moNo,
        color,
        batchNo,
        tableNo
      })
        .populate({
          // Populate operatorData's emp_reference_id
          path: "operatorData.emp_reference_id",
          model: UserMain,
          select: "emp_id eng_name face_photo"
        })
        .lean();

      if (!report) {
        return res
          .status(200)
          .json({ message: "HT_INSPECTION_REPORT_NOT_FOUND", data: null });
      }
      res.json({ message: "REPORT_FOUND", data: report });
    } catch (error) {
      console.error("Error fetching HT Inspection Report:", error);
      res.status(500).json({
        message: "Failed to fetch HT Inspection Report",
        error: error.message
      });
    }
};
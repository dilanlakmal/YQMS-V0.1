import {
  ElasticReport,
  UserMain,
} from "../../MongoDB/dbConnectionController.js";

// 1. POST /api/scc/elastic-report/register-machine
export const saveMachine = async (req, res) => {
  try {
      const {
        inspectionDate,
        machineNo,
        moNo,
        buyer,
        buyerStyle,
        color,
        operatorData, // <-- MODIFIED: Expect operatorData
        emp_id,
        emp_kh_name,
        emp_eng_name
      } = req.body;

      if (!inspectionDate || !machineNo || !moNo || !color) {
        return res.status(400).json({
          success: false,
          message:
            "Missing required fields: Inspection Date, Machine No, MO No, and Color."
        });
      }

      const now = new Date();
      const registrationTime = `${String(now.getHours()).padStart(
        2,
        "0"
      )}:${String(now.getMinutes()).padStart(2, "0")}:${String(
        now.getSeconds()
      ).padStart(2, "0")}`;

      const newRegistrationData = {
        inspectionDate,
        machineNo,
        moNo,
        buyer,
        buyerStyle,
        color,
        operatorData:
          operatorData && operatorData.emp_id && operatorData.emp_reference_id
            ? operatorData
            : null, // <-- MODIFIED: Save valid operatorData
        registeredBy_emp_id: emp_id,
        registeredBy_emp_kh_name: emp_kh_name,
        registeredBy_emp_eng_name: emp_eng_name,
        registrationTime,
        inspections: []
      };

      // Use findOneAndUpdate with upsert to handle both creation and potential updates if logic changes
      const newRegistration = await ElasticReport.findOneAndUpdate(
        { inspectionDate, machineNo, moNo, color },
        { $setOnInsert: newRegistrationData },
        { new: true, upsert: true, runValidators: true }
      );

      res.status(201).json({
        success: true,
        message: "Machine registered successfully for Elastic Report.",
        data: newRegistration
      });
    } catch (error) {
      console.error("Error registering machine for Elastic Report:", error);
      if (error.code === 11000) {
        return res
          .status(409)
          .json({ success: false, message: "This registration already exists." });
      }
      res.status(500).json({
        success: false,
        message: "Failed to register machine.",
        error: error.message
      });
    }
};

// 2. GET /api/scc/elastic-report/by-date?inspectionDate=<date>
export const getElasticReportByDate = async (req, res) => {
  try {
      const { inspectionDate } = req.query;
      if (!inspectionDate) {
        return res.status(400).json({ message: "Inspection Date is required." });
      }

      const records = await ElasticReport.find({ inspectionDate })
        .sort({ machineNo: 1 })
        .populate({
          // <-- MODIFIED: Populate operator data
          path: "operatorData.emp_reference_id",
          model: UserMain, // Assuming UserMain is your user model
          select: "emp_id eng_name face_photo"
        })
        .lean();

      res.json(records || []);
    } catch (error) {
      console.error("Error fetching Elastic Report records by date:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch records", error: error.message });
    }
};

// 3. GET /api/scc/elastic-report/distinct-mos?inspectionDate=<date>
//    NEW endpoint to get distinct MOs for the filter dropdown
export const getDistinctMosByDate = async (req, res) => {
  try {
      const { inspectionDate } = req.query;
      if (!inspectionDate) {
        return res.status(400).json({ message: "Inspection Date is required." });
      }
      const mos = await ElasticReport.distinct("moNo", { inspectionDate });
      res.json(mos || []);
    } catch (error) {
      console.error("Error fetching distinct MOs for Elastic Report:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch distinct MOs", error: error.message });
    }
};

// 4. POST /api/scc/elastic-report/submit-slot-inspection
export const submitSlotInspection = async (req, res) => {
  try {
      const {
        elasticReportDocId,
        timeSlotKey,
        inspectionNo,
        checkedQty,
        measurement,
        defectDetails, // Expecting an array like [{ name: 'Broken Stich', qty: 1 }]
        emp_id,
        remarks
      } = req.body;

      if (!elasticReportDocId || !timeSlotKey || !checkedQty) {
        return res
          .status(400)
          .json({ success: false, message: "Missing required fields." });
      }

      const reportDoc = await ElasticReport.findById(elasticReportDocId);
      if (!reportDoc) {
        return res
          .status(404)
          .json({ success: false, message: "Report document not found." });
      }

      // --- Calculations ---
      const totalDefectQty = (defectDetails || []).reduce(
        (sum, defect) => sum + (defect.qty || 0),
        0
      );
      const defectRate =
        checkedQty > 0 ? parseFloat((totalDefectQty / checkedQty).toFixed(4)) : 0;
      const qualityIssue = totalDefectQty > 0 ? "Reject" : "Pass";
      const result =
        qualityIssue === "Pass" && measurement === "Pass" ? "Pass" : "Reject";

      const slotData = {
        inspectionNo: Number(inspectionNo),
        timeSlotKey,
        checkedQty: Number(checkedQty),
        measurement,
        qualityIssue,
        defectDetails: defectDetails || [],
        totalDefectQty,
        defectRate,
        result,
        remarks: remarks || "",
        emp_id,
        isUserModified: true,
        inspectionTimestamp: new Date()
      };

      const existingSlotIndex = reportDoc.inspections.findIndex(
        (insp) => insp.timeSlotKey === timeSlotKey
      );

      if (existingSlotIndex > -1) {
        reportDoc.inspections[existingSlotIndex] = slotData;
      } else {
        reportDoc.inspections.push(slotData);
      }

      reportDoc.inspections.sort(
        (a, b) => (a.inspectionNo || 0) - (b.inspectionNo || 0)
      );
      await reportDoc.save();

      res.status(200).json({
        success: true,
        message: "Inspection slot submitted successfully.",
        data: reportDoc
      });
    } catch (error) {
      console.error("Error submitting Elastic slot inspection:", error);
      res.status(500).json({
        success: false,
        message: "Failed to submit slot inspection.",
        error: error.message
      });
    }
};
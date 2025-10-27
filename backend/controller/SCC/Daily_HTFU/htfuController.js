import {
  DailyTestingHTFU,
  UserMain,
} from "../../MongoDB/dbConnectionController.js";
import mongoose from "mongoose";

// 4. POST /api/scc/daily-htfu/register-machine
//    Registers a machine for daily testing. Creates a new document in daily_testing_ht_fus.
export const saveRegisterMachine = async (req, res) => {
  try {
      const {
        inspectionDate,
        machineNo,
        moNo,
        buyer,
        buyerStyle,
        color,
        baseReqTemp,
        baseReqTime,
        baseReqPressure,
        operatorData, // Expecting { emp_id, emp_eng_name, emp_face_photo, emp_reference_id }
        emp_id,
        emp_kh_name,
        emp_eng_name,
        emp_dept_name,
        emp_sect_name,
        emp_job_title // Inspector info
      } = req.body;
  
      const formattedDate = inspectionDate; // Already formatted by frontend's formatDateForAPI
  
      if (!formattedDate || !machineNo || !moNo || !color) {
        return res.status(400).json({
          success: false,
          message:
            "Missing required fields: Inspection Date, Machine No, MO No, and Color."
        });
      }
  
      // Validate operatorData if provided
      if (
        operatorData &&
        (!operatorData.emp_id || !operatorData.emp_reference_id)
      ) {
        console.warn(
          "[Register Machine] Received operatorData but it's incomplete:",
          operatorData
        );
        // Decide if this should be an error or if operatorData becomes null
        // return res.status(400).json({ success: false, message: "Incomplete operator data provided." });
      }
  
      const now = new Date();
      const registrationTime = `${String(now.getHours()).padStart(
        2,
        "0"
      )}:${String(now.getMinutes()).padStart(2, "0")}:${String(
        now.getSeconds()
      ).padStart(2, "0")}`;
  
      const existingRegistration = await DailyTestingHTFU.findOne({
        inspectionDate: formattedDate,
        machineNo,
        moNo,
        color
      });
  
      if (existingRegistration) {
        return res.status(409).json({
          success: false,
          message:
            "This Machine-MO-Color combination is already registered for this date.",
          data: existingRegistration
        });
      }
  
      const newRegistrationData = {
        inspectionDate: formattedDate,
        machineNo,
        moNo,
        buyer,
        buyerStyle,
        color,
        baseReqTemp: baseReqTemp !== undefined ? baseReqTemp : null,
        baseReqTime: baseReqTime !== undefined ? baseReqTime : null,
        baseReqPressure: baseReqPressure !== undefined ? baseReqPressure : null,
        operatorData:
          operatorData && operatorData.emp_id && operatorData.emp_reference_id
            ? operatorData
            : null, // Save valid operatorData or null
        emp_id,
        emp_kh_name,
        emp_eng_name,
        emp_dept_name,
        emp_sect_name,
        emp_job_title,
        inspectionTime: registrationTime,
        inspections: [],
        stretchTestResult: "Pending",
        washingTestResult: "Pending",
        isStretchWashingTestDone: false
      };
  
      console.log("[Register Machine] Data to save:", newRegistrationData);
  
      const newRegistration = new DailyTestingHTFU(newRegistrationData);
      await newRegistration.save();
  
      // Populate operatorData.emp_reference_id for the response
      const populatedRegistration = await DailyTestingHTFU.findById(
        newRegistration._id
      )
        .populate({
          path: "operatorData.emp_reference_id",
          model: UserMain,
          select: "emp_id eng_name face_photo"
        })
        .lean();
  
      res.status(201).json({
        success: true,
        message: "Machine registered successfully for daily HT/FU QC.",
        data: populatedRegistration || newRegistration
      });
    } catch (error) {
      console.error("Error registering machine for Daily HT/FU QC:", error);
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "Duplicate entry. This registration might already exist.",
          error: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: "Failed to register machine",
        error: error.message
      });
    }
};

// 5. GET /api/scc/daily-htfu/by-date?inspectionDate=<date>
//    Fetches all DailyTestingHTFU records for a given inspection date.
export const getDailyTestingHTFUByDate = async (req, res) => {
  try {
      const { inspectionDate, moNo: filterMoNo } = req.query; // Add moNo for filtering
      if (!inspectionDate) {
        return res.status(400).json({ message: "Inspection Date is required." });
      }
      const formattedDate = inspectionDate; // Expecting MM/DD/YYYY from frontend
  
      const query = { inspectionDate: formattedDate };
      if (filterMoNo && filterMoNo !== "All") {
        query.moNo = filterMoNo;
      }
  
      const records = await DailyTestingHTFU.find(query)
        .populate({
          // Populate the emp_reference_id within operatorData
          path: "operatorData.emp_reference_id",
          model: UserMain, // Your User model
          select: "emp_id eng_name face_photo" // Fields to select from User
        })
        .sort({ machineNo: 1 }) // Consider collation for proper numeric sort if machineNo can be "1", "10", "2"
        .lean();
  
      // The `operatorData` on each record will now have `emp_reference_id` populated if it was a valid ObjectId
      // The frontend will then use `operatorData.emp_eng_name`, `operatorData.emp_face_photo` etc.
      // which are stored directly, and the populated `emp_reference_id` can be used if needed for consistency.
  
      res.json(records || []);
    } catch (error) {
      console.error("Error fetching Daily HT/FU records by date:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch daily records", error: error.message });
    }
};

// Endpoint to fetch distinct MO Numbers for a given inspection date from daily_testing_ht_fus
export const getDistinctMoNumbersByDate = async (req, res) => {
   try {
      const { inspectionDate } = req.query;
      if (!inspectionDate) {
        return res.status(400).json({ message: "Inspection Date is required." });
      }
      const formattedDate = inspectionDate; // Expecting MM/DD/YYYY from frontend
  
      const distinctMoNos = await DailyTestingHTFU.distinct("moNo", {
        inspectionDate: formattedDate
      });
  
      res.json(distinctMoNos.sort() || []);
    } catch (error) {
      console.error("Error fetching distinct MOs for Daily HT/FU QC:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch distinct MOs", error: error.message });
    }
};

// 6. POST /api/scc/daily-htfu/submit-slot-inspection
//    Submits inspection data for a specific time slot for ONE machine.
export const submitSlotInspection = async (req, res) => {
  try {
    const {
      inspectionDate,
      timeSlotKey,
      inspectionNo,
      dailyTestingDocId,
      temp_req, // This will be machineDoc.baseReqTemp from frontend
      temp_actual,
      temp_isNA,
      temp_isUserModified,
      time_req, // machineDoc.baseReqTime
      time_actual,
      time_isNA,
      time_isUserModified,
      pressure_req, // machineDoc.baseReqPressure
      pressure_actual,
      pressure_isNA,
      pressure_isUserModified,
      emp_id
    } = req.body;

    // Validate required fields for a single submission
    if (
      !inspectionDate ||
      !timeSlotKey ||
      !inspectionNo || // Ensure inspectionNo is a valid number
      !dailyTestingDocId ||
      (temp_actual === undefined && !temp_isNA) || // actual is required if not N/A
      (time_actual === undefined && !time_isNA) ||
      (pressure_actual === undefined && !pressure_isNA)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing or invalid required fields for slot inspection submission."
      });
    }

    const formattedDate = inspectionDate; // Already formatted

    const record = await DailyTestingHTFU.findById(dailyTestingDocId);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: `Daily testing record not found for ID: ${dailyTestingDocId}`
      });
    }

    if (record.inspectionDate !== formattedDate) {
      return res.status(400).json({
        success: false,
        message: `Date mismatch for record ID: ${dailyTestingDocId}. Expected ${formattedDate}, found ${record.inspectionDate}`
      });
    }

    const slotData = {
      inspectionNo: Number(inspectionNo),
      timeSlotKey,
      temp_req: temp_req !== undefined ? temp_req : null,
      temp_actual: temp_isNA
        ? null
        : temp_actual !== undefined
        ? temp_actual
        : null,
      temp_isNA: !!temp_isNA,
      temp_isUserModified: !!temp_isUserModified,
      time_req: time_req !== undefined ? time_req : null,
      time_actual: time_isNA
        ? null
        : time_actual !== undefined
        ? time_actual
        : null,
      time_isNA: !!time_isNA,
      time_isUserModified: !!time_isUserModified,
      pressure_req: pressure_req !== undefined ? pressure_req : null,
      pressure_actual: pressure_isNA
        ? null
        : pressure_actual !== undefined
        ? pressure_actual
        : null,
      pressure_isNA: !!pressure_isNA,
      pressure_isUserModified: !!pressure_isUserModified,
      inspectionTimestamp: new Date()
    };

    const existingSlotIndex = record.inspections.findIndex(
      (insp) => insp.timeSlotKey === timeSlotKey
    );

    if (existingSlotIndex > -1) {
      // If you want to allow updates, replace the item:
      // record.inspections[existingSlotIndex] = slotData;
      // For now, prevent re-submission as per original logic:
      return res.status(409).json({
        success: false,
        message: `Slot ${timeSlotKey} has already been submitted for this record. Updates are not currently supported via this endpoint.`
      });
    } else {
      record.inspections.push(slotData);
    }

    record.inspections.sort(
      (a, b) => (a.inspectionNo || 0) - (b.inspectionNo || 0)
    );

    // Update general record info
    record.emp_id = emp_id;
    const now = new Date();
    record.inspectionTime = `${String(now.getHours()).padStart(
      2,
      "0"
    )}:${String(now.getMinutes()).padStart(2, "0")}:${String(
      now.getSeconds()
    ).padStart(2, "0")}`;

    await record.save();

    res.status(201).json({
      success: true,
      message: `Inspection for slot ${timeSlotKey} submitted successfully.`,
      data: record // Return the updated document
    });
  } catch (error) {
    console.error("Error submitting slot inspection:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit slot inspection",
      error: error.message
    });
  }
};

// 7. PUT /api/scc/daily-htfu/update-test-result/:docId
//    Updates stretch or washing test results for a specific DailyTestingHTFU document.
export const updateTestResult = async (req, res) => {
  try {
      const { docId } = req.params;
      const {
        stretchTestResult,
        stretchTestRejectReasons, // This will be an array of defect names (strings)
        washingTestResult,
        emp_id // Employee performing the update
      } = req.body;
  
      if (!mongoose.Types.ObjectId.isValid(docId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid Document ID." });
      }
  
      const record = await DailyTestingHTFU.findById(docId);
      if (!record) {
        return res
          .status(404)
          .json({ success: false, message: "Daily testing record not found." });
      }
  
      const updateFields = {};
      let updated = false;
  
      if (stretchTestResult !== undefined) {
        if (
          !["Pass", "Reject", "Pending", "", null].includes(stretchTestResult)
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid Stretch Test Result value."
          });
        }
        updateFields.stretchTestResult =
          stretchTestResult === "" ? "Pending" : stretchTestResult;
        if (updateFields.stretchTestResult === "Reject") {
          updateFields.stretchTestRejectReasons = Array.isArray(
            stretchTestRejectReasons
          )
            ? stretchTestRejectReasons
            : [];
        } else {
          updateFields.stretchTestRejectReasons = []; // Clear reasons if not 'Reject'
        }
        updated = true;
      }
  
      if (washingTestResult !== undefined) {
        if (
          !["Pass", "Reject", "Pending", "", null].includes(washingTestResult)
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid Washing Test Result value."
          });
        }
        updateFields.washingTestResult =
          washingTestResult === "" ? "Pending" : washingTestResult;
        updated = true;
      }
  
      if (updated && !record.isStretchWashingTestDone) {
        if (
          (updateFields.stretchTestResult &&
            updateFields.stretchTestResult !== "Pending") ||
          (updateFields.washingTestResult &&
            updateFields.washingTestResult !== "Pending")
        ) {
          updateFields.isStretchWashingTestDone = true;
        }
      }
  
      if (!updated) {
        return res.status(400).json({
          success: false,
          message: "No valid test result fields provided for update."
        });
      }
  
      if (emp_id) {
        updateFields.emp_id = emp_id;
        const now = new Date();
        updateFields.inspectionTime = `${String(now.getHours()).padStart(
          2,
          "0"
        )}:${String(now.getMinutes()).padStart(2, "0")}:${String(
          now.getSeconds()
        ).padStart(2, "0")}`;
      }
  
      const updatedRecord = await DailyTestingHTFU.findByIdAndUpdate(
        docId,
        { $set: updateFields },
        { new: true, runValidators: true }
      ).populate({
        path: "operatorData.emp_reference_id",
        model: UserMain,
        select: "emp_id eng_name face_photo"
      });
  
      if (!updatedRecord) {
        return res.status(404).json({
          success: false,
          message:
            "Failed to update record, record not found after update attempt."
        });
      }
  
      res.status(200).json({
        success: true,
        message: "Test result updated successfully.",
        data: updatedRecord
      });
    } catch (error) {
      console.error("Error updating test result:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update test result",
        error: error.message
      });
    }
};
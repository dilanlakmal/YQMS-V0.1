import {
  SCCDailyTesting
  // DailyTestingHTFU,
} from "../../MongoDB/dbConnectionController.js";
import { formatDateToMMDDYYYY } from "../../../helpers/helperFunctions.js";

// Endpoints for SCCDailyTesting
export const saveSccDailyTesting = async (req, res) => {
  try {
    const { _id, operatorData, ...dataToSave } = req.body; // Destructure operatorData

    dataToSave.inspectionDate = formatDateToMMDDYYYY(dataToSave.inspectionDate);
    dataToSave.remarks = dataToSave.remarks?.trim() || "NA";

    if (
      dataToSave.standardSpecifications &&
      dataToSave.standardSpecifications.pressure !== undefined
    ) {
      dataToSave.standardSpecifications.pressure =
        dataToSave.standardSpecifications.pressure !== null &&
        dataToSave.standardSpecifications.pressure !== ""
          ? Number(dataToSave.standardSpecifications.pressure)
          : null;
    }

    if (
      dataToSave.parameterAdjustmentRecords &&
      Array.isArray(dataToSave.parameterAdjustmentRecords)
    ) {
      dataToSave.parameterAdjustmentRecords =
        dataToSave.parameterAdjustmentRecords.map((rec) => ({
          ...rec,
          adjustedTempC:
            rec.adjustedTempC !== null && rec.adjustedTempC !== ""
              ? Number(rec.adjustedTempC)
              : null,
          adjustedTimeSec:
            rec.adjustedTimeSec !== null && rec.adjustedTimeSec !== ""
              ? Number(rec.adjustedTimeSec)
              : null,
          adjustedPressure:
            rec.adjustedPressure !== null && rec.adjustedPressure !== ""
              ? Number(rec.adjustedPressure)
              : null
        }));
    } else {
      dataToSave.parameterAdjustmentRecords = [];
    }

    const finalDataToSave = { ...dataToSave };
    // Include operatorData if provided and valid
    if (operatorData && operatorData.emp_id && operatorData.emp_reference_id) {
      finalDataToSave.operatorData = {
        emp_id: operatorData.emp_id,
        emp_eng_name: operatorData.emp_eng_name || "N/A",
        emp_face_photo: operatorData.emp_face_photo || null,
        emp_reference_id: operatorData.emp_reference_id
      };
    } else {
      console.log(
        "[API /api/scc/daily-testing] No complete operatorData provided, will not be saved."
      );
    }

    let record;
    if (_id) {
      record = await SCCDailyTesting.findByIdAndUpdate(_id, finalDataToSave, {
        // Use finalDataToSave
        new: true,
        runValidators: true
      });
      if (!record)
        return res
          .status(404)
          .json({ message: "Daily Testing record not found for update." });
    } else {
      const existing = await SCCDailyTesting.findOne({
        moNo: finalDataToSave.moNo,
        color: finalDataToSave.color,
        machineNo: finalDataToSave.machineNo,
        inspectionDate: finalDataToSave.inspectionDate
      });
      if (existing) {
        record = await SCCDailyTesting.findByIdAndUpdate(
          existing._id,
          finalDataToSave,
          { new: true, runValidators: true }
        );
      } else {
        record = new SCCDailyTesting(finalDataToSave); // Use finalDataToSave
        await record.save();
      }
    }
    res.status(201).json({
      message: "Daily Testing report saved successfully",
      data: record
    });
  } catch (error) {
    console.error(
      "[API /api/scc/daily-testing] Error saving Daily Testing report:",
      error
    );
    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "Duplicate entry. A record with this MO, Color, Machine No, and Date already exists.",
        error: error.message,
        errorCode: "DUPLICATE_KEY"
      });
    }
    res.status(500).json({
      message: "Failed to save Daily Testing report",
      error: error.message,
      details: error
    });
  }
};

export const getSccDailyTesting = async (req, res) => {
  try {
    const { moNo, color, machineNo, inspectionDate } = req.query;
    if (!moNo || !color || !machineNo || !inspectionDate) {
      return res.status(400).json({
        message: "MO No, Color, Machine No, and Inspection Date are required."
      });
    }
    const formattedDate = formatDateToMMDDYYYY(inspectionDate);
    const record = await SCCDailyTesting.findOne({
      moNo,
      color,
      machineNo,
      inspectionDate: formattedDate
    });
    if (!record) {
      return res
        .status(200)
        .json({ message: "DAILY_TESTING_RECORD_NOT_FOUND", data: null });
    }
    // No change needed here for GET, as it returns what's in DB. Frontend handles display.
    res.json(record);
  } catch (error) {
    console.error("Error fetching Daily Testing report:", error);
    res.status(500).json({
      message: "Failed to fetch Daily Testing report",
      error: error.message
    });
  }
};
// export const getDailyHtFuTest = async (req, res) => {
//     try {
//         const { inspectionDate, machineNo, moNo, color } = req.query;
//         const formattedDate = inspectionDate
//           ? formatDateToMMDDYYYY(inspectionDate)
//           : null;

//         if (!formattedDate || !machineNo) {
//           return res
//             .status(400)
//             .json({ message: "Inspection Date and Machine No are required." });
//         }

//         // Scenario 1: Fetch specific record if moNo and color are provided
//         if (moNo && color) {
//           const record = await DailyTestingHTFU.findOne({
//             inspectionDate: formattedDate,
//             machineNo,
//             moNo,
//             color
//           });
//           if (!record) {
//             return res
//               .status(200)
//               .json({ message: "DAILY_HTFU_RECORD_NOT_FOUND", data: null });
//           }
//           return res.json({ message: "RECORD_FOUND", data: record });
//         } else {
//           // Scenario 2: Fetch distinct MO/Color combinations for a given Date/MachineNo
//           const records = await DailyTestingHTFU.find(
//             { inspectionDate: formattedDate, machineNo },
//             "moNo color buyer buyerStyle" // Select only necessary fields
//           ).distinct("moNo"); // Or more complex aggregation if needed to pair MO with Color

//           // For simplicity, let's return distinct MOs, client can then pick color
//           // A better approach might be to return {moNo, color, buyer, buyerStyle} tuples
//           const distinctEntries = await DailyTestingHTFU.aggregate([
//             { $match: { inspectionDate: formattedDate, machineNo } },
//             {
//               $group: {
//                 _id: { moNo: "$moNo", color: "$color" },
//                 buyer: { $first: "$buyer" },
//                 buyerStyle: { $first: "$buyerStyle" },
//                 // If you need to know if a full record exists to load it directly
//                 docId: { $first: "$_id" }
//               }
//             },
//             {
//               $project: {
//                 _id: 0,
//                 moNo: "$_id.moNo",
//                 color: "$_id.color",
//                 buyer: "$buyer",
//                 buyerStyle: "$buyerStyle",
//                 docId: "$docId"
//               }
//             }
//           ]);

//           if (distinctEntries.length === 0) {
//             return res.status(200).json({
//               message: "NO_RECORDS_FOR_DATE_MACHINE",
//               data: []
//             });
//           }
//           // If only one unique MO/Color combo, frontend might auto-load it fully later
//           return res.json({
//             message: "MULTIPLE_MO_COLOR_FOUND",
//             data: distinctEntries // Array of {moNo, color, buyer, buyerStyle, docId}
//           });
//         }
//       } catch (error) {
//         console.error("Error fetching Daily HT/FU Test data:", error);
//         res.status(500).json({
//           message: "Failed to fetch Daily HT/FU Test data",
//           error: error.message
//         });
//       }
// };

// POST Endpoint to save/update Daily HT/FU Test data
// export const saveDailyHtFuTest = async (req, res) => {
//     try {
//         const {
//           _id, // ID of the main document if updating
//           inspectionDate,
//           machineNo,
//           moNo,
//           buyer,
//           buyerStyle,
//           color,
//           emp_id,
//           emp_kh_name,
//           emp_eng_name,
//           emp_dept_name,
//           emp_sect_name,
//           emp_job_title, // User details
//           baseReqTemp,
//           baseReqTime,
//           baseReqPressure, // Base specs from first output
//           currentInspection, // The data for the specific slot being submitted
//           stretchTestResult,
//           washingTestResult // Overall tests
//         } = req.body;

//         const formattedDate = formatDateToMMDDYYYY(inspectionDate);
//         if (!formattedDate || !machineNo || !moNo || !color || !currentInspection) {
//           return res
//             .status(400)
//             .json({ message: "Missing required fields for submission." });
//         }

//         const now = new Date();
//         const inspectionTime = `${String(now.getHours()).padStart(2, "0")}:${String(
//           now.getMinutes()
//         ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

//         const query = { inspectionDate: formattedDate, machineNo, moNo, color };
//         let record = await DailyTestingHTFU.findOne(query);

//         if (record) {
//           // Update existing record
//           record.baseReqTemp = baseReqTemp ?? record.baseReqTemp;
//           record.baseReqTime = baseReqTime ?? record.baseReqTime;
//           record.baseReqPressure = baseReqPressure ?? record.baseReqPressure;
//           record.emp_id = emp_id; // Update user details on each submission if needed
//           record.emp_kh_name = emp_kh_name;
//           record.emp_eng_name = emp_eng_name;
//           record.emp_dept_name = emp_dept_name;
//           record.emp_sect_name = emp_sect_name;
//           record.emp_job_title = emp_job_title;
//           record.inspectionTime = inspectionTime;

//           // Update or add the specific inspection slot
//           const slotIndex = record.inspections.findIndex(
//             (insp) => insp.timeSlotKey === currentInspection.timeSlotKey
//           );
//           if (slotIndex > -1) {
//             // Update existing slot, ensuring not to overwrite with nulls if not intended
//             record.inspections[slotIndex] = {
//               ...record.inspections[slotIndex], // keep old values not submitted
//               ...currentInspection, // new values for the slot
//               inspectionTimestamp: new Date()
//             };
//           } else {
//             record.inspections.push({
//               ...currentInspection,
//               inspectionTimestamp: new Date()
//             });
//           }
//           // Sort inspections by inspectionNo after modification
//           record.inspections.sort(
//             (a, b) => (a.inspectionNo || 0) - (b.inspectionNo || 0)
//           );

//           // Update stretch/washing tests only if they are being set and not already "Done"
//           // Or if they are 'Pending' and now being set to 'Pass'/'Reject'
//           if (
//             !record.isStretchWashingTestDone ||
//             record.stretchTestResult === "Pending"
//           ) {
//             if (stretchTestResult && stretchTestResult !== "Pending") {
//               record.stretchTestResult = stretchTestResult;
//             }
//           }
//           if (
//             !record.isStretchWashingTestDone ||
//             record.washingTestResult === "Pending"
//           ) {
//             if (washingTestResult && washingTestResult !== "Pending") {
//               record.washingTestResult = washingTestResult;
//             }
//           }
//           // Mark as done if both are now Pass/Reject
//           if (
//             (record.stretchTestResult === "Pass" ||
//               record.stretchTestResult === "Reject") &&
//             (record.washingTestResult === "Pass" ||
//               record.washingTestResult === "Reject")
//           ) {
//             record.isStretchWashingTestDone = true;
//           }
//         } else {
//           // Create new record
//           record = new DailyTestingHTFU({
//             inspectionDate: formattedDate,
//             machineNo,
//             moNo,
//             buyer,
//             buyerStyle,
//             color,
//             emp_id,
//             emp_kh_name,
//             emp_eng_name,
//             emp_dept_name,
//             emp_sect_name,
//             emp_job_title,
//             inspectionTime,
//             baseReqTemp,
//             baseReqTime,
//             baseReqPressure,
//             inspections: [
//               { ...currentInspection, inspectionTimestamp: new Date() }
//             ],
//             stretchTestResult:
//               stretchTestResult && stretchTestResult !== "Pending"
//                 ? stretchTestResult
//                 : "Pending",
//             washingTestResult:
//               washingTestResult && washingTestResult !== "Pending"
//                 ? washingTestResult
//                 : "Pending"
//           });
//           if (
//             (record.stretchTestResult === "Pass" ||
//               record.stretchTestResult === "Reject") &&
//             (record.washingTestResult === "Pass" ||
//               record.washingTestResult === "Reject")
//           ) {
//             record.isStretchWashingTestDone = true;
//           }
//         }

//         await record.save();
//         res.status(201).json({
//           message: "Daily HT/FU QC Test saved successfully",
//           data: record
//         });
//       } catch (error) {
//         console.error("Error saving Daily HT/FU QC Test:", error);
//         if (error.code === 11000) {
//           // Duplicate key error
//           return res.status(409).json({
//             message:
//               "A record with this Date, Machine No, MO No, and Color already exists. Submission failed.",
//             error: error.message,
//             errorCode: "DUPLICATE_KEY"
//           });
//         }
//         res.status(500).json({
//           message: "Failed to save Daily HT/FU QC Test",
//           error: error.message,
//           details: error // Mongoose validation errors might be here
//         });
//       }
// };

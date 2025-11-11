import {
  HTFirstOutput,
  FUFirstOutput,               
} from "../../MongoDB/dbConnectionController.js";
import  { formatDateToMMDDYYYY } from "../../../helpers/helperFunctions.js";

export const saveHtFirstOutput = async (req, res) => {
    try {
    const { _id, operatorData, ...dataToSave } = req.body;
    if (!dataToSave.machineNo) {
      return res.status(400).json({ message: "Machine No is required." });
    }
    dataToSave.inspectionDate = formatDateToMMDDYYYY(dataToSave.inspectionDate);
    dataToSave.remarks = dataToSave.remarks?.trim() || "NA";

    // Frontend now sends standardSpecification as an array of 1 or 2 objects
    // Each object should already have tempOffsetPlus and tempOffsetMinus calculated by SCCPage
    if (
      dataToSave.standardSpecification &&
      dataToSave.standardSpecification.length > 0
    ) {
      dataToSave.standardSpecification = dataToSave.standardSpecification.map(
        (spec) => ({
          ...spec, // type, method, timeSec, tempC, tempOffsetPlus, tempOffsetMinus, status
          remarks: spec.remarks?.trim() || "NA",
          pressure:
            spec.pressure !== null && spec.pressure !== undefined
              ? Number(spec.pressure)
              : null
        })
      );
    } else {
      // It's required to have at least one spec
      return res
        .status(400)
        .json({ message: "Standard Specification is required." });
    }

    // Include operatorData if provided
    const finalDataToSave = { ...dataToSave };
    if (operatorData && operatorData.emp_id && operatorData.emp_reference_id) {
      finalDataToSave.operatorData = {
        emp_id: operatorData.emp_id,
        emp_eng_name: operatorData.emp_eng_name || "N/A",
        emp_face_photo: operatorData.emp_face_photo || null,
        emp_reference_id: operatorData.emp_reference_id
      };
    } else {
      console.log(
        "[API /api/scc/ht-first-output] No complete operatorData provided or found, will not be saved."
      );
    }

    let record;
    if (_id) {
      record = await HTFirstOutput.findByIdAndUpdate(_id, finalDataToSave, {
        new: true,
        runValidators: true,
        upsert: false
      });
      if (!record)
        return res
          .status(404)
          .json({ message: "Record not found for update." });
    } else {
      const existing = await HTFirstOutput.findOne({
        moNo: finalDataToSave.moNo,
        color: finalDataToSave.color,
        inspectionDate: finalDataToSave.inspectionDate,
        machineNo: finalDataToSave.machineNo
      });
      if (existing) {
        record = await HTFirstOutput.findByIdAndUpdate(
          existing._id,
          finalDataToSave,
          { new: true, runValidators: true }
        );
      } else {
        record = new HTFirstOutput(finalDataToSave);
        await record.save();
      }
    }
    res
      .status(201)
      .json({ message: "HT First Output saved successfully", data: record });
  } catch (error) {
    console.error("Error saving HT First Output:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "Duplicate entry. A record with this MO, Color, Date, and Machine No already exists.",
        error: error.message,
        errorCode: "DUPLICATE_KEY"
      });
    }
    res.status(500).json({
      message: "Failed to save HT First Output",
      error: error.message,
      details: error
    });
  }
};

export const getHtFirstOutput = async (req, res) => {
    try {
    const { moNo, color, inspectionDate, machineNo } = req.query; // Added machineNo
    if (!moNo || !color || !inspectionDate || !machineNo) {
      // Added machineNo to validation
      return res.status(400).json({
        message: "MO No, Color, Inspection Date, and Machine No are required."
      }); // Updated message
    }
    const formattedDate = formatDateToMMDDYYYY(inspectionDate);
    const record = await HTFirstOutput.findOne({
      moNo,
      color,
      inspectionDate: formattedDate,
      machineNo // Added machineNo to query
    });
    if (!record) {
      return res
        .status(200)
        .json({ message: "HT_RECORD_NOT_FOUND", data: null });
    }
    res.json(record); // Backend returns full object, not nested under 'data'
  } catch (error) {
    console.error("Error fetching HT First Output:", error);
    res.status(500).json({
      message: "Failed to fetch HT First Output",
      error: error.message
    });
  }
};

// REVISED Endpoints for FUFirstOutput (similar changes as HT)
export const saveFuFirstOutput = async (req, res) => {
    try {
    const { _id, operatorData, ...dataToSave } = req.body;
    if (!dataToSave.machineNo) {
      return res.status(400).json({ message: "Machine No is required." });
    }
    dataToSave.inspectionDate = formatDateToMMDDYYYY(dataToSave.inspectionDate);
    dataToSave.remarks = dataToSave.remarks?.trim() || "NA";

    if (
      dataToSave.standardSpecification &&
      dataToSave.standardSpecification.length > 0
    ) {
      dataToSave.standardSpecification = dataToSave.standardSpecification.map(
        (spec) => ({
          ...spec,
          remarks: spec.remarks?.trim() || "NA",
          pressure:
            spec.pressure !== null && spec.pressure !== undefined
              ? Number(spec.pressure)
              : null
        })
      );
    } else {
      return res
        .status(400)
        .json({ message: "Standard Specification is required." });
    }

    const finalDataToSave = { ...dataToSave };
    if (operatorData && operatorData.emp_id && operatorData.emp_reference_id) {
      finalDataToSave.operatorData = {
        emp_id: operatorData.emp_id,
        emp_eng_name: operatorData.emp_eng_name || "N/A",
        emp_face_photo: operatorData.emp_face_photo || null,
        emp_reference_id: operatorData.emp_reference_id
      };
      //console.log("[API /api/scc/fu-first-output] OperatorData prepared for saving:", finalDataToSave.operatorData);
    } else {
      console.log(
        "[API /api/scc/fu-first-output] No complete operatorData provided, will not be saved."
      );
    }

    let record;
    if (_id) {
      record = await FUFirstOutput.findByIdAndUpdate(_id, finalDataToSave, {
        new: true,
        runValidators: true,
        upsert: false
      });
      if (!record)
        return res
          .status(404)
          .json({ message: "Record not found for update." });
    } else {
      const existing = await FUFirstOutput.findOne({
        moNo: finalDataToSave.moNo,
        color: finalDataToSave.color,
        inspectionDate: finalDataToSave.inspectionDate,
        machineNo: finalDataToSave.machineNo
      });
      if (existing) {
        record = await FUFirstOutput.findByIdAndUpdate(
          existing._id,
          finalDataToSave,
          { new: true, runValidators: true }
        );
      } else {
        record = new FUFirstOutput(finalDataToSave);
        await record.save();
      }
    }
    res
      .status(201)
      .json({ message: "FU First Output saved successfully", data: record });
  } catch (error) {
    console.error("Error saving FU First Output:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "Duplicate entry. A record with this MO, Color, Date, and Machine No already exists.",
        error: error.message,
        errorCode: "DUPLICATE_KEY"
      });
    }
    res.status(500).json({
      message: "Failed to save FU First Output",
      error: error.message,
      details: error
    });
  }
};

export const getFuFirstOutput = async (req, res) => {
    try {
    const { moNo, color, inspectionDate, machineNo } = req.query; // Added machineNo
    if (!moNo || !color || !inspectionDate || !machineNo) {
      // Added machineNo to validation
      return res.status(400).json({
        message: "MO No, Color, Inspection Date, and Machine No are required."
      }); // Updated message
    }
    const formattedDate = formatDateToMMDDYYYY(inspectionDate);
    const record = await FUFirstOutput.findOne({
      moNo,
      color,
      inspectionDate: formattedDate,
      machineNo // Added machineNo to query
    });
    if (!record) {
      return res
        .status(200)
        .json({ message: "FU_RECORD_NOT_FOUND", data: null });
    }
    res.json(record); // Backend returns full object
  } catch (error) {
    console.error("Error fetching FU First Output:", error);
    res.status(500).json({
      message: "Failed to fetch FU First Output",
      error: error.message
    });
  }
};

/* ------------------------------
   End Points - SCC HT/FU - Daily Testing
------------------------------ */

export const getFirstOutput = async (req, res) => {
    try {
    const { moNo, color } = req.query;
    if (!moNo || !color) {
      return res.status(400).json({ message: "MO No and Color are required." });
    }
    //const formattedDate = formatDateToMMDDYYYY(inspectionDate);

    let specs = null;
    const processRecord = (record) => {
      if (record && record.standardSpecification) {
        const secondHeatSpec = record.standardSpecification.find(
          (s) =>
            s.type === "2nd heat" &&
            s.status === "Pass" &&
            s.timeSec &&
            s.tempC &&
            s.pressure !== null
        );
        const firstSpec = record.standardSpecification.find(
          (s) =>
            s.type === "first" &&
            s.status === "Pass" &&
            s.timeSec &&
            s.tempC &&
            s.pressure !== null
        );

        // Prioritize 2nd heat spec if it's 'Pass' and valid
        if (secondHeatSpec) {
          return {
            tempC: secondHeatSpec.tempC,
            timeSec: secondHeatSpec.timeSec,
            pressure: secondHeatSpec.pressure
          };
        } else if (firstSpec) {
          // Fallback to first spec if it's 'Pass' and valid
          return {
            tempC: firstSpec.tempC,
            timeSec: firstSpec.timeSec,
            pressure: firstSpec.pressure
          };
        }
        // If no 'Pass' specs, try any '2nd heat' then any 'first'
        const anySecondHeatSpec = record.standardSpecification.find(
          (s) =>
            s.type === "2nd heat" && s.timeSec && s.tempC && s.pressure !== null
        );
        if (anySecondHeatSpec) {
          return {
            tempC: anySecondHeatSpec.tempC,
            timeSec: anySecondHeatSpec.timeSec,
            pressure: anySecondHeatSpec.pressure
          };
        }
        const anyFirstSpec = record.standardSpecification.find(
          (s) =>
            s.type === "first" && s.timeSec && s.tempC && s.pressure !== null
        );
        if (anyFirstSpec) {
          return {
            tempC: anyFirstSpec.tempC,
            timeSec: anyFirstSpec.timeSec,
            pressure: anyFirstSpec.pressure
          };
        }
      }
      return null;
    };

    // Try HT First Output
    const htRecord = await HTFirstOutput.findOne({
      moNo,
      color
    }).lean();
    specs = processRecord(htRecord);

    // If not found in HT, try FU First Output
    if (!specs) {
      const fuRecord = await FUFirstOutput.findOne({
        moNo,
        color
      }).lean();
      specs = processRecord(fuRecord);
    }

    if (!specs) {
      return res.status(200).json({ message: "SPECS_NOT_FOUND", data: null });
    }
    res.json({ data: specs });
  } catch (error) {
    console.error("Error fetching first output specs:", error);
    res.status(500).json({
      message: "Failed to fetch first output specifications",
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

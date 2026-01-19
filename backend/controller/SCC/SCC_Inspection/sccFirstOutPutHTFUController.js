import {
  HTFirstOutput,
  FUFirstOutput,               
} from "../../MongoDB/dbConnectionController.js";
import  { formatDateToMMDDYYYY } from "../../../helpers/helperFunctions.js";

export const saveHtFirstOutput = async (req, res) => {
    try {
    const { _id, operatorData, ...dataToSave } = req.body;
    // --- Sanitize Image Paths ---
    if (
      dataToSave.referenceSampleImage &&
      typeof dataToSave.referenceSampleImage === "string" &&
      dataToSave.referenceSampleImage.startsWith("undefined/")
    ) {
      dataToSave.referenceSampleImage = dataToSave.referenceSampleImage.replace(
        "undefined",
        ""
      );
    }
    if (
      dataToSave.afterWashImage &&
      typeof dataToSave.afterWashImage === "string" &&
      dataToSave.afterWashImage.startsWith("undefined/")
    ) {
      dataToSave.afterWashImage = dataToSave.afterWashImage.replace(
        "undefined",
        ""
      );
    }

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
    if (
      dataToSave.referenceSampleImage &&
      typeof dataToSave.referenceSampleImage === "string" &&
      dataToSave.referenceSampleImage.startsWith("undefined/")
    ) {
      dataToSave.referenceSampleImage = dataToSave.referenceSampleImage.replace(
        "undefined",
        ""
      );
    }
    if (
      dataToSave.afterWashImage &&
      typeof dataToSave.afterWashImage === "string" &&
      dataToSave.afterWashImage.startsWith("undefined/")
    ) {
      dataToSave.afterWashImage = dataToSave.afterWashImage.replace(
        "undefined",
        ""
      );
    }

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

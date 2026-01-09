import { QCRovingPairing } from "../../MongoDB/dbConnectionController.js";
import {
  generateUniqueFilename,
  saveCompressedImage
} from "../../../Utils/imageCompression.js";
import { API_BASE_URL } from "../../../../config.js";

// Upload images for defects
export const uploadParingimagers = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No images provided" });
    }

    const uploadedImages = [];

    for (const file of req.files) {
      const filename = generateUniqueFilename(file.originalname, "defect");
      const imagePath = await saveCompressedImage(
        file.buffer,
        filename,
        "defect"
      );
      const imageUrl = `${API_BASE_URL}${imagePath}`;
      uploadedImages.push(imageUrl);
    }

    res.json({ success: true, images: uploadedImages });
  } catch (error) {
    console.error("Error uploading defect images:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to upload images" });
  }
};

// Upload images for measurements
export const uploadMeasurementImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No images provided" });
    }

    const uploadedImages = [];

    for (const file of req.files) {
      const filename = generateUniqueFilename(file.originalname, "measurement");
      const imagePath = await saveCompressedImage(
        file.buffer,
        filename,
        "measurement"
      );
      const imageUrl = `${API_BASE_URL}${imagePath}`;
      uploadedImages.push(imageUrl);
    }

    res.json({ success: true, images: uploadedImages });
  } catch (error) {
    console.error("Error uploading measurement images:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to upload images" });
  }
};

// Upload images for accessories
export const uploadAccessoryImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No images provided" });
    }

    const uploadedImages = [];

    for (const file of req.files) {
      const filename = generateUniqueFilename(file.originalname, "accessory");
      const imagePath = await saveCompressedImage(
        file.buffer,
        filename,
        "accessory"
      );
      const imageUrl = `${API_BASE_URL}${imagePath}`;
      uploadedImages.push(imageUrl);
    }

    res.json({ success: true, images: uploadedImages });
  } catch (error) {
    console.error("Error uploading accessory images:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to upload images" });
  }
};

// Delete image endpoint
export const deleteImage = async (req, res) => {
  try {
    const { imagePath } = req.body;

    if (!imagePath) {
      return res
        .status(400)
        .json({ success: false, message: "Image path is required" });
    }

    deleteImage(imagePath);
    res.json({ success: true, message: "Image deleted successfully" });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ success: false, message: "Failed to delete image" });
  }
};

// Get roving pairing data with images
export const getRovingPairingData = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await QCRovingPairing.findById(id);

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.json(record);
  } catch (error) {
    console.error("Error fetching roving pairing data:", error);
    res.status(500).json({ message: "Failed to fetch data" });
  }
};

// Save roving pairing data with images
export const saveRovingPairingData = async (req, res) => {
  try {
    const pairingData = new QCRovingPairing(req.body);
    const savedData = await pairingData.save();

    res.status(201).json({
      success: true,
      message: "Roving pairing data saved successfully",
      data: savedData
    });
  } catch (error) {
    console.error("Error saving roving pairing data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save data",
      error: error.message
    });
  }
};

export const saveQCRovingPairingData = async (req, res) => {
  try {
    const {
      inspection_date,
      moNo,
      lineNo,
      report_name,
      emp_id,
      eng_name,
      operationNo,
      operationName,
      operationName_kh,
      pairingDataItem
    } = req.body;

    // --- Basic Validation ---
    if (!inspection_date || !moNo || !lineNo || !pairingDataItem || !emp_id) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    if (
      typeof pairingDataItem !== "object" ||
      !pairingDataItem.inspection_rep_name
    ) {
      return res.status(400).json({
        message: "pairingDataItem is malformed or missing inspection_rep_name."
      });
    }

    // ---------------------------------------------------------------------

    if (
      pairingDataItem.accessoryComplete === "No" &&
      !Array.isArray(pairingDataItem.accessoryIssues)
    ) {
      return res.status(400).json({
        message:
          "Accessory status is 'No' but the list of accessory issues is missing or not an array."
      });
    }
    // If accessory is complete, ensure the issues array is empty.
    if (pairingDataItem.accessoryComplete === "Yes") {
      pairingDataItem.accessoryIssues = [];
    }

    // --- NEW: Sanitize image arrays to ensure they are saved ---
    // Sanitize accessory issues images
    if (pairingDataItem.accessoryIssues) {
      pairingDataItem.accessoryIssues.forEach((issue) => {
        issue.images = issue.images || [];
      });
    }
    // Sanitize measurement images
    if (pairingDataItem.measurementData) {
      pairingDataItem.measurementData.forEach((part) => {
        part.measurements.forEach((m) => (m.images = m.images || []));
      });
    }
    // Sanitize defect images
    if (pairingDataItem.defectSummary?.defectDetails) {
      pairingDataItem.defectSummary.defectDetails.forEach((part) => {
        part.defectsForPart.forEach((dfp) => {
          dfp.defects.forEach((d) => (d.images = d.images || []));
        });
      });
    }
    // ---------------------------------------------------------------------

    //Add the current server timestamp to the object from the frontend
    pairingDataItem.inspectionTime = new Date();

    // --- Find or Create Document ---
    let doc = await QCRovingPairing.findOne({ inspection_date, moNo, lineNo });

    if (doc) {
      // Document exists, update it
      const existingRepIndex = doc.pairingData.findIndex(
        (rep) => rep.inspection_rep_name === pairingDataItem.inspection_rep_name
      );

      if (existingRepIndex !== -1) {
        // This inspection repetition already exists, so we overwrite it.
        doc.pairingData[existingRepIndex] = pairingDataItem;
      } else {
        // This is a new inspection repetition for this document, add it.
        doc.pairingData.push(pairingDataItem);
      }

      // Sort pairingData by inspection_rep_name (e.g., "1st", "2nd")
      doc.pairingData.sort((a, b) => {
        const numA = parseInt(a.inspection_rep_name, 10);
        const numB = parseInt(b.inspection_rep_name, 10);
        return numA - numB;
      });

      await doc.save();
      res.status(200).json({
        message: "QC Roving Pairing data updated successfully.",
        data: doc
      });
    } else {
      // Document does not exist, create a new one
      const lastDoc = await QCRovingPairing.findOne().sort({ pairing_id: -1 });
      const newId =
        lastDoc && typeof lastDoc.pairing_id === "number"
          ? lastDoc.pairing_id + 1
          : 1;

      const newDoc = new QCRovingPairing({
        pairing_id: newId,
        report_name,
        inspection_date,
        moNo,
        lineNo,
        emp_id,
        eng_name,
        operationNo,
        operationName,
        operationName_kh,
        pairingData: [pairingDataItem] // Start with the first item
      });

      await newDoc.save();
      res.status(201).json({
        message: "New QC Roving Pairing record created successfully.",
        data: newDoc
      });
    }
  } catch (error) {
    console.error("Error saving QC Roving Pairing data:", error);
    res.status(500).json({
      message: "Failed to save QC Roving Pairing data.",
      error: error.message
    });
  }
};

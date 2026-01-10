import {
  QCRovingPairing,                
} from "../../MongoDB/dbConnectionController.js";
import fsPromises from "fs/promises";
import path from "path";
import { __backendDir } from "../../../Config/appConfig.js";

function getServerBaseUrl(req) {
  const protocol = req.protocol || "http";
  const host = req.get("host") || "localhost:3000";
  return `${protocol}://${host}`;
}

// Upload images for defects
export const uploadParingimagers = async (req, res) => {
  try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: 'No images provided' });
      }
  
      const serverBaseUrl = getServerBaseUrl(req);
      const uploadDir = path.join(__backendDir, "public", "storage", "roving_pairing", "defect");
      await fsPromises.mkdir(uploadDir, { recursive: true });

      const uploadedImages = [];
      
      for (const file of req.files) {
        const fileExtension = path.extname(file.originalname) || ".jpg";
        const newFilename = `defect-${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;
        const fullFilePath = path.join(uploadDir, newFilename);
        await fsPromises.writeFile(fullFilePath, file.buffer);
        const imageUrl = `${serverBaseUrl}/storage/roving_pairing/defect/${newFilename}`;
        uploadedImages.push(imageUrl);
      }
  
      res.json({ success: true, images: uploadedImages });
    } catch (error) {
      console.error('Error uploading defect images:', error);
      res.status(500).json({ success: false, message: 'Failed to upload images' });
    }
};

// Upload images for measurements
export const uploadMeasurementImages = async (req, res) => {
   try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No images provided' });
    }

    const serverBaseUrl = getServerBaseUrl(req);
    const uploadDir = path.join(__backendDir, "public", "storage", "roving_pairing", "measurement");
    await fsPromises.mkdir(uploadDir, { recursive: true });

    const uploadedImages = [];
    
    for (const file of req.files) {
      const fileExtension = path.extname(file.originalname) || ".jpg";
      const newFilename = `measurement-${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;
      const fullFilePath = path.join(uploadDir, newFilename);
      await fsPromises.writeFile(fullFilePath, file.buffer);
      const imageUrl = `${serverBaseUrl}/storage/roving_pairing/measurement/${newFilename}`;
      uploadedImages.push(imageUrl);
    }

    res.json({ success: true, images: uploadedImages });
  } catch (error) {
    console.error('Error uploading measurement images:', error);
    res.status(500).json({ success: false, message: 'Failed to upload images' });
  }
};

// Upload images for accessories
export const uploadAccessoryImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No images provided' });
    }

    const serverBaseUrl = getServerBaseUrl(req);
    const uploadDir = path.join(__backendDir, "public", "storage", "roving_pairing", "accessory");
    await fsPromises.mkdir(uploadDir, { recursive: true });

    const uploadedImages = [];
    
    for (const file of req.files) {
      const fileExtension = path.extname(file.originalname) || ".jpg";
      const newFilename = `accessory-${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;
      const fullFilePath = path.join(uploadDir, newFilename);
      await fsPromises.writeFile(fullFilePath, file.buffer);
      const imageUrl = `${serverBaseUrl}/storage/roving_pairing/accessory/${newFilename}`;
      uploadedImages.push(imageUrl);
    }

    res.json({ success: true, images: uploadedImages });
  } catch (error) {
    console.error('Error uploading accessory images:', error);
    res.status(500).json({ success: false, message: 'Failed to upload images' });
  }
};

// Delete image endpoint
export const deleteImage = async (req, res) => {
  try {
      const { imagePath } = req.body;
      
      if (!imagePath) {
        return res.status(400).json({ success: false, message: 'Image path is required' });
      }
  
      deleteImage(imagePath);
      res.json({ success: true, message: 'Image deleted successfully' });
    } catch (error) {
      console.error('Error deleting image:', error);
      res.status(500).json({ success: false, message: 'Failed to delete image' });
    }
};

// Get roving pairing data with images
export const getRovingPairingData = async (req, res) => {
   try {
      const { id } = req.params;
      const record = await QCRovingPairing.findById(id);
      
      if (!record) {
        return res.status(404).json({ message: 'Record not found' });
      }
  
      res.json(record);
    } catch (error) {
      console.error('Error fetching roving pairing data:', error);
      res.status(500).json({ message: 'Failed to fetch data' });
    }
};

// Save roving pairing data with images
export const saveRovingPairingData = async (req, res) => {
  try {
      const pairingData = new QCRovingPairing(req.body);
      const savedData = await pairingData.save();
      
      res.status(201).json({ 
        success: true, 
        message: 'Roving pairing data saved successfully',
        data: savedData 
      });
    } catch (error) {
      console.error('Error saving roving pairing data:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to save data',
        error: error.message 
      });
    }
};

// Save QC Roving Pairing data (existing endpoint)(old)
// export const saveQCRovingPairingData = async (req, res) => {
//   try {
//       // Generate unique pairing_id
//       const lastRecord = await QCRovingPairing.findOne().sort({ pairing_id: -1 });
//       const newPairingId = lastRecord ? lastRecord.pairing_id + 1 : 1;
      
//       const pairingData = {
//         ...req.body,
//         pairing_id: newPairingId,
//         pairingData: [req.body.pairingDataItem] // Wrap single item in array
//       };
      
//       const newRecord = new QCRovingPairing(pairingData);
//       const savedData = await newRecord.save();
      
//       res.status(201).json({ 
//         success: true, 
//         message: 'QC Roving Pairing data saved successfully',
//         data: savedData 
//       });
//     } catch (error) {
//       console.error('Error saving QC Roving Pairing data:', error);
//       res.status(500).json({ 
//         success: false, 
//         message: 'Failed to save QC Roving Pairing data',
//         error: error.message 
//       });
//     }
// };

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
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    if (
      typeof pairingDataItem !== "object" ||
      !pairingDataItem.inspection_rep_name
    ) {
      return res.status(400).json({
        success: false,
        message: "pairingDataItem is malformed or missing inspection_rep_name."
      });
    }

    // Add timestamp
    pairingDataItem.inspectionTime = new Date();

    // --- Find or Create Document ---
    let doc = await QCRovingPairing.findOne({ inspection_date, moNo, lineNo });

    if (doc) {
      // Document exists, update it
      const existingRepIndex = doc.pairingData.findIndex(
        (rep) => rep.inspection_rep_name === pairingDataItem.inspection_rep_name
      );

      if (existingRepIndex !== -1) {
        doc.pairingData[existingRepIndex] = pairingDataItem;
      } else {
        doc.pairingData.push(pairingDataItem);
      }

      const savedDoc = await doc.save();
      
      res.status(200).json({
        success: true,
        message: "QC Roving Pairing data updated successfully.",
        data: savedDoc
      });
    } else {
      // Create new document - generate pairing_id
      const lastDoc = await QCRovingPairing.findOne().sort({ pairing_id: -1 });
      const newPairingId = lastDoc ? lastDoc.pairing_id + 1 : 1;
      
      const newDoc = new QCRovingPairing({
        pairing_id: newPairingId,
        report_name,
        inspection_date,
        moNo,
        lineNo,
        emp_id,
        eng_name,
        operationNo,
        operationName,
        operationName_kh,
        pairingData: [pairingDataItem]
      });

      const savedDoc = await newDoc.save();
      
      res.status(201).json({
        success: true,
        message: "New QC Roving Pairing record created successfully.",
        data: savedDoc
      });
    }
  } catch (error) {
    console.error("Error saving QC Roving Pairing data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save QC Roving Pairing data.",
      error: error.message
    });
  }
};

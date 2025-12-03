import {
AfterIroning, 
QCWashing,
ymProdConnection,
AQLChart,
QCWashingFirstOutput,              
} from "../../MongoDB/dbConnectionController.js";
import { getBuyerFromMoNumber, getAqlLevelForBuyer, calculateOverallSummary} from "../../../helpers/helperFunctions.js";
import fs from "fs";
import { 
  __backendDir, 
  // __dirname 
} from "../../../Config/appConfig.js";
import path from "path";

function getServerBaseUrl(req) {
  const protocol = req.protocol || "http";
  const host = req.get("host") || "localhost:5001";
  return `${protocol}://${host}`;
}


function groupCheckpointData(checkpointInspectionData) {
  const mainCheckpoints = new Map();
  checkpointInspectionData.forEach(item => {
    if (item.type === 'main') {
      mainCheckpoints.set(item.checkpointId, { ...item, subPoints: [] });
    }
  });
  checkpointInspectionData.forEach(item => {
    if (item.type === 'sub') {
      const mainCheckpoint = mainCheckpoints.get(item.checkpointId);
      if (mainCheckpoint) {
        mainCheckpoint.subPoints.push(item);
      }
    }
  });
  return Array.from(mainCheckpoints.values());
}

export const saveqcwashingFirstOutput = async (req, res) => {
  try {
      const { orderNo } = req.body;
  
      if (!orderNo) {
        return res.status(400).json({
          success: false,
          message: "Order No is required to fetch first output details."
        });
      }
  
      // 1. Find the latest 'First Output' record to get the quantity.
      // We sort by createdAt descending and take the first one.
      const firstOutputRecord = await QCWashingFirstOutput.findOne()
        .sort({ createdAt: -1 })
        .lean();
  
      if (!firstOutputRecord) {
        return res.status(404).json({
          success: false,
          message:
            "No 'First Output' quantity has been set in the admin settings."
        });
      }
  
      const sampleSizeNum = parseInt(firstOutputRecord.quantity, 10);
  
      // 2. Get the buyer and AQL level based on the provided orderNo.
      const buyer = await getBuyerFromMoNumber(orderNo);
      const aqlLevel = getAqlLevelForBuyer(buyer);
  
      // 3. Find the AQL chart document based on the lot size (quantity).
      const aqlChart = await AQLChart.findOne({
        Type: "General",
        Level: "II",
        SampleSize: { $gte: sampleSizeNum }
      })
        .sort({ SampleSize: 1 })
        .lean();
  
      if (!aqlChart) {
        return res.status(404).json({
          success: false,
          message: "No AQL chart found for the given lot size."
        });
      }
  
      // 4. Find the specific AQL entry for the buyer's AQL level.
      const aqlEntry = aqlChart.AQL.find((aql) => aql.level === aqlLevel);
  
      if (!aqlEntry) {
        return res.status(404).json({
          success: false,
          message: `AQL level ${aqlLevel} not found for the matching chart.`
        });
      }
  
      // 5. Respond with the data in the format expected by the frontend.
      res.json({
        success: true,
        checkedQty: firstOutputRecord.quantity,
        aqlData: {
          sampleSize: aqlChart.SampleSize,
          acceptedDefect: aqlEntry.AcceptDefect,
          rejectedDefect: aqlEntry.RejectDefect,
          levelUsed: aqlLevel
        }
      });
    } catch (error) {
      console.error("Error fetching first output details:", error);
      res.status(500).json({
        success: false,
        message: "Server error while fetching first output details."
      });
    }
};

export const checkAfterIroningSubmittedStyle = async (req, res) => {
  try {
    const { orderNo, color } = req.body;

    if (!orderNo || !color) {
      return res.status(400).json({
        success: false,
        message: "Order number and color are required"
      });
    }

    // Check for existing submitted records with same style but different color
    const existingSubmittedRecord = await AfterIroning.findOne({
      orderNo: orderNo,
      color: { $ne: color },
      status: "submitted"
    });

    if (existingSubmittedRecord) {
      return res.json({
        success: false,
        exists: true,
        message: `Style ${orderNo} already has a submitted record with color "${existingSubmittedRecord.color}"`,
        existingColor: existingSubmittedRecord.color,
        existingRecordId: existingSubmittedRecord._id,
        submittedAt: existingSubmittedRecord.submittedAt
      });
    }

    res.json({
      success: true,
      exists: false,
      message: "No conflicting submitted records found"
    });

  } catch (error) {
    console.error("Error checking submitted style-color:", error);
    res.status(500).json({
      success: false,
      message: "Server error while checking submitted records"
    });
  }
};

export const checkQCWashingRecord = async (req, res) => {
  try {
    const { orderNo, reportType } = req.body;

    if (!orderNo) {
      return res.status(400).json({
        success: false,
        message: "Order No is required"
      });
    }

    // Build query to find matching QC Washing record
    const query = {
      orderNo: orderNo,
      status: { $in: ['submitted', 'approved'] } // Only check completed records
    };

    // Add report type filter if provided
    if (reportType) {
      query.reportType = reportType;
    }

    // Find the most recent matching record
    const qcWashingRecord = await QCWashing.findOne(query)
      .sort({ createdAt: -1 })
      .lean();

    if (qcWashingRecord) {
      res.json({
        success: true,
        exists: true,
        message: "QC Washing record found",
        record: {
          id: qcWashingRecord._id,
          orderNo: qcWashingRecord.orderNo,
          color: qcWashingRecord.color,
          factoryName: qcWashingRecord.factoryName,
          reportType: qcWashingRecord.reportType,
          status: qcWashingRecord.status,
          overallFinalResult: qcWashingRecord.overallFinalResult,
          submittedAt: qcWashingRecord.submittedAt,
          createdAt: qcWashingRecord.createdAt
        }
      });
    } else {
      res.json({
        success: false,
        exists: false,
        message: "No QC Washing record found"
      });
    }

  } catch (error) {
    console.error("Error checking QC Washing record:", error);
    res.status(500).json({
      success: false,
      message: "Server error while checking QC Washing record",
      error: error.message
    });
  }
};

export const getAfterIroningMeasurementData = async (req, res) => {
  try {
        const { orderNo } = req.params;
  
        if (!orderNo) {
          return res.status(400).json({
            success: false,
            message: "Order number is required",
            hasMeasurement: false
          });
        }
  
        const collection = ymProdConnection.db.collection("dt_orders");
  
        // Find the order first
        const order = await collection.findOne({
          $or: [{ Order_No: orderNo }, { Style: orderNo }]
        });
  
        if (!order) {
          return res.json({
            success: true,
            hasMeasurement: false,
            message: "Order not found",
            debug: {
              orderNo: orderNo,
              foundRecord: false
            }
          });
        }
  
        // Check if measurement specs exist and have valid data
        const hasBeforeWashSpecs =
          Array.isArray(order.BeforeWashSpecs) &&
          order.BeforeWashSpecs.length > 0 &&
          order.BeforeWashSpecs.some(
            (spec) =>
              spec.MeasurementPointEngName &&
              spec.MeasurementPointEngName.trim() !== ""
          );
  
        const hasAfterWashSpecs =
          Array.isArray(order.AfterWashSpecs) &&
          order.AfterWashSpecs.length > 0 &&
          order.AfterWashSpecs.some(
            (spec) =>
              spec.MeasurementPointEngName &&
              spec.MeasurementPointEngName.trim() !== ""
          );
  
        const hasMeasurement = hasBeforeWashSpecs || hasAfterWashSpecs;
  
        res.json({
          success: true,
          hasMeasurement: hasMeasurement,
          message: hasMeasurement
            ? "Measurement details found"
            : "No measurement details found for this order",
          debug: {
            orderNo: orderNo,
            foundRecord: true,
            measurementStructure: {
              hasBeforeWashSpecs: hasBeforeWashSpecs,
              hasAfterWashSpecs: hasAfterWashSpecs,
              beforeWashSpecsCount: order.BeforeWashSpecs?.length || 0,
              afterWashSpecsCount: order.AfterWashSpecs?.length || 0,
              orderData: {
                Order_No: order.Order_No,
                Style: order.Style
              }
            }
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Server error while checking measurement details",
          hasMeasurement: false,
          error: error.message
        });
      }
};

export const findAfterIroningExistingRecord = async (req, res) => {
  try {
      const {
        orderNo,
        date,
        color,
        factoryName,
        reportType,
        before_after_wash,
        ironingType, // Added for After Ironing
        inspectorId
      } = req.body;
  
      const dateValue = date
        ? new Date(date.length === 10 ? date + "T00:00:00.000Z" : date)
        : undefined;
  
      // Build the query to match core identifying fields INCLUDING inspector
      const query = {
        orderNo,
        date: dateValue,
        color,
        factoryName,
        reportType,
        before_after_wash,
        ironingType,
        "inspector.empId": inspectorId 
      };
  
      Object.keys(query).forEach(
        (key) =>
          (query[key] === undefined || query[key] === "") && delete query[key]
      );
  
      const record = await AfterIroning.findOne(query);
  
      if (record) {
        res.json({ success: true, exists: true, record });
      } else {
        res.json({ success: true, exists: false });
      }
    } catch (err) {
      console.error("Find-existing After Ironing error:", err);
      res.status(500).json({ success: false, message: "Server error." });
    }
};

export const checkAfterIroningSubmittedRecord = async (req, res) => {
  try {
    const { orderNo, color } = req.body;

    if (!orderNo || !color) {
      return res.status(400).json({ success: false, message: "Order number and color are required." });
    }

    // Find the most recent submitted record for this order and color
    const record = await AfterIroning.findOne({
      orderNo: orderNo,
      color: color,
      status: 'submitted'
    }).sort({ submittedAt: -1 });

    if (record) {
      res.json({ success: true, exists: true, record });
    } else {
      res.json({ success: true, exists: false });
    }
  } catch (err) {
    console.error("Error checking for submitted After Ironing record:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error while checking for submitted records." 
    });
  }
};

export const saveAfterIroningOrderData = async (req, res) => {
  try {
    const { formData, userId, savedAt } = req.body;

    if (!formData || !formData.orderNo) {
      return res
        .status(400)
        .json({ success: false, message: "Order No is required." });
    }

    const dateValue = formData.date
      ? new Date(
          formData.date.length === 10
            ? formData.date + "T00:00:00.000Z"
            : formData.date
        )
      : undefined;

    // Clean up defectDetails to prevent casting errors on save
    if (formData.defectDetails && Array.isArray(formData.defectDetails.defectsByPc)) {
      formData.defectDetails.defectsByPc.forEach(pc => {
        if (Array.isArray(pc.pcDefects)) {
          pc.pcDefects.forEach(defect => {
            if (defect.defectImages && defect.defectImages.some(img => typeof img === 'object')) {
              defect.defectImages = defect.defectImages.filter(img => typeof img === 'string' && (img.startsWith('http') || img.startsWith('/storage')));
            }
          });
        }
      });
    }

    // Clean up inspectionDetails to prevent casting errors on save
    if (formData.inspectionDetails && Array.isArray(formData.inspectionDetails.checkpointInspectionData)) {
      formData.inspectionDetails.checkpointInspectionData.forEach(checkpoint => {
        // Clean up main checkpoint images
        if (checkpoint.comparisonImages && checkpoint.comparisonImages.some(img => typeof img === 'object')) {
          checkpoint.comparisonImages = checkpoint.comparisonImages.filter(img => typeof img === 'string' && (img.startsWith('http') || img.startsWith('/storage')));
        }
        // Clean up sub-point images
        if (Array.isArray(checkpoint.subPoints)) {
          checkpoint.subPoints.forEach(subPoint => {
            if (subPoint.comparisonImages && subPoint.comparisonImages.some(img => typeof img === 'object')) {
              subPoint.comparisonImages = subPoint.comparisonImages.filter(img => typeof img === 'string' && (img.startsWith('http') || img.startsWith('/storage')));
            }
          });
        }
      });
    }

    let record;

    // CRITICAL FIX: If _id is provided, update that specific record
    if (formData._id) {
      console.log('Updating existing record with ID:', formData._id);
      record = await AfterIroning.findById(formData._id);
      
      if (record) {
        // CRITICAL FIX: Ensure measurementDetails is an object, not an array.
        // The frontend sometimes sends an empty array `[]` which causes a cast error.
        const measurementDetailsUpdate = (formData.measurementDetails && !Array.isArray(formData.measurementDetails))
          ? formData.measurementDetails
          : record.measurementDetails; // Preserve existing if new is invalid/empty array

        // Update existing record with new data, preserving measurementDetails
        const updateData = {
          ...formData,
          // Use the sanitized measurementDetails
          measurementDetails: measurementDetailsUpdate,
          inspector: { empId: userId },
          userId: userId,
          savedAt: savedAt,
          status: record.status === "submitted" ? "submitted" : "processing"
        };
        
        // Remove _id from update data to avoid conflicts
        delete updateData._id;
        
        Object.assign(record, updateData);
        await record.save();
        
        console.log('Successfully updated existing record');
        return res.json({ success: true, id: record._id });
      } else {
        console.log('Record with provided _id not found, creating new record');
      }
    }

    // If no _id provided or record not found, try to find existing record
    if (!record) {
      // Build the query for uniqueness - but make it more flexible
      const query = {
        orderNo: formData.orderNo,
        color: formData.color,
        before_after_wash: formData.before_after_wash,
        "inspector.empId": userId,
        // status: { $ne: "submitted" } // Don't match submitted records
      };

      // Only add date to query if it's provided and valid
      if (dateValue) {
        query.date = dateValue;
      }

      // Only add these fields to query if they're provided
      if (formData.factoryName) query.factoryName = formData.factoryName;
      if (formData.reportType) query.reportType = formData.reportType;
      if (formData.ironingType) query.ironingType = formData.ironingType;

      console.log('Searching for existing record with query:', query);
      record = await AfterIroning.findOne(query);
    }

    if (!record) {
      // Create new record
      console.log('Creating new record');
      record = new AfterIroning({
        ...formData,
        date: dateValue,
        inspector: { empId: userId },
        colorOrderQty: formData.colorOrderQty,
        userId,
        savedAt,
       status: "processing"
      });
    } else {
      // Update existing record
      console.log('Updating found record:', record._id);
      Object.assign(record, {
        ...formData,
        date: dateValue,
        inspector: { empId: userId },
        userId: userId,
        savedAt: savedAt,
        status: record.status === "submitted" ? "submitted" : "processing",
        // CRITICAL FIX: Preserve existing measurementDetails if not provided or if it's an invalid empty array
        measurementDetails: (formData.measurementDetails && !Array.isArray(formData.measurementDetails))
          ? formData.measurementDetails
          : record.measurementDetails
      });
    }

    await record.save();
    console.log('Record saved successfully:', record._id);

    res.json({ success: true, id: record._id });
  } catch (err) {
    console.error("OrderData-save error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while saving order data."
    });
  }
};

export const saveAfterIroningInspectionData = async (req, res) => {
  try {
    const { recordId } = req.body;
    const inspectionData = JSON.parse(req.body.inspectionData || "[]");
    const processData = JSON.parse(req.body.processData || "{}");
    const defectData = JSON.parse(req.body.defectData || "[]");
    const checkpointInspectionData = JSON.parse(req.body.checkpointInspectionData || "[]");
    const timeCoolEnabled = JSON.parse(req.body.timeCoolEnabled || "false");
    const timeHotEnabled = JSON.parse(req.body.timeHotEnabled || "false");

    if (!recordId) {
      return res.status(400).json({ success: false, message: "recordId is required" });
    }

    // Get server base URL
    const serverBaseUrl = getServerBaseUrl(req);
    
    // Define and ensure the upload directory exists
    const uploadDir = path.join(__backendDir, "public", "storage", "after_ironing_images", "inspection");
    try {
      await fs.promises.mkdir(uploadDir, { recursive: true });
    } catch (mkdirError) {
      console.error("Failed to create inspection image directory:", mkdirError);
      return res.status(500).json({ success: false, message: "Failed to create image directory." });
    }

    // Process uploaded files and create file mapping
    const fileMap = {};
    for (const file of req.files || []) {
      const fileExtension = path.extname(file.originalname) || '.jpg';
      const newFilename = `inspection-${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;
      const fullFilePath = path.join(uploadDir, newFilename);
      
      // Save file to disk
      await fs.promises.writeFile(fullFilePath, file.buffer);
      
      // Create URL for database storage
      const imageUrl = `${serverBaseUrl}/storage/after_ironing_images/inspection/${newFilename}`;
      fileMap[file.fieldname] = imageUrl;
      
      console.log(`Saved image: ${file.fieldname} -> ${imageUrl}`);
    }

    console.log('FileMap:', fileMap);

    // Find or create the record
    let record = await AfterIroning.findById(recordId);
    if (!record) {
      record = new AfterIroning({ _id: recordId });
    }

    // Process checkpoint images - FIXED LOGIC
    if (checkpointInspectionData && Array.isArray(checkpointInspectionData)) {
      checkpointInspectionData.forEach((item, idx) => {
        // Initialize comparisonImages array if it doesn't exist
        if (!item.comparisonImages) {
          item.comparisonImages = [];
        }

        // Look for uploaded images for this main checkpoint
        const mainCheckpointImages = [];
        Object.keys(fileMap).forEach(fieldName => {
          // Match pattern: checkpointImages_${idx}_${imgIdx}
          const mainPattern = new RegExp(`^checkpointImages_${idx}_\\d+$`);
          if (mainPattern.test(fieldName)) {
            mainCheckpointImages.push(fileMap[fieldName]);
            console.log(`Found main checkpoint image: ${fieldName} -> ${fileMap[fieldName]}`);
          }
        });

        // Add existing images from the array
        if (Array.isArray(item.comparisonImages)) {
          item.comparisonImages.forEach(img => {
            if (typeof img === 'string' && img.trim() !== '') {
              if (img.startsWith('http') || img.startsWith('/storage')) {
                mainCheckpointImages.push(img);
              } else if (img.startsWith('./public/storage/')) {
                const relativePath = img.replace('./public/storage/', '');
                mainCheckpointImages.push(`${serverBaseUrl}/storage/${relativePath}`);
              }
            } else if (typeof img === 'object' && img.preview) {
              if (img.preview.startsWith('http') || img.preview.startsWith('/storage')) {
                mainCheckpointImages.push(img.preview);
              } else if (img.preview.startsWith('./public/storage/')) {
                const relativePath = img.preview.replace('./public/storage/', '');
                mainCheckpointImages.push(`${serverBaseUrl}/storage/${relativePath}`);
              }
            }
          });
        }

        // Update the main checkpoint images
        item.comparisonImages = mainCheckpointImages;
        console.log(`Main checkpoint ${idx} final images:`, mainCheckpointImages);

        // Handle sub-point comparison images
        if (item.subPoints && Array.isArray(item.subPoints)) {
          item.subPoints.forEach((subPoint, subIdx) => {
            // Initialize comparisonImages array if it doesn't exist
            if (!subPoint.comparisonImages) {
              subPoint.comparisonImages = [];
            }

            // Look for uploaded images for this sub-point
            const subPointImages = [];
            Object.keys(fileMap).forEach(fieldName => {
              // Match pattern: checkpointImages_${idx}_sub_${subIdx}_${imgIdx}
              const subPattern = new RegExp(`^checkpointImages_${idx}_sub_${subIdx}_\\d+$`);
              if (subPattern.test(fieldName)) {
                subPointImages.push(fileMap[fieldName]);
                console.log(`Found sub-point image: ${fieldName} -> ${fileMap[fieldName]}`);
              }
            });

            // Add existing images from the array
            if (Array.isArray(subPoint.comparisonImages)) {
              subPoint.comparisonImages.forEach(img => {
                if (typeof img === 'string' && img.trim() !== '') {
                  if (img.startsWith('http') || img.startsWith('/storage')) {
                    subPointImages.push(img);
                  } else if (img.startsWith('./public/storage/')) {
                    const relativePath = img.replace('./public/storage/', '');
                    subPointImages.push(`${serverBaseUrl}/storage/${relativePath}`);
                  }
                } else if (typeof img === 'object' && img.preview) {
                  if (img.preview.startsWith('http') || img.preview.startsWith('/storage')) {
                    subPointImages.push(img.preview);
                  } else if (img.preview.startsWith('./public/storage/')) {
                    const relativePath = img.preview.replace('./public/storage/', '');
                    subPointImages.push(`${serverBaseUrl}/storage/${relativePath}`);
                  }
                }
              });
            }

            // Update the sub-point images
            subPoint.comparisonImages = subPointImages;
            console.log(`Sub-point ${idx}-${subIdx} final images:`, subPointImages);
          });
        }
      });
    }

    // Group checkpoint data with sub-points nested under main checkpoints
    const groupedCheckpointData = groupCheckpointData(checkpointInspectionData);

    // Build the inspection details
    record.inspectionDetails = {
      ...record.inspectionDetails,
      checkpointInspectionData: groupedCheckpointData,
      parameters: (defectData || []).map((item) => ({
        parameterName: item.parameter,
        checkedQty: item.checkedQty,
        defectQty: item.failedQty,
        passRate: item.passRate,
        result: item.result,
        remark: item.remark
      })),
      timeCoolEnabled,
      timeHotEnabled
    };

    record.savedAt = new Date();
    record.status = "processing";
    
    // Save and log the final data
    await record.save();
    
    console.log('Final checkpoint data saved:', JSON.stringify(groupedCheckpointData, null, 2));

    res.json({
      success: true,
      message: "Inspection data saved",
      data: record
    });

  } catch (err) {
    console.error("Inspection save error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

 // Get saved size
 export const getqcwashingSavedColor = async (req, res) => {
    try {
        const { orderNo, color } = req.params;
        const qcRecord = await AfterIroning.findOne({
          orderNo: orderNo,
          colorName: color,
          isAutoSave: true
        });
    
        if (qcRecord && qcRecord.color && qcRecord.color.measurementDetails) {
          const savedSizes = [];
          qcRecord.color.measurementDetails.forEach((value, key) => {
            if (key.startsWith("size_")) {
              savedSizes.push(value.size);
            }
          });
          res.json({ success: true, savedSizes: savedSizes });
        } else {
          res.json({ success: true, savedSizes: [] });
        }
      } catch (error) {
        console.error("Get saved sizes error:", error);
        res
          .status(500)
          .json({ success: false, message: "Failed to get saved sizes" });
      }
};

// Updated inspection-update endpoint
export const updateAfterIroningInspectionData = async (req, res) => {
    
    try {
      const { recordId } = req.body;
      const defectData = JSON.parse(req.body.defectData || "[]");
      const checkpointInspectionData = JSON.parse(req.body.checkpointInspectionData || "[]");

      if (!recordId) {
        return res
          .status(400)
          .json({ success: false, message: "recordId is required" });
      }

      // Get server base URL
      const serverBaseUrl = getServerBaseUrl(req);
      
      // Define and ensure the upload directory exists
      const uploadDir = path.join(__backendDir, "public", "storage", "after_ironing_images", "inspection");
      try {
        await fs.promises.mkdir(uploadDir, { recursive: true });
      } catch (mkdirError) {
        console.error("Failed to create inspection image directory:", mkdirError);
        return res.status(500).json({ success: false, message: "Failed to create image directory." });
      }
      const fileMap = {};
      
      for (const file of req.files || []) {
        const fileExtension = path.extname(file.originalname);
        const newFilename = `inspection-${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;
        const fullFilePath = path.join(uploadDir, newFilename);
        await fs.promises.writeFile(fullFilePath, file.buffer);
        fileMap[
          file.fieldname
        ] = `${serverBaseUrl}/storage/after_ironing_images/inspection/${newFilename}`;
      }

      // Find the record
      let record = await AfterIroning.findById(recordId);
      if (!record) {
        return res
          .status(404)
          .json({ success: false, message: "Record not found for update" });
      }

      // Handle checkpoint images
      if (checkpointInspectionData) {
        checkpointInspectionData.forEach((item, idx) => {
          // Handle main checkpoint comparison images
          if (item.comparisonImages) {
            item.comparisonImages = item.comparisonImages.map((img, imgIdx) => {
              const newImageUrl = fileMap[`checkpointImages_${idx}_${imgIdx}`];
              if (newImageUrl) return newImageUrl;
              
              // Handle existing images properly
              if (typeof img === 'string') {
                if (img.startsWith('http') || img.startsWith('/storage')) return img;
                // Convert relative paths to full URLs
                if (img.startsWith('./public/storage/')) {
                  const relativePath = img.replace('./public/storage/', '');
                  return `${serverBaseUrl}/storage/${relativePath}`;
                }
              }
              
              // Handle object format (from frontend)
              if (typeof img === 'object' && img.preview) {
                if (img.preview.startsWith('http') || img.preview.startsWith('/storage')) {
                  return img.preview;
                }
              }
              
              return null;
            }).filter(Boolean);
          }

          // Handle sub-point comparison images
          if (item.subPoints && Array.isArray(item.subPoints)) {
            item.subPoints.forEach((subPoint, subIdx) => {
              if (subPoint.comparisonImages) {
                subPoint.comparisonImages = subPoint.comparisonImages.map((img, imgIdx) => {
                  const newImageUrl = fileMap[`checkpointImages_${idx}_sub_${subIdx}_${imgIdx}`];
                  if (newImageUrl) return newImageUrl;
                  if (typeof img === 'string' && (img.startsWith('http') || img.startsWith('/storage'))) return img;
                  return null;
                }).filter(Boolean);
              }
            });
          }
        });
      }

      // Group checkpoint data with sub-points nested under main checkpoints
      const groupedCheckpointData = groupCheckpointData(checkpointInspectionData);

      // Build the inspection details
      record.inspectionDetails = {
        ...record.inspectionDetails,
        // Use grouped checkpoint data instead of flat array
        checkpointInspectionData: groupedCheckpointData,
        parameters: (defectData || []).map((item) => ({
          parameterName: item.parameter,
          checkedQty: item.checkedQty,
          defectQty: item.failedQty,
          passRate: item.passRate,
          result: item.result,
          remark: item.remark
        })),
      };

      record.savedAt = new Date();
      await record.save();

      res.json({
        success: true,
        message: "Inspection data updated",
        data: record
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server error" });
    }
};

// Save defect details with images
export const saveAfterIroningDefectData = async (req, res) => {
  try {
    const { recordId } = req.body;
    const defectDetails = JSON.parse(req.body.defectDetails || "{}");

    if (!recordId) {
      return res.status(400).json({ success: false, message: "Missing recordId" });
    }

    // Get server base URL
    const serverBaseUrl = getServerBaseUrl(req);

    // Define and ensure the upload directory exists
    const uploadDir = path.join(__backendDir, "public", "storage", "after_ironing_images", "defect");
    try {
      await fs.promises.mkdir(uploadDir, { recursive: true });
    } catch (mkdirError) {
      console.error("Failed to create defect image directory:", mkdirError);
      return res.status(500).json({ success: false, message: "Failed to create image directory." });
    }

    // Map uploaded files by fieldname and write them to disk
    const fileMap = {};
    for (const file of req.files || []) {
      let fileExtension = path.extname(file.originalname) || '.jpg';
      const newFilename = `defect-${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;
      const fullFilePath = path.join(uploadDir, newFilename);
      
      await fs.promises.writeFile(fullFilePath, file.buffer);
      const imageUrl = `${serverBaseUrl}/storage/after_ironing_images/defect/${newFilename}`;
      fileMap[file.fieldname] = imageUrl;
      
      console.log(`Saved defect image: ${file.fieldname} -> ${imageUrl}`);
    }

    console.log('Defect FileMap:', fileMap);

    // CRITICAL FIX: Initialize additionalImages array if it doesn't exist
    if (!defectDetails.additionalImages) {
      defectDetails.additionalImages = [];
    }

    // Process defect images - FIXED LOGIC WITH DEFECT ID PRESERVATION
    if (defectDetails.defectsByPc && Array.isArray(defectDetails.defectsByPc)) {
      defectDetails.defectsByPc.forEach((pc, pcIdx) => {
        if (pc.pcDefects && Array.isArray(pc.pcDefects)) {
          pc.pcDefects.forEach((defect, defectIdx) => {
            // Initialize defectImages array if it doesn't exist
            if (!defect.defectImages) {
              defect.defectImages = [];
            }

            // CRITICAL FIX: Preserve both defectId and defectName
            const processedDefect = {
              defectId: defect.selectedDefect || defect.defectId || "", // Save the defect ID
              defectName: defect.defectName || "",
              defectQty: defect.defectQty || 0,
              defectImages: []
            };

            // Look for uploaded images for this defect
            const defectImages = [];
            
            // Add new uploaded images
            Object.keys(fileMap).forEach(fieldName => {
              const defectPattern = new RegExp(`^defectImages_${pcIdx}_${defectIdx}_\\d+$`);
              if (defectPattern.test(fieldName)) {
                defectImages.push(fileMap[fieldName]);
                console.log(`Found defect image: ${fieldName} -> ${fileMap[fieldName]}`);
              }
            });

            // Add existing images from the array
            if (Array.isArray(defect.defectImages)) {
              defect.defectImages.forEach(img => {
                if (typeof img === 'string' && img.trim() !== '') {
                  if (img.startsWith('http') || img.startsWith('/storage')) {
                    defectImages.push(img);
                  } else if (img.startsWith('./public/storage/')) {
                    const relativePath = img.replace('./public/storage/', '');
                    defectImages.push(`${serverBaseUrl}/storage/${relativePath}`);
                  }
                } else if (typeof img === 'object' && img.preview) {
                  if (img.preview.startsWith('http') || img.preview.startsWith('/storage')) {
                    defectImages.push(img.preview);
                  } else if (img.preview.startsWith('./public/storage/')) {
                    const relativePath = img.preview.replace('./public/storage/', '');
                    defectImages.push(`${serverBaseUrl}/storage/${relativePath}`);
                  }
                }
              });
            }

            // Update the processed defect with images
            processedDefect.defectImages = defectImages;
            
            // Replace the original defect with the processed one
            pc.pcDefects[defectIdx] = processedDefect;
            
            console.log(`Defect ${pcIdx}-${defectIdx} final data:`, processedDefect);
          });
        }
      });
    }

    // Process additional images - ENHANCED LOGIC
    console.log('Processing additional images...');
    
    const additionalImages = [...(defectDetails.additionalImages || [])];
    
    // Look for uploaded additional images
    Object.keys(fileMap).forEach(fieldName => {
      const additionalPattern = /^additionalImages_\d+$/;
      if (additionalPattern.test(fieldName)) {
        additionalImages.push(fileMap[fieldName]);
        console.log(`Found additional image: ${fieldName} -> ${fileMap[fieldName]}`);
      }
    });

    // Process existing images
    const processedAdditionalImages = additionalImages.map(img => {
      if (typeof img === 'string' && img.trim() !== '') {
        if (img.startsWith('http') || img.startsWith('/storage')) {
          return img;
        } else if (img.startsWith('./public/storage/')) {
          const relativePath = img.replace('./public/storage/', '');
          return `${serverBaseUrl}/storage/${relativePath}`;
        }
      } else if (typeof img === 'object' && img.preview) {
        if (img.preview.startsWith('http') || img.preview.startsWith('/storage')) {
          return img.preview;
        } else if (img.preview.startsWith('./public/storage/')) {
          const relativePath = img.preview.replace('./public/storage/', '');
          return `${serverBaseUrl}/storage/${relativePath}`;
        }
      }
      return img;
    }).filter(img => img && typeof img === 'string' && img.trim() !== '');

    defectDetails.additionalImages = processedAdditionalImages;

    // Add missing fields to defectDetails before saving
    if (!defectDetails.checkedQty && !defectDetails.washQty && !defectDetails.result) {
      // Get the record to extract checkedQty and washQty
      const currentRecord = await AfterIroning.findById(recordId);
      if (currentRecord) {
        defectDetails.checkedQty = currentRecord.checkedQty || 0;
        defectDetails.washQty = currentRecord.washQty || 0;
        
        // Calculate result based on defects
        const totalDefectCount = defectDetails.defectsByPc?.reduce((sum, pc) => 
          sum + (pc.pcDefects?.reduce((defSum, defect) => 
            defSum + (parseInt(defect.defectQty) || 0), 0) || 0), 0) || 0;
        
        // Use AQL logic if available
        const aql = currentRecord.aql?.[0];
        if (aql && typeof aql.acceptedDefect === 'number') {
          defectDetails.result = totalDefectCount <= aql.acceptedDefect ? 'Pass' : 'Fail';
        } else {
          defectDetails.result = totalDefectCount === 0 ? 'Pass' : 'Fail';
        }
      }
    }

    // Save to DB
    const doc = await AfterIroning.findByIdAndUpdate(
      recordId,
      { defectDetails: defectDetails, updatedAt: new Date() },
      { new: true }
    );

    if (!doc) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    console.log('Final defect details saved:', JSON.stringify(defectDetails, null, 2));

    res.json({ success: true, data: doc.defectDetails });

  } catch (err) {
    console.error("Defect details save error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateAfterIroningDefectData = async (req, res) => {
  try {
    const { recordId } = req.body;
    const defectDetails = JSON.parse(req.body.defectDetails || "{}");

    if (!recordId) {
      return res.status(400).json({ success: false, message: "Missing recordId" });
    }

    // Get server base URL
    const serverBaseUrl = getServerBaseUrl(req);

    // Define and ensure the upload directory exists
    const uploadDir = path.join(__backendDir, "public", "storage", "after_ironing_images", "defect");
    try {
      await fs.promises.mkdir(uploadDir, { recursive: true });
    } catch (mkdirError) {
      console.error("Failed to create defect image directory:", mkdirError);
      return res.status(500).json({ success: false, message: "Failed to create image directory." });
    }

    // Map uploaded files by fieldname and write them to disk
    const fileMap = {};
    for (const file of req.files || []) {
      let fileExtension = path.extname(file.originalname) || '.jpg';
      const newFilename = `defect-${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;
      const fullFilePath = path.join(uploadDir, newFilename);
      
      await fs.promises.writeFile(fullFilePath, file.buffer);
      const imageUrl = `${serverBaseUrl}/storage/after_ironing_images/defect/${newFilename}`;
      fileMap[file.fieldname] = imageUrl;
      
      console.log(`Updated defect image: ${file.fieldname} -> ${imageUrl}`);
    }

    // CRITICAL FIX: Initialize additionalImages array if it doesn't exist
    if (!defectDetails.additionalImages) {
      defectDetails.additionalImages = [];
    }

    // Process defect images - FIXED LOGIC WITH DEFECT ID PRESERVATION
    if (defectDetails.defectsByPc && Array.isArray(defectDetails.defectsByPc)) {
      defectDetails.defectsByPc.forEach((pc, pcIdx) => {
        if (pc.pcDefects && Array.isArray(pc.pcDefects)) {
          pc.pcDefects.forEach((defect, defectIdx) => {
            if (!defect.defectImages) {
              defect.defectImages = [];
            }

            // CRITICAL FIX: Preserve both defectId and defectName
            const processedDefect = {
              defectId: defect.selectedDefect || defect.defectId || "", // Save the defect ID
              defectName: defect.defectName || "",
              defectQty: defect.defectQty || 0,
              defectImages: []
            };

            const defectImages = [];
            
            Object.keys(fileMap).forEach(fieldName => {
              const defectPattern = new RegExp(`^defectImages_${pcIdx}_${defectIdx}_\\d+$`);
              if (defectPattern.test(fieldName)) {
                defectImages.push(fileMap[fieldName]);
                console.log(`Found updated defect image: ${fieldName} -> ${fileMap[fieldName]}`);
              }
            });

            if (Array.isArray(defect.defectImages)) {
              defect.defectImages.forEach(img => {
                if (typeof img === 'string' && img.trim() !== '') {
                  if (img.startsWith('http') || img.startsWith('/storage')) {
                    defectImages.push(img);
                  } else if (img.startsWith('./public/storage/')) {
                    const relativePath = img.replace('./public/storage/', '');
                    defectImages.push(`${serverBaseUrl}/storage/${relativePath}`);
                  }
                } else if (typeof img === 'object' && img.preview) {
                  if (img.preview.startsWith('http') || img.preview.startsWith('/storage')) {
                    defectImages.push(img.preview);
                  } else if (img.preview.startsWith('./public/storage/')) {
                    const relativePath = img.preview.replace('./public/storage/', '');
                    defectImages.push(`${serverBaseUrl}/storage/${relativePath}`);
                  }
                }
              });
            }

            processedDefect.defectImages = defectImages;
            pc.pcDefects[defectIdx] = processedDefect;
            
            console.log(`Updated defect ${pcIdx}-${defectIdx} final data:`, processedDefect);
          });
        }
      });
    }

    // Process additional images - same logic as save function
    const additionalImages = [...(defectDetails.additionalImages || [])];
    
    Object.keys(fileMap).forEach(fieldName => {
      const additionalPattern = /^additionalImages_\d+$/;
      if (additionalPattern.test(fieldName)) {
        additionalImages.push(fileMap[fieldName]);
        console.log(`Found updated additional image: ${fieldName} -> ${fileMap[fieldName]}`);
      }
    });

    const processedAdditionalImages = additionalImages.map(img => {
      if (typeof img === 'string' && img.trim() !== '') {
        if (img.startsWith('http') || img.startsWith('/storage')) {
          return img;
        } else if (img.startsWith('./public/storage/')) {
          const relativePath = img.replace('./public/storage/', '');
          return `${serverBaseUrl}/storage/${relativePath}`;
        }
      } else if (typeof img === 'object' && img.preview) {
        if (img.preview.startsWith('http') || img.preview.startsWith('/storage')) {
          return img.preview;
        } else if (img.preview.startsWith('./public/storage/')) {
          const relativePath = img.replace('./public/storage/', '');
          return `${serverBaseUrl}/storage/${relativePath}`;
        }
      }
      return img;
    }).filter(img => img && typeof img === 'string' && img.trim() !== '');

    defectDetails.additionalImages = processedAdditionalImages;

    // Add missing fields to defectDetails before saving (for update function)
    if (!defectDetails.checkedQty && !defectDetails.washQty && !defectDetails.result) {
      // Get the record to extract checkedQty and washQty
      const currentRecord = await AfterIroning.findById(recordId);
      if (currentRecord) {
        defectDetails.checkedQty = currentRecord.checkedQty || 0;
        defectDetails.washQty = currentRecord.washQty || 0;
        
        // Calculate result based on defects
        const totalDefectCount = defectDetails.defectsByPc?.reduce((sum, pc) => 
          sum + (pc.pcDefects?.reduce((defSum, defect) => 
            defSum + (parseInt(defect.defectQty) || 0), 0) || 0), 0) || 0;
        
        // Use AQL logic if available
        const aql = currentRecord.aql?.[0];
        if (aql && typeof aql.acceptedDefect === 'number') {
          defectDetails.result = totalDefectCount <= aql.acceptedDefect ? 'Pass' : 'Fail';
        } else {
          defectDetails.result = totalDefectCount === 0 ? 'Pass' : 'Fail';
        }
      }
    }

    // Save to DB
    const doc = await AfterIroning.findByIdAndUpdate(
      recordId,
      { defectDetails: defectDetails, updatedAt: new Date() },
      { new: true }
    );

    if (!doc) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    console.log('Final updated defect details saved:', JSON.stringify(defectDetails, null, 2));

    res.json({ success: true, data: doc.defectDetails });

  } catch (err) {
    console.error("Defect details update error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const savedMeasurementDataSpec = async (req, res) => {
  try {
    const { styleNo, color, reportType, washType, factory } = req.body;

    const collection = ymProdConnection.db.collection("AfterIroning");

    // Build query to find matching records - handle undefined values
    const query = {
      $or: [{ orderNo: styleNo }, { style: styleNo }],
      color: color
    };

    // Only add these fields to query if they have values
    if (reportType && reportType !== "undefined") {
      query.reportType = reportType;
    }

    if (factory && factory !== "undefined") {
      query.factoryName = factory;
    }

    // FIXED: Map wash type correctly
    if (washType === "Before Wash") {
      query.before_after_wash = "Before Wash";
    } else if (washType === "After Ironing") {
      // Look for both possible values in the database
      query.$or = [
        ...query.$or,
        { before_after_wash: "After Ironing" },
        { before_after_wash: "afterIroning" }
      ];
    }

    // Try to find all matching records first (without reportType and factory filters)
    const basicQuery = {
      $or: [{ orderNo: styleNo }, { style: styleNo }],
      color: color
    };

    if (washType === "Before Wash") {
      basicQuery.before_after_wash = "Before Wash";
    } else if (washType === "After Ironing") {
      basicQuery.$or = [
        ...basicQuery.$or,
        { before_after_wash: "After Ironing" },
        { before_after_wash: "afterIroning" }
      ];
    }

    const allRecords = await collection.find(basicQuery).toArray();

    // Try the specific query first
    let savedData = await collection.findOne(query, {
      sort: { createdAt: -1 }
    });

    // If no data found with specific query, try without reportType and factory
    if (!savedData && (reportType || factory)) {
      savedData = await collection.findOne(basicQuery, {
        sort: { createdAt: -1 }
      });
    }

    if (
      savedData &&
      savedData.measurementDetails &&
      savedData.measurementDetails.measurement
    ) {
      const measurementData = savedData.measurementDetails.measurement || [];

      // Extract measurement point names from the nested structure
      const extractedMeasurementPoints = [];

      measurementData.forEach((measurement, measurementIndex) => {
        if (measurement.pcs && measurement.pcs.length > 0) {
          // Get measurement points from the first piece (they should be the same across all pieces)
          const firstPc = measurement.pcs[0];
          if (
            firstPc.measurementPoints &&
            firstPc.measurementPoints.length > 0
          ) {
            const pointNames = firstPc.measurementPoints.map(
              (point) => point.pointName
            );

            // FIXED: Normalize the before_after_wash value
            let normalizedWashType = measurement.before_after_wash;
            if (measurement.before_after_wash === 'afterWash' || measurement.before_after_wash === 'After Wash') {
              normalizedWashType = 'afterIroning';
            }

            // Create a structure that matches what the frontend expects
            extractedMeasurementPoints.push({
              size: measurement.size,
              kvalue: measurement.kvalue,
              before_after_wash: normalizedWashType, // Use normalized value
              selectedRows: measurement.selectedRows || [],
              measurementPointNames: pointNames,
              // Include the original structure for compatibility
              ...measurement,
              before_after_wash: normalizedWashType // Override with normalized value
            });
          }
        }
      });

      console.log('Extracted measurement points:', extractedMeasurementPoints.map(m => ({
        size: m.size,
        before_after_wash: m.before_after_wash,
        selectedRows: m.selectedRows?.length
      })));

      res.json({
        success: true,
        measurementData: extractedMeasurementPoints
      });
    } else {
      res.json({
        success: false,
        message: "No measurement data found in record"
      });
    }
  } catch (error) {
    console.error("Error finding saved measurement data:", error);
    res.status(500).json({
      success: false,
      message: "Server error while finding saved measurement data"
    });
  }
};

// Get sizes for a specific order and color
export const getAfterIroningOrderSizes = async (req, res) => {
  const { orderNo } = req.params;

  const collection = ymProdConnection.db.collection("dt_orders");

  try {
    const orders = await collection.find({ Order_No: orderNo }).toArray();

    if (!orders || orders.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: `Order '${orderNo}' not found.` });
    }

    const sizes = new Set();

    orders.forEach((order) => {
      if (order.OrderColors && Array.isArray(order.OrderColors)) {
        order.OrderColors.forEach((colorObj) => {
          if (colorObj && colorObj.OrderQty && Array.isArray(colorObj.OrderQty)) {
            colorObj.OrderQty.forEach((entry) => {
              const sizeName = Object.keys(entry)[0];
              const quantity = entry[sizeName];

              if (quantity > 0) {
                const cleanSize = sizeName.split(";")[0].trim();
                sizes.add(cleanSize);
              }
            });
          }
        });
      }
    });

    // Convert Set to Array and return
    return res.status(200).json({
      success: true,
      orderNo,
      sizes: Array.from(sizes)
    });

  } catch (error) {
    console.error('Error fetching order sizes:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching order sizes.'
    });
  }
};

export const getmeasurmentSpec = async (req, res) => {
  const { orderNo } = req.params;
    const collection = ymProdConnection.db.collection("dt_orders");
    const buyerSpecCollection = ymProdConnection.db.collection("buyerspectemplates");

    try {
      const orders = await collection.find({ Order_No: orderNo }).toArray();

      if (!orders || orders.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: `Order '${orderNo}' not found.` });
      }

      const order = orders[0];

      // Extract measurement specifications from different possible locations
      let measurementSpecs = [];
      
      // Check various possible locations for measurement data (removed color dependency)
      if (order.MeasurementSpecs && Array.isArray(order.MeasurementSpecs)) {
        measurementSpecs = order.MeasurementSpecs;
      } else if (order.Specs && Array.isArray(order.Specs)) {
        measurementSpecs = order.Specs;
      }

      const beforeWashSpecs = [];
      const afterWashSpecs = [];
      const beforeWashByK = {};
      const afterWashByK = {};

      // Process BeforeWashSpecs and AfterWashSpecs arrays
      if (order.BeforeWashSpecs && Array.isArray(order.BeforeWashSpecs)) {
        order.BeforeWashSpecs.forEach((spec) => {
          if (
            spec.MeasurementPointEngName &&
            spec.Specs &&
            Array.isArray(spec.Specs)
          ) {
            const kValue = spec.kValue || "NA";
            const pointName = spec.MeasurementPointEngName;
            if (!beforeWashByK[kValue]) {
              beforeWashByK[kValue] = new Map();
            }
            if (!beforeWashByK[kValue].has(pointName)) {
              beforeWashByK[kValue].set(pointName, {
                MeasurementPointEngName: pointName,
                Specs: spec.Specs,
                ToleranceMinus: spec.TolMinus,
                TolerancePlus: spec.TolPlus,
                kValue: kValue
              });
            }
          }
        });
      }

      if (order.AfterWashSpecs && Array.isArray(order.AfterWashSpecs)) {
        order.AfterWashSpecs.forEach((spec) => {
          if (
            spec.MeasurementPointEngName &&
            spec.Specs &&
            Array.isArray(spec.Specs)
          ) {
            const kValue = spec.kValue || "NA";
            const pointName = spec.MeasurementPointEngName;
            if (!afterWashByK[kValue]) {
              afterWashByK[kValue] = new Map();
            }
            if (!afterWashByK[kValue].has(pointName)) {
              afterWashByK[kValue].set(pointName, {
                MeasurementPointEngName: pointName,
                Specs: spec.Specs,
                ToleranceMinus: spec.TolMinus,
                TolerancePlus: spec.TolPlus,
                kValue: kValue
              });
            }
          }
        });
      }

      // Convert to grouped arrays
      const beforeWashGrouped = {};
      const afterWashGrouped = {};

      Object.keys(beforeWashByK).forEach((kValue) => {
        beforeWashGrouped[kValue] = Array.from(beforeWashByK[kValue].values());
      });

      Object.keys(afterWashByK).forEach((kValue) => {
        afterWashGrouped[kValue] = Array.from(afterWashByK[kValue].values());
      });

      // For backward compatibility, also provide flat arrays
      Object.values(beforeWashGrouped).forEach((group) => {
        beforeWashSpecs.push(...group);
      });

      Object.values(afterWashGrouped).forEach((group) => {
        afterWashSpecs.push(...group);
      });

      // FIXED: Fetch buyerspectemplate data for default measurement points
      let buyerSpecData = null;
      try {
        // Use orderNo directly since moNo in buyerspectemplates corresponds to order number
        buyerSpecData = await buyerSpecCollection.findOne({ 
          moNo: orderNo  // Changed from styleNo to orderNo
        });
        
        // If not found with orderNo, try with Style field as fallback
        if (!buyerSpecData && order.Style) {
          buyerSpecData = await buyerSpecCollection.findOne({ 
            moNo: order.Style 
          });
        }
        
        
      } catch (error) {
        console.log("Error fetching buyerspectemplate for orderNo:", orderNo, error);
      }

      // If no measurement data found, provide default specifications
      if (beforeWashSpecs.length === 0 && afterWashSpecs.length === 0) {
        return res.json({
          success: true,
          beforeWashSpecs: [],
          afterWashSpecs: [],
          beforeWashGrouped: {},
          afterWashGrouped: {},
          buyerSpecData: buyerSpecData, // Include buyer spec data
          isDefault: true,
          message: "No measurement points available for this Mono."
        });
      } else {
        return res.json({
          success: true,
          beforeWashSpecs: beforeWashSpecs,
          afterWashSpecs: afterWashSpecs,
          beforeWashGrouped: beforeWashGrouped,
          afterWashGrouped: afterWashGrouped,
          buyerSpecData: buyerSpecData, // Include buyer spec data
          isDefault: false
        });
      }

    } catch (error) {
      console.error(
        `Error fetching measurement specs for Mono ${orderNo} :`,
        error
      );
      res.status(500).json({
        success: false,
        message: "Server error while fetching measurement specs."
      });
    }
};

export const saveAfterIroningSummary = async (req, res) => {
  try {
    const { recordId } = req.params;
    // The summary object from the frontend may contain the calculated overallFinalResult
    const summary = req.body.summary || {};

    const qcRecord = await AfterIroning.findById(recordId);
    if (!qcRecord) {
      return res.status(404).json({ success: false, message: "Record not found." });
    }

    // Store the previous result for comparison
    const previousResult = qcRecord.overallFinalResult;

    // 1. Calculate measurement statistics from current data
    let totalMeasurementPoints = 0;
    let totalMeasurementPass = 0;
    let totalMeasurementFail = 0;

    // Use measurementSizeSummary if available (most accurate)
    if (qcRecord.measurementDetails?.measurementSizeSummary?.length > 0) {
      qcRecord.measurementDetails.measurementSizeSummary.forEach(sizeData => {
        totalMeasurementPoints += (sizeData.checkedPoints || 0);
        totalMeasurementPass += (sizeData.totalPass || 0);
        totalMeasurementFail += (sizeData.totalFail || 0);
      });
    } else if (qcRecord.measurementDetails?.measurement?.length > 0) {
      // Fallback: Calculate from measurement array
      qcRecord.measurementDetails.measurement.forEach((data) => {
        if (data.pcs && Array.isArray(data.pcs)) {
          data.pcs.forEach((pc) => {
            if (pc.measurementPoints && Array.isArray(pc.measurementPoints)) {
              pc.measurementPoints.forEach((point) => {
                if (point.result === "pass" || point.result === "fail") {
                  totalMeasurementPoints++;
                  if (point.result === "pass") {
                    totalMeasurementPass++;
                  } else {
                    totalMeasurementFail++;
                  }
                }
              });
            }
          });
        }
      });
    }

    // 2. Calculate defect statistics from current data
    let totalCheckedPcs = 0;
    let rejectedDefectPcs = 0;
    let totalDefectCount = 0;

    // Calculate totalCheckedPcs from measurement data
    if (qcRecord.measurementDetails?.measurement) {
      qcRecord.measurementDetails.measurement.forEach((measurement) => {
        if (typeof measurement.qty === "number" && measurement.qty > 0) {
          totalCheckedPcs += measurement.qty;
        }
      });
    }
    
    // Fallback to checkedQty if no measurement data
    if (totalCheckedPcs === 0) {
      totalCheckedPcs = parseInt(qcRecord.checkedQty, 10) || 0;
    }

    // Calculate defects
    const defectDetails = qcRecord.defectDetails || {};
    if (Array.isArray(defectDetails.defectsByPc)) {
      rejectedDefectPcs = defectDetails.defectsByPc.length;
      totalDefectCount = defectDetails.defectsByPc.reduce((sum, pc) =>
        sum + (Array.isArray(pc.pcDefects)
          ? pc.pcDefects.reduce((defSum, defect) =>
              defSum + (parseInt(defect.defectQty, 10) || 0), 0)
          : 0), 0);
    }

    // 3. Calculate pass rate
    const passRate = totalMeasurementPoints > 0 
      ? Math.round((totalMeasurementPass / totalMeasurementPoints) * 100) 
      : 100;

    // 4. CRITICAL FIX: Determine overall result
    const defectResult = qcRecord.defectDetails?.result || "Pass";
    
    console.log('Backend overall result calculation:', {
      passRate,
      defectResult,
      reportType: qcRecord.reportType
    });

    let newOverallFinalResult;

    // Prioritize the result sent from the frontend if it's valid ('Pass' or 'Fail')
    if (summary.overallFinalResult && ['Pass', 'Fail'].includes(summary.overallFinalResult)) {
      newOverallFinalResult = summary.overallFinalResult;
      console.log('Using overall result from frontend:', newOverallFinalResult);
    } else {
      // Fallback to backend recalculation if frontend result is not provided or invalid
      newOverallFinalResult = (passRate >= 95 && defectResult === "Pass") ? "Pass" : "Fail";
      console.log('Recalculating overall result on backend:', newOverallFinalResult);
    }
    
    console.log('Backend final calculation result:', {
      condition1: `Pass Rate ${passRate}% >= 95%: ${passRate >= 95}`,
      condition2: `Defect Result "${defectResult}" === "Pass": ${defectResult === "Pass"}`,
      finalResult: newOverallFinalResult
    });
    // 5. Update ALL calculated fields with fresh values
    qcRecord.totalCheckedPcs = totalCheckedPcs;
    qcRecord.rejectedDefectPcs = rejectedDefectPcs;
    qcRecord.totalDefectCount = totalDefectCount;
    qcRecord.defectRate = totalCheckedPcs > 0
      ? Number(((totalDefectCount / totalCheckedPcs) * 100).toFixed(1))
      : 0;
    qcRecord.defectRatio = totalCheckedPcs > 0
      ? Number(((rejectedDefectPcs / totalCheckedPcs) * 100).toFixed(1))
      : 0;
    qcRecord.totalCheckedPoint = totalMeasurementPoints;
    qcRecord.totalPass = totalMeasurementPass;
    qcRecord.totalFail = totalMeasurementFail;
    qcRecord.passRate = passRate;
    
    // CRITICAL FIX: Set the new overall result and force save
    qcRecord.overallFinalResult = newOverallFinalResult;
    qcRecord.markModified('overallFinalResult');
    qcRecord.updatedAt = new Date();
    
    // Save the record
    await qcRecord.save();
    
    console.log('Saved overall result:', qcRecord.overallFinalResult);

    res.json({ 
      success: true,
      message: "Overall result recalculated and saved successfully",
      previousResult: previousResult,
      newResult: newOverallFinalResult,
      summary: {
        totalCheckedPcs,
        rejectedDefectPcs,
        totalDefectCount,
        defectRate: qcRecord.defectRate,
        defectRatio: qcRecord.defectRatio,
        passRate,
        overallFinalResult: newOverallFinalResult
      }
    });

  } catch (error) {
    console.error("Save summary error:", error);
    res.status(500).json({ success: false, message: "Failed to save summary." });
  }
};


export const updateAfterIroningMeasurementData = async (req, res) => {
  try {
      const { recordId } = req.params;
      const summary = req.body.summary || {};
      const qcRecord = await AfterIroning.findById(recordId);
      if (!qcRecord)
        return res
          .status(404)
          .json({ success: false, message: "Record not found." });

      // Accept both totalCheckedPoints and totalCheckedPcs for compatibility
      qcRecord.totalCheckedPoint =
        summary.totalCheckedPoints ?? summary.totalCheckedPcs ?? 0;
      qcRecord.totalCheckedPcs =
        summary.totalCheckedPcs ?? summary.totalCheckedPoints ?? 0;
      qcRecord.totalPass = summary.totalPass ?? 0;
      qcRecord.totalFail = summary.totalFail ?? 0;
      qcRecord.passRate = summary.passRate ?? 0;
      qcRecord.measurementOverallResult =
        summary.overallResult || summary.overallFinalResult || "PENDING";
      qcRecord.savedAt = new Date();

      await qcRecord.save();
      res.json({ success: true });
    } catch (error) {
      console.error("Measurement summary autosave error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to autosave measurement summary."
      });
    }
};

// Updated GET endpoint
export const getAfterIroningOverAllSummary = async (req, res) => {
  try {
      const { recordId } = req.params;
  
      const qcRecord = await AfterIroning.findById(recordId);
      if (!qcRecord) {
        return res
          .status(404)
          .json({ success: false, message: "No data found for this record." });
      }
  
      // Recalculate overall result to ensure accuracy (but don't save)
      let totalMeasurementPoints = 0;
      let totalMeasurementPass = 0;
      let totalMeasurementFail = 0;
  
      // Use measurementSizeSummary if available
      if (qcRecord.measurementDetails?.measurementSizeSummary?.length > 0) {
        qcRecord.measurementDetails.measurementSizeSummary.forEach((sizeData) => {
          totalMeasurementPoints += sizeData.checkedPoints || 0;
          totalMeasurementPass += sizeData.totalPass || 0;
          totalMeasurementFail += sizeData.totalFail || 0;
        });
      } else if (qcRecord.measurementDetails?.measurement?.length > 0) {
        // Fallback calculation
        qcRecord.measurementDetails.measurement.forEach((data) => {
          if (data.pcs && Array.isArray(data.pcs)) {
            data.pcs.forEach((pc) => {
              if (pc.measurementPoints && Array.isArray(pc.measurementPoints)) {
                pc.measurementPoints.forEach((point) => {
                  if (point.result === "pass" || point.result === "fail") {
                    totalMeasurementPoints++;
                    if (point.result === "pass") {
                      totalMeasurementPass++;
                    } else {
                      totalMeasurementFail++;
                    }
                  }
                });
              }
            });
          }
        });
      }
  
      const passRate = totalMeasurementPoints > 0 
        ? Math.round((totalMeasurementPass / totalMeasurementPoints) * 100) 
        : 100;
  
      // Use 95% threshold for measurement result
      const measurementResult = totalMeasurementPoints === 0 
        ? "Pass" 
        : (passRate >= 95 ? "Pass" : "Fail");
  
      const defectResult = qcRecord.defectDetails?.result || "Pass";
      
      const calculatedOverallResult = (measurementResult === "Pass" && defectResult === "Pass") 
        ? "Pass" 
        : "Fail";
  
      res.json({
        success: true,
        summary: {
          recordId,
          orderNo: qcRecord.orderNo,
          color: qcRecord.color,
          totalCheckedPcs: qcRecord.totalCheckedPcs ?? 0,
          checkedQty: qcRecord.checkedQty ?? "",
          washQty: qcRecord.washQty ?? "",
          rejectedDefectPcs: qcRecord.rejectedDefectPcs ?? 0,
          totalDefectCount: qcRecord.totalDefectCount ?? 0,
          defectRate: qcRecord.defectRate ?? 0,
          defectRatio: qcRecord.defectRatio ?? 0,
          passRate: passRate,
          overallResult: calculatedOverallResult,
          overallFinalResult: qcRecord.overallFinalResult, // Use saved value
          
          // Additional debug information
          measurementStats: {
            totalPoints: totalMeasurementPoints,
            totalPass: totalMeasurementPass,
            totalFail: totalMeasurementFail,
            measurementResult: measurementResult,
            passRateThreshold: 95
          },
          defectStats: {
            defectResult: defectResult
          },
          
          // Include the measurement details for frontend calculation
          measurementDetails: qcRecord.measurementDetails,
          defectDetails: qcRecord.defectDetails ?? {}
        }
      });
  
    } catch (error) {
      console.error("Error fetching overall summary by id:", error);
      res.status(500).json({
        success: false,
        message: "Server error while fetching overall summary."
      });
    }
};

// GET - Get total order qty for a specific orderNo and color
export const getAfterIroningOrderColorQty = async (req, res) => {
  const { orderNo, color } = req.params;
  const sanitizeColor = (colorInput) => {
    if (!colorInput || typeof colorInput !== 'string') return '';
    return colorInput.trim().toLowerCase().replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, ' ');
  };
  const sanitizedColor = sanitizeColor(color);

  const collection = ymProdConnection.db.collection("dt_orders");
  try {
    const orders = await collection.find({ Order_No: orderNo }).toArray();
    if (!orders || orders.length === 0) {
      return res
        .status(200) // Return 200 with success:false to avoid console errors on frontend
        .json({ success: false, message: `Order '${orderNo}' not found.` });
    }
    let totalQty = 0;
    orders.forEach((order) => {
      if (order.OrderColors && Array.isArray(order.OrderColors)) {
        const colorObj = order.OrderColors.find(
          (c) => sanitizeColor(c.Color) === sanitizedColor
        );
        if (colorObj && Array.isArray(colorObj.OrderQty)) {
          colorObj.OrderQty.forEach((sizeObj) => {
            // Each sizeObj is like { "XS": 32 }
            Object.values(sizeObj).forEach((qty) => {
              if (typeof qty === "number" && qty > 0) totalQty += qty;
            });
          });
        }
      }
    });
    res.json({ success: true, orderNo, color, colorOrderQty: totalQty });
  } catch (error) {
    console.error(
      `Error fetching color order qty for ${orderNo} / ${color}:`,
      error
    );
    res.status(500).json({
      success: false,
      message: "Server error while fetching color order qty."
    });
  }
};

// Get order numbers
export const getAfterIroningOrderNumbers = async (req, res) => {
  try {
      const orders = await AfterIroning.distinct("orderNo");
      res.json({ success: true, orderNumbers: orders });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch order numbers" });
    }
};

// Get order details by style number
export const getAfterIroningOrderbysize = async (req, res) => {
  const { orderNo } = req.params;
    const collection = ymProdConnection.db.collection("dt_orders");
  
    try {
      const orders = await collection.find({ Order_No: orderNo }).toArray();
  
      if (!orders || orders.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: `Style '${orderNo}' not found.` });
      }
  
      // Extract all available colors from OrderColors array
      const colorSet = new Set();
      orders.forEach((order) => {
        if (order.OrderColors && Array.isArray(order.OrderColors)) {
          order.OrderColors.forEach((colorObj) => {
            if (colorObj && colorObj.Color) {
              colorSet.add(colorObj.Color);
            }
          });
        }
      });
      const availableColors = Array.from(colorSet);
  
      const orderQty = orders.reduce(
        (sum, order) => sum + (order.TotalQty || 0),
        0
      );
      const buyerName = getBuyerFromMoNumber(orderNo);
  
      res.json({
        success: true,
        colors: availableColors,
        orderQty,
        buyer: buyerName
      });
    } catch (error) {
      console.error(`Error fetching order details for style ${orderNo}:`, error);
      res.status(500).json({
        success: false,
        message: "Server error while fetching order details."
      });
    }
};

// Get order details by order number
export const getAfterIroningOrderbyOrderNo = async (req, res) => {
  try {
      const { orderNo } = req.params;
      const orderData = await AfterIroning.findOne({ orderNo: orderNo });
  
      if (orderData) {
        res.json({
          success: true,
          orderNo: orderData.orderNo,
          colors: [orderData.color.orderDetails.color],
          orderQty: orderData.color.orderDetails.orderQty,
          buyer: orderData.color.orderDetails.buyer
        });
      } else {
        res.json({ success: false, message: "Order not found" });
      }
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch order details" });
    }
};

export const getAfterIroningSaveData = async (req, res) => {
  try {
    const { id } = req.params;
    const savedData = await AfterIroning.findById(id);
    if (savedData) {
      res.json({ success: true, savedData });
    } else {
      res.json({ success: false, message: "No saved data found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to load saved data" });
  }
};

export const saveAfterIroningAQLbySampleSize = async (req, res) => {
   try {
      const { orderNo } = req.body;
      // const sampleSizeNum = parseInt(sampleSize, 10);
  
      const firstOutputRecord = await QCWashingFirstOutput.findOne()
        .sort({ createdAt: -1 })
        .lean();
      const sampleSizeNum = parseInt(firstOutputRecord.quantity, 10);
  
      if (isNaN(sampleSizeNum) || sampleSizeNum <= 0) {
        return res.status(400).json({
          success: false,
          message: "A valid sample size must be provided."
        });
      }
  
      const buyer = await getBuyerFromMoNumber(orderNo);
      const aqlLevel = getAqlLevelForBuyer(buyer);
  
      const aqlChart = await AQLChart.findOne({
        Type: "General",
        Level: "II",
        SampleSize: { $gte: sampleSizeNum }
      })
        .sort({ SampleSize: 1 })
        .lean();
  
      if (!aqlChart) {
        return res.status(404).json({
          success: false,
          message: `No AQL chart found for a sample size of ${sampleSizeNum} or greater.`
        });
      }
  
      // Find the specific AQL entry for level 1.0 within the document.
      const aqlEntry = aqlChart.AQL.find((aql) => aql.level === aqlLevel);
  
      if (!aqlEntry) {
        return res.status(404).json({
          success: false,
          message: "AQL level  ${aqlLevel} not found for the matching chart."
        });
      }
  
      // Respond with the data in the format expected by the frontend.
      res.json({
        success: true,
        aqlData: {
          sampleSize: aqlChart.SampleSize, // Return the actual sample size from the chart
          acceptedDefect: aqlEntry.AcceptDefect,
          rejectedDefect: aqlEntry.RejectDefect,
          levelUsed: aqlLevel
        }
      });
    } catch (error) {
      console.error("AQL lookup by sample size error:", error);
      res.status(500).json({
        success: false,
        message: "Server error while fetching AQL details by sample size."
      });
    }
};

// AQL data endpoint
export const saveAfterIroningAQLData = async (req, res) => {
  try {
    const { lotSize, orderNo } = req.body;

    if (!lotSize || isNaN(lotSize)) {
      return res.status(400).json({
        success: false,
        message: "Lot size (wash Qty) is required and must be a number."
      });
    }
    const lotSizeNum = parseInt(lotSize, 10);

    const buyer = await getBuyerFromMoNumber(orderNo);
    const aqlLevel = getAqlLevelForBuyer(buyer);

    // Find the AQL chart document where the lot size falls within the defined range.
    const aqlChart = await AQLChart.findOne({
      Type: "General",
      Level: "II",
      "LotSize.min": { $lte: lotSizeNum },
      $or: [{ "LotSize.max": { $gte: lotSizeNum } }, { "LotSize.max": null }]
    }).lean();

    if (!aqlChart) {
      return res.status(404).json({
        success: false,
        message: "No AQL chart found for the given lot size."
      });
    }

    // Find the specific AQL entry for level  within the document.
    const aqlEntry = aqlChart.AQL.find((aql) => aql.level === aqlLevel);

    if (!aqlEntry) {
      return res.status(404).json({
        success: false,
        message: "AQL level  ${aqlLevel} not found for the matching chart."
      });
    }

    res.json({
      success: true,
      aqlData: {
        sampleSize: aqlChart.SampleSize,
        acceptedDefect: aqlEntry.AcceptDefect,
        rejectedDefect: aqlEntry.RejectDefect,
        levelUsed: aqlLevel
      }
    });
  } catch (error) {
    console.error("AQL calculation error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching AQL details."
    });
  }
};

function calculateMeasurementSizeSummary(measurementDetail) {
  if (!measurementDetail || !Array.isArray(measurementDetail.pcs)) {
    return {};
  }

  let checkedPcs = measurementDetail.pcs.length;
  let checkedPoints = 0;
  let totalPass = 0;
  let totalFail = 0;
  let plusToleranceFailCount = 0;
  let minusToleranceFailCount = 0;

  measurementDetail.pcs.forEach((pc) => {
    (pc.measurementPoints || []).forEach((point) => {
      checkedPoints++;
      if (point.result === "pass") totalPass++;
      if (point.result === "fail") {
        totalFail++;
        // Only count fail points for plus/minus tolerance
        const value =
          typeof point.measured_value_decimal === "number"
            ? point.measured_value_decimal
            : parseFloat(point.measured_value_decimal);
        const specs =
          typeof point.specs === "number"
            ? point.specs
            : parseFloat(point.specs);
        const tolMinus =
          typeof point.toleranceMinus === "number"
            ? point.toleranceMinus
            : parseFloat(point.toleranceMinus);
        const tolPlus =
          typeof point.tolerancePlus === "number"
            ? point.tolerancePlus
            : parseFloat(point.tolerancePlus);

        if (!isNaN(value) && !isNaN(specs)) {
          if (!isNaN(tolPlus) && value > tolPlus) plusToleranceFailCount++;
          if (!isNaN(tolMinus) && value < tolMinus) minusToleranceFailCount++;
        }
      }
    });
  });

  // Determine the correct wash type format
  const washType = measurementDetail.before_after_wash === 'Before Wash' ? 'beforeWash' : 
    measurementDetail.before_after_wash === 'After Ironing' ? 'afterIroning' :
    measurementDetail.before_after_wash;

  return {
    size: measurementDetail.size,
    before_after_wash: washType,
    kvalue: measurementDetail.kvalue,
    checkedPcs,
    checkedPoints,
    totalPass,
    totalFail,
    plusToleranceFailCount,
    minusToleranceFailCount
  };
}

// Save or update measurement details for a record
export const saveAfterIroningMeasurementData = async (req, res) => {
  try {
    const { recordId, measurementDetail } = req.body;
    
    if (!recordId || !measurementDetail) {
      return res.status(400).json({
        success: false,
        message: "Missing recordId or measurementDetail"
      });
    }
    
    if (!measurementDetail.before_after_wash || !measurementDetail.kvalue) {
      return res.status(400).json({
        success: false,
        message: "before_after_wash and kvalue are required in measurementDetail"
      });
    }

    const record = await AfterIroning.findById(recordId);
    if (!record) {
      return res.status(404).json({ 
        success: false, 
        message: "Record not found" 
      });
    }

    console.log(`Updating measurement for record ${recordId} (status: ${record.status})`);

    if (!record.measurementDetails) {
      record.measurementDetails = {
        measurement: [],
        measurementSizeSummary: []
      };
    }

    const washType = measurementDetail.before_after_wash;

    // Find existing measurement index
    const measurementIndex = record.measurementDetails.measurement.findIndex(
      (m) => 
        m.size === measurementDetail.size &&
        m.kvalue === measurementDetail.kvalue &&
        m.before_after_wash === washType
    );

    // Update or add measurement
    if (measurementIndex !== -1) {
      record.measurementDetails.measurement[measurementIndex] = measurementDetail;
      console.log(`Updated existing measurement at index ${measurementIndex}`);
    } else {
      record.measurementDetails.measurement.push(measurementDetail);
      console.log(`Added new measurement for size ${measurementDetail.size}, kvalue ${measurementDetail.kvalue}`);
    }
    
    // Find existing summary index
    let summaryIndex = record.measurementDetails.measurementSizeSummary.findIndex(
      (s) => 
        s.size === measurementDetail.size &&
        s.kvalue === measurementDetail.kvalue &&
        s.before_after_wash === washType
    );

    const summaryData = measurementDetail.summaryData || calculateMeasurementSizeSummary(measurementDetail);
    
    // Update or add summary
    if (summaryIndex !== -1) {
      record.measurementDetails.measurementSizeSummary[summaryIndex] = summaryData;
      console.log(`Updated existing summary at index ${summaryIndex}`);
    } else {
      record.measurementDetails.measurementSizeSummary.push(summaryData);
      console.log(`Added new summary for size ${measurementDetail.size}, kvalue ${measurementDetail.kvalue}`);
    }

    // CRITICAL FIX: Recalculate overall summary for all records (not just submitted)
    console.log('Recalculating overall summary...');
    
    // Recalculate top-level summary from measurementSizeSummary
    let totalCheckedPoint = 0;
    let totalPass = 0;
    let totalFail = 0;
    let totalCheckedPcs = 0;

    record.measurementDetails.measurementSizeSummary.forEach(sizeData => {
      totalCheckedPoint += (sizeData.checkedPoints || 0);
      totalPass += (sizeData.totalPass || 0);
      totalFail += (sizeData.totalFail || 0);
      totalCheckedPcs += (sizeData.checkedPcs || 0);
    });

    // Calculate pass rate
    const passRate = totalCheckedPoint > 0 
      ? Math.round((totalPass / totalCheckedPoint) * 100) 
      : 100;

    // Update top-level fields
    record.totalCheckedPoint = totalCheckedPoint;
    record.totalPass = totalPass;
    record.totalFail = totalFail;
    record.passRate = passRate;
    
    // Update totalCheckedPcs only if we have measurement data
    if (totalCheckedPcs > 0) {
      record.totalCheckedPcs = totalCheckedPcs;
    }

    // CRITICAL FIX: Recalculate overall result correctly
    const measurementResult = passRate >= 95 ? "Pass" : "Fail";
    const defectResult = record.defectDetails?.result || "Pass";
    
    console.log('Overall result recalculation:', {
      passRate,
      measurementResult,
      defectResult,
      reportType: record.reportType
    });

    // let newOverallResult;
    
    const newOverallResult = (passRate >= 95 && defectResult === "Pass") ? "Pass" : "Fail";
    
    record.overallFinalResult = newOverallResult;
    record.markModified('overallFinalResult');
    
    console.log('Updated overall summary:', {
      totalCheckedPoint,
      totalPass,
      totalFail,
      passRate,
      overallFinalResult: newOverallResult
    });
    
    record.savedAt = new Date();
    await record.save();

    console.log('Saved measurement details with summary:', {
      measurement: record.measurementDetails.measurement.length,
      summary: record.measurementDetails.measurementSizeSummary.length,
      recordStatus: record.status,
      finalOverallResult: record.overallFinalResult
    });

    res.json({
      success: true,
      message: "Measurement detail saved with summary",
      measurementDetails: record.measurementDetails,
      overallSummary: {
        totalCheckedPoint: record.totalCheckedPoint,
        totalPass: record.totalPass,
        totalFail: record.totalFail,
        passRate: record.passRate,
        overallFinalResult: record.overallFinalResult
      }
    });

  } catch (err) {
    console.error("Measurement save error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to save measurement detail",
      error: err.message
    });
  }
};

// Load color-specific data
export const loadAfterIroningColorData = async (req, res) => {
  try {
  const { orderNo, color } = req.params;
  const qcRecord = await AfterIroning.findOne({ orderNo: orderNo });

  if (qcRecord && qcRecord.colors) {
    const colorData = qcRecord.colors.find((c) => c.colorName === color);

    if (colorData) {
      // res.json({ success: true, colorData: colorData });
      res.json({
        success: true,
        colorData: {
          ...colorData,
          before_after_wash: qcRecord.before_after_wash,
          washQty: qcRecord.washQty,
          checkedQty: qcRecord.checkedQty,
          totalCheckedPoint: qcRecord.totalCheckedPoint,
          totalPass: qcRecord.totalPass,
          totalFail: qcRecord.totalFail,
          passRate: qcRecord.passRate
        }
      });
    } else {
      res.json({ success: false, message: "Color data not found" });
    }
  } else {
    res.json({ success: false, message: "No saved data found" });
  }
} catch (error) {
  console.error("Load color data error:", error);
  res
    .status(500)
    .json({ success: false, message: "Failed to load color data" });
}
};

  // Get specific submitted QC washing data by ID
export const getAfterIroningSubmittedData = async (req, res) => {
  try {
      const { id } = req.params;
  
      // Validate the ID format (assuming MongoDB ObjectId)
      if (!id || id.length !== 24) {
        return res.status(400).json({
          success: false,
          message: "Invalid ID format"
        });
      }
  
      const reportData = await AfterIroning.findById(id).lean();
  
      if (!reportData) {
        return res.status(404).json({
          success: false,
          message: "Report not found"
        });
      }
  
      // Transform the data to match the expected format for the modal
      const transformedData = {
        ...reportData,
        colorName: reportData.color, 
        formData: {
          result: reportData.overallFinalResult,
          remarks: reportData.defectDetails?.comment || "",
          measurements: reportData.measurementDetails?.measurement || []
        }
      };
  
      res.json({
        success: true,
        data: transformedData
      });
    } catch (error) {
      console.error("Error fetching QC washing report:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch report data",
        error: error.message
      });
    }
};

export const saveAfterIroning = async (req, res) => {
  try {
    const { orderNo, recordId, overallFinalResult } = req.body;
    
    if (!orderNo) {
      return res.status(400).json({ 
        success: false, 
        message: "orderNo is required" 
      });
    }

    // Find the record to submit
    let recordToSubmit;
    
    if (recordId) {
      recordToSubmit = await AfterIroning.findById(recordId);
    } else {
      recordToSubmit = await AfterIroning.findOne({
        orderNo,
        status: { $ne: "submitted" }
      }).sort({ updatedAt: -1 });
    }

    if (!recordToSubmit) {
      return res.status(404).json({
        success: false,
        message: "No record found to submit."
      });
    }

    // CRITICAL FIX: Always recalculate the final result on submission to ensure data integrity.
    // This uses the same logic as saveAfterIroningSummary.
    
    // 1. Calculate pass rate from the most recent data.
    const passRate = recordToSubmit.passRate ?? 100; // Use the already calculated passRate on the record.

    // 2. Get the defect result.
    const defectResult = recordToSubmit.defectDetails?.result || "Pass";

    // 3. Determine the final overall result.
    const newOverallFinalResult = (passRate >= 95 && defectResult === "Pass") ? "Pass" : "Fail";

    console.log('Final submission calculation:', {
      passRate,
      defectResult,
      finalResult: newOverallFinalResult
    });

    recordToSubmit.overallFinalResult = newOverallFinalResult;

    // Update status and submission timestamp
    recordToSubmit.isAutoSave = false;
    recordToSubmit.status = "submitted";
    recordToSubmit.submittedAt = new Date();
    recordToSubmit.savedAt = new Date();

    await recordToSubmit.save();

    res.json({
      success: true,
      submissionId: recordToSubmit._id,
      message: "After Ironing data submitted successfully"
    });

  } catch (error) {
    console.error("Submit error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit data",
      error: error.message
    });
  }
};

// function normalizeInspectionImagePath(img) {
//   if (!img) return "";

//   // If new upload, img.file will be handled by fileMap logic in your code

//   if (img.preview && typeof img.preview === "string") {
//     // If it's already a full URL, return as-is
//     if (img.preview.startsWith("http")) {
//       return img.preview;
//     }

//     // Convert relative paths to full URLs
//     if (img.preview.startsWith("./public/storage/")) {
//       const relativePath = img.preview.replace("./public/storage/", "");
//       return `${
//         process.env.BASE_URL || "http://localhost:3000"
//       }/storage/${relativePath}`;
//     }

//     if (img.preview.startsWith("/storage/")) {
//       return `${process.env.BASE_URL || "http://localhost:3000"}${img.preview}`;
//     }

//     if (img.preview.startsWith("./public/")) {
//       return img.preview;
//     }
//     if (img.preview.startsWith("/public/")) {
//       return "." + img.preview;
//     }
//     if (img.preview.startsWith("/storage/")) {
//       return "./public" + img.preview; 
//     }
//     if (img.preview.startsWith("http")) {
//       try {
//         const url = new URL(img.preview);
//         return "./public" + url.pathname;
//       } catch (e) {
//         return img.preview;
//       }
//     }

//     if (!img.preview.includes("/")) {
//       return `./public/storage/Aftre_Irorning_images/inspection/${img.preview}`;
//     }

//     if (img.preview[0] !== "/") {
//       return `./public/storage/After_Irorning_images/inspection/${img.preview}`;
//     }

//     // Fallback
//     return img.preview;
//   }

//   if (img.name && !img.name.includes("/")) {
//     return `./public/storage/After_Iroring_images/inspection/${img.name}`;
//   }

//   return "";
// }

// // Add this helper function at the top of your file to get the server base URL
// function getServerBaseUrl(req) {
//   const protocol = req.protocol || "http";
//   const host = req.get("host") || "localhost:3000";
//   return `${protocol}://${host}`;
// }

// // Helper function to group checkpoint data
// function groupCheckpointData(checkpointInspectionData) {
//   const groupedData = [];
//   const mainCheckpoints = new Map();
  
//   // First pass: collect all main checkpoints
//   checkpointInspectionData.forEach(item => {
//     if (item.type === 'main') {
//       mainCheckpoints.set(item.checkpointId, {
//         id: item.id,
//         checkpointId: item.checkpointId,
//         name: item.name,
//         optionType: item.optionType,
//         decision: item.decision,
//         remark: item.remark,
//         comparisonImages: item.comparisonImages || [],
//         subPoints: [] // Initialize empty sub-points array
//       });
//     }
//   });
  
//   // Second pass: add sub-points to their parent main checkpoints
//   checkpointInspectionData.forEach(item => {
//     if (item.type === 'sub') {
//       const mainCheckpoint = mainCheckpoints.get(item.checkpointId);
//       if (mainCheckpoint) {
//         mainCheckpoint.subPoints.push({
//           id: item.id,
//           subPointId: item.subPointId,
//           name: item.name,
//           optionType: item.optionType,
//           decision: item.decision,
//           remark: item.remark,
//           comparisonImages: item.comparisonImages || []
//         });
//       }
//     }
//   });
  
//   // Convert map to array
//   return Array.from(mainCheckpoints.values());
// }

// Get After Ironing Defects
export const getAfterIroningDefects = async (req, res) => {
  try {
    // TODO: Replace this with your actual database query to fetch defects
    const defects = [
      { id: 1, name: "Broken Stitch" },
      { id: 2, name: "Open Seam" },
      { id: 3, name: "Incorrect Color" },
    ];
    res.json({ success: true, defects: defects });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch defects" });
  }
};

// Get After Ironing Checklist
export const getAfterIroningChecklist = async (req, res) => {
  try {
    // TODO: Replace this with your actual database query to fetch the checklist
    const checklist = [
      { id: 1, point: "Check for stains" },
      { id: 2, point: "Verify label placement" },
    ];
    res.json({ success: true, checklist: checklist });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch checklist" });
  }
};

// Get After Ironing checkpoint definitions
export const getAfterIroningCheckpointDefinitions = async (req, res) => {
  try {
    // For now, return empty array - this should be replaced with actual checkpoint definitions
    const checkpointDefinitions = [];
    res.json(checkpointDefinitions);
  } catch (error) {
    console.error("Failed to fetch After Ironing checkpoint definitions:", error);
    res.status(500).json({ success: false, message: "Failed to fetch checkpoint definitions" });
  }
};

// Delete After Ironing record
export const deleteAfterIroningRecord = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Record ID is required"
      });
    }

    const deletedRecord = await AfterIroning.findByIdAndDelete(id);
    
    if (!deletedRecord) {
      return res.status(404).json({
        success: false,
        message: "Record not found"
      });
    }

    res.json({
      success: true,
      message: "After Ironing record deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting After Ironing record:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting record",
      error: error.message
    });
  }
};

export const checkAfterIroningRecord = async (req, res) => {
  try {
    const { orderNo, color, factoryName, reportType } = req.body;

    if (!orderNo) {
      return res.status(400).json({
        success: false,
        message: "Order No is required"
      });
    }

    // Build query to find matching QC Washing record
    const query = {
      orderNo: orderNo,
      reportType:"SOP",
      status: { $in: ['submitted', 'approved'] } // Only check completed records
    };

    

    // Find the most recent matching record
    const qcWashingRecord = await QCWashing.findOne(query)
      .sort({ createdAt: -1 })
      .lean();

    if (qcWashingRecord) {
      res.json({
        success: true,
        exists: true,
        message: "QC Washing record found - order can proceed to After Ironing",
        record: {
          id: qcWashingRecord._id,
          orderNo: qcWashingRecord.orderNo,
          color: qcWashingRecord.color,
          factoryName: qcWashingRecord.factoryName,
          reportType: qcWashingRecord.reportType,
          status: qcWashingRecord.status,
          overallFinalResult: qcWashingRecord.overallFinalResult,
          submittedAt: qcWashingRecord.submittedAt,
          createdAt: qcWashingRecord.createdAt
        }
      });
    } else {
      res.json({
        success: false,
        exists: false,
        message: "No QC Washing record found - order must be washed first before After Ironing inspection",
        error: "WASHING_NOT_COMPLETED"
      });
    }

  } catch (error) {
    console.error("Error checking QC Washing record:", error);
    res.status(500).json({
      success: false,
      message: "Server error while checking QC Washing record",
      error: error.message
    });
  }
};

// Get all submitted After Ironing data
export const getAllSubmittedAfterIroningData = async (req, res) => {
  try {
    const submittedRecords = await AfterIroning.find({
      status: { $in: ['submitted', 'approved'] }
    })
    .sort({ submittedAt: -1, createdAt: -1 })
    .lean();

    res.json({
      success: true,
      data: submittedRecords,
      count: submittedRecords.length
    });
  } catch (error) {
    console.error("Error fetching submitted After Ironing data:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching submitted After Ironing data",
      error: error.message
    });
  }
};

// Get QC Washing measurement data for comparison
export const getQCWashingMeasurementData = async (req, res) => {
  try {
    const { orderNo, date, reportType, factoryName } = req.query;

    if (!orderNo) {
      return res.status(400).json({
        success: false,
        message: "Order number is required"
      });
    }

    // Build query to find matching QC Washing record
    const query = {
      orderNo: orderNo,
      status: { $in: ['submitted', 'approved'] }
    };

    // Add optional filters if provided
    if (date) {
      const dateValue = new Date(date.length === 10 ? date + "T00:00:00.000Z" : date);
      query.date = dateValue;
    }

    if (reportType) {
      query.reportType = reportType;
    }

    if (factoryName) {
      query.factoryName = factoryName;
    }

    // Find the most recent matching QC Washing record
    const qcWashingRecord = await QCWashing.findOne(query)
      .sort({ createdAt: -1 })
      .lean();

    if (!qcWashingRecord) {
      return res.json({
        success: false,
        message: "No matching QC Washing record found",
        data: null
      });
    }

    // FIXED: Extract measurement data with proper mapping
    const measurementData = {
      beforeWash: [],
      afterWash: [],
      afterIroning: [] // Add this for After Ironing data
    };

    if (qcWashingRecord.measurementDetails?.measurement) {
      qcWashingRecord.measurementDetails.measurement.forEach(measurement => {
        // Create a copy of the measurement with normalized before_after_wash
        const normalizedMeasurement = { ...measurement };
        
        // Map the before_after_wash values to what the frontend expects
        if (measurement.before_after_wash === 'beforeWash' || measurement.before_after_wash === 'Before Wash') {
          normalizedMeasurement.before_after_wash = 'beforeWash';
          measurementData.beforeWash.push(normalizedMeasurement);
        } else if (measurement.before_after_wash === 'afterWash' || measurement.before_after_wash === 'After Wash') {
          // CRITICAL FIX: Map afterWash to afterIroning for After Ironing component
          normalizedMeasurement.before_after_wash = 'afterIroning';
          measurementData.afterIroning.push(normalizedMeasurement);
          
          // Also keep the original mapping for backward compatibility
          measurementData.afterWash.push({ ...measurement });
        } else if (measurement.before_after_wash === 'afterIroning' || measurement.before_after_wash === 'After Ironing') {
          normalizedMeasurement.before_after_wash = 'afterIroning';
          measurementData.afterIroning.push(normalizedMeasurement);
        }
      });
    }

    console.log('Measurement data mapping:', {
      beforeWash: measurementData.beforeWash.length,
      afterWash: measurementData.afterWash.length,
      afterIroning: measurementData.afterIroning.length
    });

    res.json({
      success: true,
      data: measurementData,
      recordInfo: {
        id: qcWashingRecord._id,
        orderNo: qcWashingRecord.orderNo,
        date: qcWashingRecord.date,
        reportType: qcWashingRecord.reportType,
        factoryName: qcWashingRecord.factoryName
      }
    });

  } catch (error) {
    console.error("Error fetching QC Washing measurement data:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching QC Washing measurement data",
      error: error.message
    });
  }
};

export const getQCWashingDataForAfterIroning = async (req, res) => {
  try {
    const { orderNo, color, reportType, factoryName } = req.query;

    if (!orderNo) {
      return res.status(400).json({
        success: false,
        message: "Order number is required"
      });
    }

    // Build query to find matching QC Washing record
    const query = {
      orderNo: orderNo,
      status: { $in: ['submitted', 'approved'] }
    };

    // Add optional filters
    if (color) query.color = color;
    if (reportType) query.reportType = reportType;
    if (factoryName) query.factoryName = factoryName;

    // Find the most recent matching QC Washing record
    const qcWashingRecord = await QCWashing.findOne(query)
      .sort({ createdAt: -1 })
      .lean();

    if (!qcWashingRecord) {
      return res.json({
        success: false,
        message: "No matching QC Washing record found",
        data: { afterIroning: [] }
      });
    }

    // Extract and transform measurement data specifically for After Ironing
    const afterIroningData = [];

    if (qcWashingRecord.measurementDetails?.measurement) {
      qcWashingRecord.measurementDetails.measurement.forEach(measurement => {
        // Only process After Wash data (which becomes After Ironing data)
        if (measurement.before_after_wash === 'afterWash' || measurement.before_after_wash === 'After Wash') {
          const transformedMeasurement = {
            ...measurement,
            before_after_wash: 'afterIroning', // Transform to afterIroning
            // Ensure selectedRows is properly included
            selectedRows: measurement.selectedRows || [],
            // Include other important fields
            size: measurement.size,
            kvalue: measurement.kvalue || 'NA',
            qty: measurement.qty || 3
          };
          
          console.log(`Transforming measurement for size ${measurement.size}:`, {
            originalBeforeAfterWash: measurement.before_after_wash,
            newBeforeAfterWash: transformedMeasurement.before_after_wash,
            selectedRowsLength: transformedMeasurement.selectedRows.length,
            size: transformedMeasurement.size,
            kvalue: transformedMeasurement.kvalue
          });
          
          afterIroningData.push(transformedMeasurement);
        }
      });
    }

    console.log(`Found ${afterIroningData.length} After Wash measurements to use as After Ironing baseline`);

    res.json({
      success: true,
      data: { afterIroning: afterIroningData },
      recordInfo: {
        id: qcWashingRecord._id,
        orderNo: qcWashingRecord.orderNo,
        color: qcWashingRecord.color,
        date: qcWashingRecord.date,
        reportType: qcWashingRecord.reportType,
        factoryName: qcWashingRecord.factoryName
      }
    });

  } catch (error) {
    console.error("Error fetching QC Washing data for After Ironing:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching QC Washing data for After Ironing",
      error: error.message
    });
  }
};

import {
QCWashing, 
ymProdConnection,
AQLChart,
QCWashingFirstOutput,              
} from "../../MongoDB/dbConnectionController.js";
import { getBuyerFromMoNumber, getAqlLevelForBuyer} from "../../../helpers/helperFunctions.js";
import fs from "fs";
import { 
  __backendDir, 
  // __dirname 
} from "../../../Config/appConfig.js";
import path from "path";

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

export const getQCWashingMeasurementData = async (req, res) => {
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

export const findQCWashingExistingRecord = async (req, res) => {
  try {
      const {
        orderNo,
        date,
        color,
        washType,
        before_after_wash,
        factoryName,
        reportType,
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
        washType,
        before_after_wash,
        factoryName,
        reportType,
        "inspector.empId": inspectorId 
      };
  
      Object.keys(query).forEach(
        (key) =>
          (query[key] === undefined || query[key] === "") && delete query[key]
      );
  
      const record = await QCWashing.findOne(query);
  
      if (record) {
        res.json({ success: true, exists: true, record });
      } else {
        res.json({ success: true, exists: false });
      }
    } catch (err) {
      console.error("Find-existing error:", err);
      res.status(500).json({ success: false, message: "Server error." });
    }
};

//New QC_Washing Endpoints
export const saveQCWashingOrderData = async (req, res) => {
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
  
      // Build the query for uniqueness - same as find-existing
      const query = {
        orderNo: formData.orderNo,
        date: dateValue,
        color: formData.color,
        washType: formData.washType,
        before_after_wash: formData.before_after_wash,
        factoryName: formData.factoryName,
        reportType: formData.reportType,
        "inspector.empId": userId
      };
  
      Object.keys(query).forEach(
        (key) =>
          (query[key] === undefined || query[key] === "") && delete query[key]
      );
  
      // Find existing record for THIS specific inspector
      let record = await QCWashing.findOne(query);
  
      if (!record) {
        record = new QCWashing({
          ...formData,
          inspector: {
            empId: userId
          },
          colorOrderQty: formData.colorOrderQty,
          userId,
          savedAt,
          status: "processing"
        });
      } else {
        Object.assign(record, formData);
        record.inspector.empId = userId;
        record.userId = userId;
        record.savedAt = savedAt;
        record.status = "processing";
      }
  
      await record.save();
  
      res.json({ success: true, id: record._id });
    } catch (err) {
      console.error("OrderData-save error:", err);
      res.status(500).json({
        success: false,
        message: "Server error while saving order data."
      });
    }
};

export const saveQCWashingInspectionData = async (req, res) => {
  const standardValues = JSON.parse(req.body.standardValues || "{}");
    const actualValues = JSON.parse(req.body.actualValues || "{}");
    const machineStatus = JSON.parse(req.body.machineStatus || "{}");
    
    try {
      const { recordId } = req.body;
      const inspectionData = JSON.parse(req.body.inspectionData || "[]");
      const processData = JSON.parse(req.body.processData || "{}");
      const defectData = JSON.parse(req.body.defectData || "[]");
      const checkpointInspectionData = JSON.parse(req.body.checkpointInspectionData || "[]");
      const timeCoolEnabled = JSON.parse(req.body.timeCoolEnabled || "false");
      const timeHotEnabled = JSON.parse(req.body.timeHotEnabled || "false");

      if (!recordId) {
        return res
          .status(400)
          .json({ success: false, message: "recordId is required" });
      }

      // Get server base URL
      const serverBaseUrl = getServerBaseUrl(req);

      // Handle file uploads for both regular inspection and checkpoint images
      const uploadDir = path.join(
        __backendDir,
        "./public/storage/qc_washing_images/inspection"
      );
      const fileMap = {};
      
      for (const file of req.files || []) {
        const fileExtension = path.extname(file.originalname);
        const newFilename = `inspection-${Date.now()}-${Math.round(
          Math.random() * 1e9
        )}${fileExtension}`;
        const fullFilePath = path.join(uploadDir, newFilename);
        await fs.promises.writeFile(fullFilePath, file.buffer);
        fileMap[
          file.fieldname
        ] = `${serverBaseUrl}/storage/qc_washing_images/inspection/${newFilename}`;
      }

      // Find or create the record
      let record = await QCWashing.findById(recordId);
      if (!record) {
        record = new QCWashing({ _id: recordId });
      }

      const machineProcesses = [];
      const machineTypes = {
        "Washing Machine": ["temperature", "time", "silicon", "softener"],
        "Tumble Dry": ["temperature", "timeCool", "timeHot"]
      };

      Object.entries(machineTypes).forEach(([machineType, parameters]) => {
        const machineProcess = { machineType };
        parameters.forEach((param) => {
          const actualVal = actualValues[machineType]?.[param];
          const standardVal = standardValues[machineType]?.[param];
          machineProcess[param] = {
            actualValue:
              actualVal === null || actualVal === undefined ? "" : actualVal,
            standardValue:
              standardVal === null || standardVal === undefined
                ? ""
                : standardVal,
            status: {
              ok: machineStatus[machineType]?.[param]?.ok || false,
              no: machineStatus[machineType]?.[param]?.no || false
            }
          };
        });
        machineProcesses.push(machineProcess);
      });

      // Handle inspection images with full server URLs
      if (inspectionData) {
        inspectionData.forEach((item, idx) => {
          if (item.comparisonImages) {
            item.comparisonImages = item.comparisonImages.map((img, imgIdx) => {
              const newImageUrl = fileMap[`comparisonImages_${idx}_${imgIdx}`];
              if (newImageUrl) {
                return newImageUrl;
              }
              if (
                typeof img === "string" &&
                (img.startsWith("http://") || img.startsWith("https://"))
              ) {
                return img;
              }
              if (typeof img === "string" && img.startsWith("./")) {
                return `${serverBaseUrl}${img.replace("./", "/")}`;
              }
              if (typeof img === "object" && img !== null && img.name) {
                if (
                  img.name.startsWith("http://") ||
                  img.name.startsWith("https://")
                ) {
                  return img.name;
                }
                if (img.name.startsWith("./")) {
                  return `${serverBaseUrl}${img.name.replace("./", "/")}`;
                }
                return img.name;
              }
              return img || "";
            });
          }
        });
      }

      // Handle checkpoint images and group the data
      if (checkpointInspectionData) {
        checkpointInspectionData.forEach((item, idx) => {
          if (item.comparisonImages) {
            item.comparisonImages = item.comparisonImages.map((img, imgIdx) => {
              const newImageUrl = fileMap[`checkpointImages_${idx}_${imgIdx}`];
              if (newImageUrl) {
                return newImageUrl;
              }
              return normalizeInspectionImagePath(img);
            });
          }
        });
      }

      // Group checkpoint data with sub-points nested under main checkpoints
      const groupedCheckpointData = groupCheckpointData(checkpointInspectionData);

      // Build the inspection details
      record.inspectionDetails = {
        ...record.inspectionDetails,
        checkedPoints: (inspectionData || []).map((item, idx) => ({
          pointName: item.checkedList,
          decision: item.decision,
          comparison: (item.comparisonImages || []).map((img, imgIdx) => {
            if (fileMap[`comparisonImages_${idx}_${imgIdx}`]) {
              return fileMap[`comparisonImages_${idx}_${imgIdx}`];
            }
            return normalizeInspectionImagePath(img);
          }),
          remark: item.remark
        })),
        // Use grouped checkpoint data instead of flat array
        checkpointInspectionData: groupedCheckpointData,
        machineProcesses: machineProcesses,
        parameters: (defectData || []).map((item) => ({
          parameterName: item.parameter,
          checkedQty: item.checkedQty,
          defectQty: item.failedQty,
          passRate: item.passRate,
          result: item.result,
          remark: item.remark
        })),
        // Add machine settings
        timeCoolEnabled,
        timeHotEnabled
      };

      record.savedAt = new Date();
      record.status = "processing";

      await record.save();

      res.json({
        success: true,
        message: "Inspection data saved",
        data: record
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server error" });
    }
};

// Get saved sizes for a specific order and color
export const getqcwashingSavedColor = async (req, res) => {
  try {
    const { orderNo, color } = req.params;
    
    // Decode the color parameter from URL
    const decodedColor = decodeURIComponent(color);
    
    // Try to find record with exact color match (case-insensitive)
    const qcRecord = await QCWashing.findOne({
      orderNo: orderNo,
      $or: [
        { colorName: { $regex: new RegExp(`^${decodedColor}$`, 'i') } },
        { color: { $regex: new RegExp(`^${decodedColor}$`, 'i') } }
      ],
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
export const updateQCWashingInspectionData = async (req, res) => {
  const standardValues = JSON.parse(req.body.standardValues || "{}");
    const actualValues = JSON.parse(req.body.actualValues || "{}");
    const machineStatus = JSON.parse(req.body.machineStatus || "{}");
    
    try {
      const { recordId } = req.body;
      const inspectionData = JSON.parse(req.body.inspectionData || "[]");
      const processData = JSON.parse(req.body.processData || "{}");
      const defectData = JSON.parse(req.body.defectData || "[]");
      const checkpointInspectionData = JSON.parse(req.body.checkpointInspectionData || "[]");
      const timeCoolEnabled = JSON.parse(req.body.timeCoolEnabled || "false");
      const timeHotEnabled = JSON.parse(req.body.timeHotEnabled || "false");

      if (!recordId) {
        return res
          .status(400)
          .json({ success: false, message: "recordId is required" });
      }

      // Get server base URL
      const serverBaseUrl = getServerBaseUrl(req);

      // Handle file uploads
      const uploadDir = path.join( 
        __backendDir,
        "./public/storage/qc_washing_images/inspection"
      );
      const fileMap = {};
      
      for (const file of req.files || []) {
        const fileExtension = path.extname(file.originalname);
        const newFilename = `inspection-${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;
        const fullFilePath = path.join(uploadDir, newFilename);
        await fs.promises.writeFile(fullFilePath, file.buffer);
        fileMap[
          file.fieldname
        ] = `${serverBaseUrl}/storage/qc_washing_images/inspection/${newFilename}`;
      }

      // Find the record
      let record = await QCWashing.findById(recordId);
      if (!record) {
        return res
          .status(404)
          .json({ success: false, message: "Record not found for update" });
      }

      // Build machine processes with the new structure
      const machineProcesses = [];
      const machineTypes = {
        "Washing Machine": ["temperature", "time", "silicon", "softener"],
        "Tumble Dry": ["temperature", "timeCool", "timeHot"]
      };

      Object.entries(machineTypes).forEach(([machineType, parameters]) => {
        const machineProcess = { machineType };
        parameters.forEach((param) => {
          const actualVal = actualValues[machineType]?.[param];
          const standardVal = standardValues[machineType]?.[param];
          machineProcess[param] = {
            actualValue:
              actualVal === null || actualVal === undefined ? "" : actualVal,
            standardValue:
              standardVal === null || standardVal === undefined
                ? ""
                : standardVal,
            status: {
              ok: machineStatus[machineType]?.[param]?.ok || false,
              no: machineStatus[machineType]?.[param]?.no || false
            }
          };
        });
        machineProcesses.push(machineProcess);
      });

      // Handle inspection images with full server URLs (same logic as save)
      if (inspectionData) {
        inspectionData.forEach((item, idx) => {
          if (item.comparisonImages) {
            item.comparisonImages = item.comparisonImages.map((img, imgIdx) => {
              const newImageUrl = fileMap[`comparisonImages_${idx}_${imgIdx}`];
              if (newImageUrl) {
                return newImageUrl;
              }
              return img;
            });
          }
        });
      }

      // Handle checkpoint images
      if (checkpointInspectionData) {
        checkpointInspectionData.forEach((item, idx) => {
          if (item.comparisonImages) {
            item.comparisonImages = item.comparisonImages.map((img, imgIdx) => {
              const newImageUrl = fileMap[`checkpointImages_${idx}_${imgIdx}`];
              if (newImageUrl) {
                return newImageUrl;
              }
              return img;
            });
          }
        });
      }

      // Group checkpoint data with sub-points nested under main checkpoints
      const groupedCheckpointData = groupCheckpointData(checkpointInspectionData);

      // Build the inspection details
      record.inspectionDetails = {
        ...record.inspectionDetails,
        checkedPoints: (inspectionData || []).map((item, idx) => {
          const images = (item.comparisonImages || []).map((img, imgIdx) => {
            if (fileMap[`comparisonImages_${idx}_${imgIdx}`]) {
              return fileMap[`comparisonImages_${idx}_${imgIdx}`];
            }
            return normalizeInspectionImagePath(img);
          });

          return {
            pointName: item.checkedList,
            decision: item.decision,
            comparison: images,
            remark: item.remark
          };
        }),
        // Use grouped checkpoint data instead of flat array
        checkpointInspectionData: groupedCheckpointData,
        machineProcesses: machineProcesses,
        parameters: (defectData || []).map((item) => ({
          parameterName: item.parameter,
          checkedQty: item.checkedQty,
          defectQty: item.failedQty,
          passRate: item.passRate,
          result: item.result,
          remark: item.remark
        })),
        // Update machine settings
        timeCoolEnabled,
        timeHotEnabled
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
export const saveQCWashingDefectData = async (req, res) => {
  try {
      const { recordId } = req.body;
      const defectDetails = JSON.parse(req.body.defectDetails || "{}");

      if (!recordId)
        return res
          .status(400)
          .json({ success: false, message: "Missing recordId" });
      // Get server base URL
      const serverBaseUrl = getServerBaseUrl(req);

      // Ensure upload directory exists
      const uploadDir = path.join(__backendDir, 
        "./public/storage/qc_washing_images/defect"
      ); 

      // Map uploaded files by fieldname and write them to disk
      const fileMap = {};
      for (const file of req.files || []) {
        let fileExtension = path.extname(file.originalname);
        if (!fileExtension) {
          fileExtension = ".jpg";
        }
        const newFilename = `defect-${Date.now()}-${Math.round(
          Math.random() * 1e9
        )}${fileExtension}`;
        const fullFilePath = path.join(uploadDir, newFilename);
        await fs.promises.writeFile(fullFilePath, file.buffer);
        fileMap[
          file.fieldname
        ] = `${serverBaseUrl}/storage/qc_washing_images/defect/${newFilename}`;
      }

      // Attach image URLs to defectDetails.defectsByPc and additionalImages
      if (defectDetails.defectsByPc) {
        defectDetails.defectsByPc.forEach((pc, pcIdx) => {
          (pc.pcDefects || []).forEach((defect, defectIdx) => {
            if (defect.defectImages) {
              defect.defectImages = defect.defectImages.map((img, imgIdx) => {
                // Return new uploaded image URL
                const newImageUrl =
                  fileMap[`defectImages_${pcIdx}_${defectIdx}_${imgIdx}`];
                if (newImageUrl) {
                  return newImageUrl;
                }

                // Handle existing images
                if (
                  typeof img === "string" &&
                  (img.startsWith("http://") || img.startsWith("https://"))
                ) {
                  return img; // Already a full URL
                }

                if (typeof img === "string" && img.startsWith("./")) {
                  return `${serverBaseUrl}${img.replace("./", "/")}`;
                }

                if (typeof img === "object" && img !== null && img.name) {
                  if (
                    img.name.startsWith("http://") ||
                    img.name.startsWith("https://")
                  ) {
                    return img.name;
                  }
                  if (img.name.startsWith("./")) {
                    return `${serverBaseUrl}${img.name.replace("./", "/")}`;
                  }
                  return img.name;
                }

                return img || "";
              });
            }
          });
        });
      }

      if (defectDetails.additionalImages) {
        defectDetails.additionalImages = defectDetails.additionalImages.map(
          (img, imgIdx) => {
            // Return new uploaded image URL
            const newImageUrl = fileMap[`additionalImages_${imgIdx}`];
            if (newImageUrl) {
              return newImageUrl;
            }

            // Handle existing images
            if (
              typeof img === "string" &&
              (img.startsWith("http://") || img.startsWith("https://"))
            ) {
              return img; // Already a full URL
            }

            if (typeof img === "string" && img.startsWith("./")) {
              return `${serverBaseUrl}${img.replace("./", "/")}`;
            }

            if (typeof img === "object" && img !== null && img.name) {
              if (
                img.name.startsWith("http://") ||
                img.name.startsWith("https://")
              ) {
                return img.name;
              }
              if (img.name.startsWith("./")) {
                return `${serverBaseUrl}${img.name.replace("./", "/")}`;
              }
              return img.name;
            }

            return img || "";
          }
        );
      }

      // Save to DB
      const doc = await QCWashing.findByIdAndUpdate(
        recordId,
        { defectDetails: defectDetails, updatedAt: new Date() },
        { new: true }
      );

      if (!doc)
        return res
          .status(404)
          .json({ success: false, message: "Record not found" });

      res.json({ success: true, data: doc.defectDetails });
    } catch (err) {
      console.error("Defect details save error:", err);
      res.status(500).json({ success: false, message: err.message });
    }
};

export const updateQCWashingDefectData = async (req, res) => {
  try {
      const { recordId } = req.body;
      const defectDetails = JSON.parse(req.body.defectDetails || "{}");
      if (!recordId)
        return res
          .status(400)
          .json({ success: false, message: "Missing recordId" });

      // Get server base URL
      const serverBaseUrl = getServerBaseUrl(req);

      // Ensure upload directory exists
      const uploadDir = path.join(__backendDir, 
        "./public/storage/qc_washing_images/defect"
      ); 

      // Map uploaded files by fieldname and write them to disk
      const fileMap = {};
      for (const file of req.files || []) {
        let fileExtension = path.extname(file.originalname);
        if (!fileExtension) {
          // fallback to .jpg if no extension is found
          fileExtension = ".jpg";
        }
        const newFilename = `defect-${Date.now()}-${Math.round(
          Math.random() * 1e9
        )}${fileExtension}`;
        const fullFilePath = path.join(uploadDir, newFilename);
        await fs.promises.writeFile(fullFilePath, file.buffer);
        fileMap[
          file.fieldname
        ] = `${serverBaseUrl}/storage/qc_washing_images/defect/${newFilename}`;
      }

      // Attach image URLs to defectDetails.defectsByPc and additionalImages
      if (defectDetails.defectsByPc) {
        defectDetails.defectsByPc.forEach((pc, pcIdx) => {
          (pc.pcDefects || []).forEach((defect, defectIdx) => {
            if (defect.defectImages) {
              defect.defectImages = defect.defectImages.map((img, imgIdx) => {
                return (
                  fileMap[`defectImages_${pcIdx}_${defectIdx}_${imgIdx}`] || img
                );
              });
            }
          });
        });
      }
      if (defectDetails.additionalImages) {
        defectDetails.additionalImages = defectDetails.additionalImages.map(
          (img, imgIdx) => {
            return fileMap[`additionalImages_${imgIdx}`] || img;
          }
        );
      }

      // Save to DB
      const doc = await QCWashing.findByIdAndUpdate(
        recordId,
        { defectDetails: defectDetails, updatedAt: new Date() },
        { new: true }
      );
      if (!doc)
        return res
          .status(404)
          .json({ success: false, message: "Record not found" });
      res.json({ success: true, data: doc.defectDetails });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
};

export const savedMeasurementDataSpec = async (req, res) => {
  try {
    const { styleNo, color, reportType, washType, factory } = req.body;

    const collection = ymProdConnection.db.collection("qcwashings");

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

    // For After Wash requests, specifically look for Before Wash data
    if (washType === "Before Wash") {
      query.before_after_wash = "Before Wash";
    }

    // Try to find all matching records first (without reportType and factory filters)
    const basicQuery = {
      $or: [{ orderNo: styleNo }, { style: styleNo }],
      color: color
    };

    if (washType === "Before Wash") {
      basicQuery.before_after_wash = "Before Wash";
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

            // Create a structure that matches what the frontend expects
            extractedMeasurementPoints.push({
              size: measurement.size,
              kvalue: measurement.kvalue,
              before_after_wash: measurement.before_after_wash,
              selectedRows: measurement.selectedRows || [],
              measurementPointNames: pointNames,
              // Include the original structure for compatibility
              ...measurement
            });
          }
        }
      });

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
export const getqcwashingOrderSizes = async (req, res) => {
  const { orderNo, color } = req.params;

  // Sanitizer function for color
  const sanitizeColor = (colorInput) => {
    if (!colorInput || typeof colorInput !== 'string') {
      return '';
    }
    
    return colorInput
      .trim()                    // Remove leading/trailing whitespace
      .toLowerCase()             // Convert to lowercase for consistent comparison
      .replace(/[^a-z0-9\s-]/gi, '') // Remove special characters, keep alphanumeric, spaces, and hyphens
      .replace(/\s+/g, ' ');     // Replace multiple spaces with single space
  };

  // Apply sanitizer to color
  const sanitizedColor = sanitizeColor(color);

  // Validate sanitized color
  if (!sanitizedColor) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid color parameter provided." });
  }

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
        const matchingColor = order.OrderColors.find(
          (c) => sanitizeColor(c.Color) === sanitizedColor // Use sanitized comparison
        );

        if (matchingColor && matchingColor.OrderQty) {
          matchingColor.OrderQty.forEach((entry) => {
            const sizeName = Object.keys(entry)[0];
            const quantity = entry[sizeName];

            if (quantity > 0) {
              const cleanSize = sizeName.split(";")[0].trim();
              sizes.add(cleanSize);
            }
          });
        }
      }
    });

    // Convert Set to Array and return
    return res.status(200).json({
      success: true,
      orderNo,
      color: sanitizedColor,
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
  const { orderNo, color } = req.params;
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
      
      // Check various possible locations for measurement data

      // Check various possible locations for measurement data
      if (order.MeasurementSpecs && Array.isArray(order.MeasurementSpecs)) {
        measurementSpecs = order.MeasurementSpecs;
      } else if (order.Specs && Array.isArray(order.Specs)) {
        measurementSpecs = order.Specs;
      } else if (order.OrderColors) {
        const colorObj = order.OrderColors.find(
          (c) => c.Color.toLowerCase() === color.toLowerCase()
        );
        if (colorObj && colorObj.MeasurementSpecs) {
          measurementSpecs = colorObj.MeasurementSpecs;
        } else if (colorObj && colorObj.Specs) {
          measurementSpecs = colorObj.Specs;
        }
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

export const saveqwashingSummary = async (req, res) => {
    try {
        const { recordId } = req.params;
        const summary = req.body.summary || {};
    
        const qcRecord = await QCWashing.findById(recordId);
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
    
        // 4. Determine measurement result based on 95% threshold
        let measurementResult = "Pass";
        if (totalMeasurementPoints > 0) {
          // Use 95% pass rate threshold for measurement result
          measurementResult = passRate >= 95 ? "Pass" : "Fail";
        }
    
        // 5. Determine defect result based on current data and AQL
        let defectResult;
        const aql = qcRecord.aql?.[0];
        
        if (aql && typeof aql.acceptedDefect === "number") {
          // Use AQL logic
          defectResult = totalDefectCount <= aql.acceptedDefect ? "Pass" : "Fail";
        } else {
          // Fallback: use saved defect result or assume Pass if no defects
          defectResult =
            qcRecord.defectDetails?.result ||
            (totalDefectCount === 0 ? "Pass" : "Fail");
        }
    
        // 6. Calculate FRESH overall result
        let newOverallFinalResult;
        const isSOP = qcRecord.reportType === "SOP";
    
        // For SOP, both measurement and defects must pass.
        const isMeasurementPass = passRate >= 95;
        const isDefectPass = totalDefectCount === 0;
    
        if (isSOP) {
          newOverallFinalResult =
            isMeasurementPass && isDefectPass ? "Pass" : "Fail";
        } else {
          // For other report types, use the individual results
          newOverallFinalResult =
            measurementResult === "Pass" && defectResult === "Pass" ? "Pass" : "Fail";
        }
    
        // 7. Update ALL calculated fields with fresh values
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
        
        // CRITICAL FIX: Set the new overall result
        qcRecord.overallFinalResult = newOverallFinalResult;
        
        // Mark the field as modified to ensure it gets saved
        qcRecord.markModified('overallFinalResult');
        
        // Save the record
        await qcRecord.save();
    
        // DETAILED RESPONSE FOR DEBUGGING
        res.json({ 
          success: true,
          message: "Overall result recalculated and saved successfully",
          previousResult: previousResult,
          newResult: newOverallFinalResult,
          debugInfo: {
            measurementCalculation: {
              totalPoints: totalMeasurementPoints,
              totalPass: totalMeasurementPass,
              totalFail: totalMeasurementFail,
              passRate: passRate,
              measurementResult: measurementResult,
              logic: qcRecord.reportType === "SOP"
                ? `SOP Logic: (Measurement Pass Rate ${passRate}% >= 95%) AND (Defect Count ${totalDefectCount} === 0)`
                : `Standard Logic: (Measurement Result '${measurementResult}' === 'Pass') AND (Defect Result '${defectResult}' === 'Pass')`
            },
            defectCalculation: {
              totalDefectCount: totalDefectCount,
              aqlAcceptedDefect: aql?.acceptedDefect || "N/A",
              defectResult: defectResult,
              logic: `${totalDefectCount} defects <= ${aql?.acceptedDefect || 0} = ${defectResult}`
            },
            overallCalculation: {
              measurementResult: measurementResult,
              defectResult: defectResult,
              overallResult: newOverallFinalResult,
              logic: `(${measurementResult} AND ${defectResult}) = ${newOverallFinalResult}`
            }
          },
          calculatedValues: {
            totalCheckedPcs,
            rejectedDefectPcs,
            totalDefectCount,
            totalMeasurementPoints,
            totalMeasurementPass,
            totalMeasurementFail,
            passRate,
            measurementResult,
            defectResult,
            overallFinalResult: newOverallFinalResult
          }
        });
    
      } catch (error) {
        console.error("Save summary error:", error);
        res.status(500).json({ success: false, message: "Failed to save summary." });
      }
  };

export const updateQCWashingMeasurementData = async (req, res) => {
  try {
      const { recordId } = req.params;
      const summary = req.body.summary || {};
      const qcRecord = await QCWashing.findById(recordId);
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
export const getqcwashingOverAllSummary = async (req, res) => {
  try {
      const { recordId } = req.params;
  
      const qcRecord = await QCWashing.findById(recordId);
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
export const getqcwashingOrderColorQty = async (req, res) => {
  const { orderNo, color } = req.params;
   const decodedColor = decodeURIComponent(color);
  const collection = ymProdConnection.db.collection("dt_orders");
  try {
    const orders = await collection.find({ Order_No: orderNo }).toArray();
    if (!orders || orders.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: `Order '${orderNo}' not found.` });
    }
    let totalQty = 0;
    orders.forEach((order) => {
      if (order.OrderColors && Array.isArray(order.OrderColors)) {
        const colorObj = order.OrderColors.find(
          (c) => c.Color.toLowerCase() === decodedColor.toLowerCase()
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
    res.json({ success: true, orderNo, color: decodedColor, colorOrderQty: totalQty });
  } catch (error) {
    console.error(
      `Error fetching color order qty for ${orderNo} / ${decodedColor}:`,
      error
    );
    res.status(500).json({
      success: false,
      message: "Server error while fetching color order qty."
    });
  }
};

// Get order numbers
export const getqcwashingOrderNumbers = async (req, res) => {
  try {
      const orders = await QCWashing.distinct("orderNo");
      res.json({ success: true, orderNumbers: orders });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch order numbers" });
    }
};

// Get order details by style number
export const getqcwashingOrderbysize = async (req, res) => {
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
export const getqcWashingOrderbyOrderNo = async (req, res) => {
  try {
      const { orderNo } = req.params;
      const orderData = await QCWashing.findOne({ orderNo: orderNo });
  
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

export const getQCWashingSaveData = async (req, res) => {
  try {
    const { id } = req.params;
    const savedData = await QCWashing.findById(id);
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

export const saveqcwashingAQLbySampleSize = async (req, res) => {
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
export const saveqcWashinAQLData = async (req, res) => {
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
    measurementDetail.before_after_wash === 'After Wash' ? 'afterWash' :
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
export const saveQCWashingMeasurementData = async (req, res) => {
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
  
      const record = await QCWashing.findById(recordId);
      if (!record) {
        return res.status(404).json({ 
          success: false, 
          message: "Record not found" 
        });
      }
  
      if (!record.measurementDetails) {
        record.measurementDetails = {
          measurement: [],
          measurementSizeSummary: []
        };
      }
  
      const washType = measurementDetail.before_after_wash;
      const isEdit = measurementDetail.isEdit === true;
   
      const measurementIndex = record.measurementDetails.measurement.findIndex(
        (m) => 
          m.size === measurementDetail.size &&
          m.kvalue === measurementDetail.kvalue &&
          m.before_after_wash === washType
      );
      
      let summaryIndex = -1;
  
      summaryIndex = record.measurementDetails.measurementSizeSummary.findIndex(
        (s) => 
          s.size === measurementDetail.size &&
          s.kvalue === measurementDetail.kvalue &&
          s.before_after_wash === washType
      );
      
      if (summaryIndex === -1) {
        summaryIndex = record.measurementDetails.measurementSizeSummary.findIndex(
          (s) => 
            s.size === measurementDetail.size &&
            s.kvalue === measurementDetail.kvalue
        );
        
      }
      
      // Calculate new summary
      const summary = calculateMeasurementSizeSummary(measurementDetail);
      
      if (measurementIndex !== -1) {
        record.measurementDetails.measurement[measurementIndex] = measurementDetail;
      } else {
        record.measurementDetails.measurement.push(measurementDetail);
      }
      
      if (summaryIndex !== -1) {
        record.measurementDetails.measurementSizeSummary[summaryIndex] = summary;
      } else {
        record.measurementDetails.measurementSizeSummary.push(summary);
      }
  
      record.savedAt = new Date();
      await record.save();
  
      res.json({
        success: true,
        message: isEdit ? "Measurement detail updated" : "Measurement detail saved",
        measurementDetails: record.measurementDetails
      });
  
    } catch (err) {
      console.error("Measurement save error:", err);
      res.status(500).json({ 
        success: false, 
        message: "Failed to save measurement detail" 
      });
    }
};

// Load color-specific data
export const loadqcwashingColorData = async (req, res) => {
  try {
  const { orderNo, color } = req.params;
  const qcRecord = await QCWashing.findOne({ orderNo: orderNo });

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
export const getQCWashingSubmittedData = async (req, res) => {
  try {
      const { id } = req.params;
  
      // Validate the ID format (assuming MongoDB ObjectId)
      if (!id || id.length !== 24) {
        return res.status(400).json({
          success: false,
          message: "Invalid ID format"
        });
      }
  
      const reportData = await QCWashing.findById(id).lean();
  
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

export const saveqcwashing = async (req, res) => {
try {
    const { orderNo } = req.body;
    if (!orderNo) {
      return res
        .status(400)
        .json({ success: false, message: "orderNo is required" });
    }
    const latestAutoSave = await QCWashing.findOne({
      orderNo,
    }).sort({ updatedAt: -1 });

    if (!latestAutoSave) {
      return res.status(404).json({
        success: false,
        message: "No auto-save record found to submit."
      });
    }

    latestAutoSave.isAutoSave = false;
    latestAutoSave.status = "submitted";
    latestAutoSave.submittedAt = new Date();
    latestAutoSave.savedAt = new Date();
    await latestAutoSave.save();

    res.json({
      success: true,
      submissionId: latestAutoSave._id,
      message: "QC Washing data submitted successfully"
    });
  } catch (error) {
    console.error("Submit error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit data",
      error: error.message,
      stack: error.stack
    });
  }
};

function normalizeInspectionImagePath(img) {
  if (!img) return "";

  // If new upload, img.file will be handled by fileMap logic in your code

  if (img.preview && typeof img.preview === "string") {
    // If it's already a full URL, return as-is
    if (img.preview.startsWith("http")) {
      return img.preview;
    }

    // Convert relative paths to full URLs
    if (img.preview.startsWith("./public/storage/")) {
      const relativePath = img.preview.replace("./public/storage/", "");
      return `${
        process.env.BASE_URL || "http://localhost:3000"
      }/storage/${relativePath}`;
    }

    if (img.preview.startsWith("/storage/")) {
      return `${process.env.BASE_URL || "http://localhost:3000"}${img.preview}`;
    }

    if (img.preview.startsWith("./public/")) {
      return img.preview;
    }
    if (img.preview.startsWith("/public/")) {
      return "." + img.preview;
    }
    if (img.preview.startsWith("/storage/")) {
      return "./public" + img.preview; 
    }
    if (img.preview.startsWith("http")) {
      try {
        const url = new URL(img.preview);
        return "./public" + url.pathname;
      } catch (e) {
        return img.preview;
      }
    }

    if (!img.preview.includes("/")) {
      return `./public/storage/qc_washing_images/inspection/${img.preview}`;
    }

    if (img.preview[0] !== "/") {
      return `./public/storage/qc_washing_images/inspection/${img.preview}`;
    }

    // Fallback
    return img.preview;
  }

  if (img.name && !img.name.includes("/")) {
    return `./public/storage/qc_washing_images/inspection/${img.name}`;
  }

  return "";
}

// Add this helper function at the top of your file to get the server base URL
function getServerBaseUrl(req) {
  const protocol = req.protocol || "http";
  const host = req.get("host") || "localhost:3000";
  return `${protocol}://${host}`;
}

// Helper function to group checkpoint data
function groupCheckpointData(checkpointInspectionData) {
  const groupedData = [];
  const mainCheckpoints = new Map();
  
  // First pass: collect all main checkpoints
  checkpointInspectionData.forEach(item => {
    if (item.type === 'main') {
      mainCheckpoints.set(item.checkpointId, {
        id: item.id,
        checkpointId: item.checkpointId,
        name: item.name,
        optionType: item.optionType,
        decision: item.decision,
        remark: item.remark,
        comparisonImages: item.comparisonImages || [],
        subPoints: [] // Initialize empty sub-points array
      });
    }
  });
  
  // Second pass: add sub-points to their parent main checkpoints
  checkpointInspectionData.forEach(item => {
    if (item.type === 'sub') {
      const mainCheckpoint = mainCheckpoints.get(item.checkpointId);
      if (mainCheckpoint) {
        mainCheckpoint.subPoints.push({
          id: item.id,
          subPointId: item.subPointId,
          name: item.name,
          optionType: item.optionType,
          decision: item.decision,
          remark: item.remark,
          comparisonImages: item.comparisonImages || []
        });
      }
    }
  });
  
  // Convert map to array
  return Array.from(mainCheckpoints.values());
}




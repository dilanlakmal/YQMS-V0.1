import {
  AfterIroning,
  AfterIroningCheckList,
  ymProdConnection,
  AQLChart,
  AfterIroningFirstOutput,
} from "../MongoDB/dbConnectionController.js";
import {
  getBuyerFromMoNumber,
  getAqlLevelForBuyer,
} from "../../helpers/helperFunctions.js";
import fs from "fs";
import { __backendDir } from "../../Config/appConfig.js";
import path from "path";

function getServerBaseUrl(req) {
  const protocol = req.protocol || "http";
  const host = req.get("host") || "localhost:5001";
  return `${protocol}://${host}`;
}

function normalizeInspectionImagePath(img) {
  if (!img) return "";
  if (img.preview && typeof img.preview === "string") {
    if (img.preview.startsWith("http")) return img.preview;
    if (img.preview.startsWith("./public/storage/")) {
      const relativePath = img.preview.replace("./public/storage/", "");
      return `${process.env.BASE_URL || "http://localhost:5001"}/storage/${relativePath}`;
    }
    // ... other path normalizations
  }
  return "";
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

export const saveAfterIroningOrderData = async (req, res) => {
  try {
    const { formData, userId, savedAt } = req.body;
    if (!formData || !formData.orderNo) {
      return res.status(400).json({ success: false, message: "Order No is required." });
    }

    const dateValue = formData.date ? new Date(formData.date.length === 10 ? formData.date + "T00:00:00.000Z" : formData.date) : undefined;

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

    Object.keys(query).forEach(key => (query[key] === undefined || query[key] === "") && delete query[key]);

    let record = await AfterIroning.findOne(query);

    if (!record) {
      record = new AfterIroning({
        ...formData,
        inspector: { empId: userId },
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
    console.error("AfterIroning OrderData-save error:", err);
    res.status(500).json({ success: false, message: "Server error while saving order data." });
  }
};

export const saveAfterIroningInspectionData = async (req, res) => {
  try {
    const { recordId } = req.body;
    const inspectionData = JSON.parse(req.body.inspectionData || "[]");
    const defectData = JSON.parse(req.body.defectData || "[]");
    const checkpointInspectionData = JSON.parse(req.body.checkpointInspectionData || "[]");

    if (!recordId) {
      return res.status(400).json({ success: false, message: "recordId is required" });
    }

    const serverBaseUrl = getServerBaseUrl(req);
    const uploadDir = path.join(__backendDir, "./public/storage/after_ironing_images/inspection");
    const fileMap = {};

    for (const file of req.files || []) {
      const fileExtension = path.extname(file.originalname);
      const newFilename = `inspection-${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;
      const fullFilePath = path.join(uploadDir, newFilename);
      await fs.promises.writeFile(fullFilePath, file.buffer);
      fileMap[file.fieldname] = `${serverBaseUrl}/storage/after_ironing_images/inspection/${newFilename}`;
    }

    let record = await AfterIroning.findById(recordId);
    if (!record) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    if (checkpointInspectionData) {
      checkpointInspectionData.forEach((item, idx) => {
        if (item.comparisonImages) {
          item.comparisonImages = item.comparisonImages.map((img, imgIdx) => {
            const newImageUrl = fileMap[`checkpointImages_${idx}_${imgIdx}`];
            return newImageUrl || normalizeInspectionImagePath(img);
          });
        }
      });
    }

    const groupedCheckpointData = groupCheckpointData(checkpointInspectionData);

    record.inspectionDetails = {
      ...record.inspectionDetails,
      checkpointInspectionData: groupedCheckpointData,
      parameters: (defectData || []).map(item => ({
        parameterName: item.parameter,
        checkedQty: item.checkedQty,
        defectQty: item.failedQty,
        passRate: item.passRate,
        result: item.result,
        remark: item.remark
      })),
    };

    record.savedAt = new Date();
    record.status = "processing";

    await record.save();

    res.json({ success: true, message: "Inspection data saved", data: record });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const submitAfterIroningData = async (req, res) => {
  try {
    const { recordId } = req.body;
    if (!recordId) {
      return res.status(400).json({ success: false, message: "Record ID is required." });
    }

    const record = await AfterIroning.findById(recordId);
    if (!record) {
      return res.status(404).json({ success: false, message: "Record not found." });
    }

    record.status = "submitted";
    record.submittedAt = new Date();
    await record.save();

    res.json({ success: true, message: "After Ironing data submitted successfully." });
  } catch (error) {
    console.error("Submit error:", error);
    res.status(500).json({ success: false, message: "Failed to submit data." });
  }
};
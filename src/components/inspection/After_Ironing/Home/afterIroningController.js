// This file appears to be misplaced - it contains backend code but is in the frontend directory
// The actual backend controller is at: backend/controller/AfterIroning/AfterIroningInspection/afterIroningInspectionController.js

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
    const uploadDir = path.join(__backendDir, "public", "storage", "after_ironing_images", "inspection");
    
    // Ensure upload directory exists
    try {
      await fs.promises.mkdir(uploadDir, { recursive: true });
    } catch (mkdirError) {
      console.error("Failed to create inspection image directory:", mkdirError);
      return res.status(500).json({ success: false, message: "Failed to create image directory." });
    }
    
    const fileMap = {};

    for (const file of req.files || []) {
      const fileExtension = path.extname(file.originalname) || '.jpg';
      const newFilename = `inspection-${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;
      const fullFilePath = path.join(uploadDir, newFilename);
      await fs.promises.writeFile(fullFilePath, file.buffer);
      fileMap[file.fieldname] = `${serverBaseUrl}/storage/after_ironing_images/inspection/${newFilename}`;
      console.log(`Saved inspection image: ${file.fieldname} -> ${fileMap[file.fieldname]}`);
    }

    let record = await AfterIroning.findById(recordId);
    if (!record) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    // Process checkpoint images with improved logic
    if (checkpointInspectionData && Array.isArray(checkpointInspectionData)) {
      checkpointInspectionData.forEach((item, idx) => {
        if (!item.comparisonImages) {
          item.comparisonImages = [];
        }

        // Look for uploaded images for this main checkpoint
        const mainCheckpointImages = [];
        Object.keys(fileMap).forEach(fieldName => {
          const mainPattern = new RegExp(`^checkpointImages_${idx}_\\d+$`);
          if (mainPattern.test(fieldName)) {
            mainCheckpointImages.push(fileMap[fieldName]);
          }
        });

        // Add existing images
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
              }
            }
          });
        }

        item.comparisonImages = mainCheckpointImages;

        // Handle sub-point images
        if (item.subPoints && Array.isArray(item.subPoints)) {
          item.subPoints.forEach((subPoint, subIdx) => {
            if (!subPoint.comparisonImages) {
              subPoint.comparisonImages = [];
            }

            const subPointImages = [];
            Object.keys(fileMap).forEach(fieldName => {
              const subPattern = new RegExp(`^checkpointImages_${idx}_sub_${subIdx}_\\d+$`);
              if (subPattern.test(fieldName)) {
                subPointImages.push(fileMap[fieldName]);
              }
            });

            // Add existing sub-point images
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
                  }
                }
              });
            }

            subPoint.comparisonImages = subPointImages;
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
    console.error("Inspection save error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
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

    const serverBaseUrl = getServerBaseUrl(req);
    const uploadDir = path.join(__backendDir, "public", "storage", "after_ironing_images", "defect");
    
    // Ensure upload directory exists
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

    // Initialize additionalImages array if it doesn't exist
    if (!defectDetails.additionalImages) {
      defectDetails.additionalImages = [];
    }

    // Process defect images
    if (defectDetails.defectsByPc && Array.isArray(defectDetails.defectsByPc)) {
      defectDetails.defectsByPc.forEach((pc, pcIdx) => {
        if (pc.pcDefects && Array.isArray(pc.pcDefects)) {
          pc.pcDefects.forEach((defect, defectIdx) => {
            if (!defect.defectImages) {
              defect.defectImages = [];
            }

            const processedDefect = {
              defectId: defect.selectedDefect || defect.defectId || "",
              defectName: defect.defectName || "",
              defectQty: defect.defectQty || 0,
              defectImages: []
            };

            const defectImages = [];
            
            // Add new uploaded images
            Object.keys(fileMap).forEach(fieldName => {
              const defectPattern = new RegExp(`^defectImages_${pcIdx}_${defectIdx}_\\d+$`);
              if (defectPattern.test(fieldName)) {
                defectImages.push(fileMap[fieldName]);
              }
            });

            // Add existing images
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
                  }
                }
              });
            }

            processedDefect.defectImages = defectImages;
            pc.pcDefects[defectIdx] = processedDefect;
          });
        }
      });
    }

    // Process additional images
    const additionalImages = [...(defectDetails.additionalImages || [])];
    
    Object.keys(fileMap).forEach(fieldName => {
      const additionalPattern = /^additionalImages_\d+$/;
      if (additionalPattern.test(fieldName)) {
        additionalImages.push(fileMap[fieldName]);
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
        }
      }
      return img;
    }).filter(img => img && typeof img === 'string' && img.trim() !== '');

    defectDetails.additionalImages = processedAdditionalImages;

    // Save to DB
    const doc = await AfterIroning.findByIdAndUpdate(
      recordId,
      { defectDetails: defectDetails, updatedAt: new Date() },
      { new: true }
    );

    if (!doc) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    res.json({ success: true, data: doc.defectDetails });

  } catch (err) {
    console.error("Defect details save error:", err);
    res.status(500).json({ success: false, message: err.message });
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
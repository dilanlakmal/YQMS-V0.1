import {
  FincheckInspectionReports,
  QASectionsMeasurementSpecs,
  DtOrder,
  RoleManagment,
  UserMain,
  QASectionsProductLocation
} from "../../MongoDB/dbConnectionController.js";

import axios from "axios";
import fs from "fs";
import path from "path";

// ============================================================
// Get Filtered Inspection Reports
// ============================================================
export const getInspectionReports = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      reportId,
      reportType,
      orderType,
      orderNo,
      productType,
      empId,
      subConFactory,
      custStyle,
      buyer,
      supplier
    } = req.query;

    let query = {
      // Exclude cancelled reports by default if needed, or show all
      status: { $ne: "cancelled" }
    };

    // 1. Date Range Filter
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      query.inspectionDate = { $gte: start, $lte: end };
    }

    // 2. Report ID Filter (Exact Match)
    if (reportId) {
      query.reportId = parseInt(reportId);
    }

    // 3. Report Name (Type) Filter
    if (reportType && reportType !== "All") {
      query.reportType = reportType;
    }

    // 4. Order Type Filter
    if (orderType && orderType !== "All") {
      query.orderType = orderType.toLowerCase(); // Ensure lowercase matching
    }

    // 5. Order No Filter (Regex Search)
    if (orderNo) {
      query.orderNosString = { $regex: orderNo, $options: "i" };
    }

    // 6. Product Type Filter
    if (productType && productType !== "All") {
      query.productType = productType;
    }

    // 7. QA ID (Emp ID) Filter
    if (empId) {
      query.empId = { $regex: empId, $options: "i" };
    }

    // 8. Sub-Con Factory Filter (Nested in inspectionDetails)
    if (subConFactory && subConFactory !== "All") {
      query["inspectionDetails.subConFactory"] = subConFactory;
    }

    // 9. Customer Style Filter (Regex Search, Nested)
    if (custStyle) {
      query["inspectionDetails.custStyle"] = {
        $regex: custStyle,
        $options: "i"
      };
    }

    // 10. Buyer Filter (Root level field)
    if (buyer && buyer !== "All") {
      query.buyer = buyer;
    }

    // 11. Supplier Filter (Nested)
    if (supplier && supplier !== "All") {
      query["inspectionDetails.supplier"] = supplier;
    }

    // Execute Query
    const reports = await FincheckInspectionReports.find(query)
      .sort({ inspectionDate: -1, createdAt: -1 }) // Newest first
      // This populates the 'productTypeId' field with the full object from 'qa_sections_product_type'
      .populate("productTypeId", "imageURL")
      .lean();

    return res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    console.error("Error fetching inspection reports:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

// ============================================================
// Get Flattened Defect Images for a Report
// ============================================================
export const getDefectImagesForReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await FincheckInspectionReports.findOne({
      reportId: parseInt(reportId)
    })
      .select("defectData defectManualData")
      .lean();

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found"
      });
    }

    const allImages = [];

    // 1. Process Structured Defect Data
    if (report.defectData && Array.isArray(report.defectData)) {
      report.defectData.forEach((defect) => {
        const defectName = defect.defectName;
        const defectCode = defect.defectCode;

        if (defect.isNoLocation) {
          // A. No Location Mode (Images at root)
          if (defect.images && Array.isArray(defect.images)) {
            defect.images.forEach((img) => {
              allImages.push({
                imageId: img.imageId,
                url: img.imageURL,
                defectName: defectName,
                defectCode: defectCode,
                position: "General", // No specific position
                locationInfo: "No Location Config",
                type: "Defect"
              });
            });
          }
        } else {
          // B. Location Based Mode
          if (defect.locations && Array.isArray(defect.locations)) {
            defect.locations.forEach((loc) => {
              const locationInfo = `${loc.locationName} (${loc.view})`;

              if (loc.positions && Array.isArray(loc.positions)) {
                loc.positions.forEach((pos) => {
                  const positionType = pos.position || "Outside"; // Inside/Outside

                  // Required Image
                  if (pos.requiredImage) {
                    allImages.push({
                      imageId: pos.requiredImage.imageId,
                      url: pos.requiredImage.imageURL,
                      defectName: defectName,
                      defectCode: defectCode,
                      position: positionType,
                      locationInfo: locationInfo,
                      type: "Defect"
                    });
                  }

                  // Additional Images
                  if (
                    pos.additionalImages &&
                    Array.isArray(pos.additionalImages)
                  ) {
                    pos.additionalImages.forEach((img) => {
                      allImages.push({
                        imageId: img.imageId,
                        url: img.imageURL,
                        defectName: defectName,
                        defectCode: defectCode,
                        position: positionType,
                        locationInfo: locationInfo,
                        type: "Defect (Add.)"
                      });
                    });
                  }
                });
              }
            });
          }
        }
      });
    }

    // 2. Process Manual Defect Data (Optional, but good to have)
    if (report.defectManualData && Array.isArray(report.defectManualData)) {
      report.defectManualData.forEach((item) => {
        if (item.images && Array.isArray(item.images)) {
          item.images.forEach((img) => {
            allImages.push({
              imageId: img.imageId,
              url: img.imageURL,
              defectName: "Manual Entry",
              defectCode: "N/A",
              position: item.line || "Manual",
              locationInfo: item.remarks || "",
              type: "Manual"
            });
          });
        }
      });
    }

    return res.status(200).json({
      success: true,
      count: allImages.length,
      data: allImages
    });
  } catch (error) {
    console.error("Error fetching defect images:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

// ============================================================
// Get Measurement Specifications Linked to a Report
// ============================================================

export const getReportMeasurementSpecs = async (req, res) => {
  try {
    const { reportId } = req.params;

    // 1. Fetch the Report to get Order No
    const report = await FincheckInspectionReports.findOne({
      reportId: parseInt(reportId)
    }).select("orderNos");

    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found" });
    }

    const orderNos = report.orderNos;
    if (!orderNos || orderNos.length === 0) {
      return res.status(200).json({
        success: true,
        specs: { Before: null, After: null }
      });
    }

    // Use the first order number to find specs
    const primaryOrderNo = orderNos[0];

    // 2. Find the Specs in the Specs Collection
    // We fetch EVERYTHING (Before and After)
    const specsRecord = await QASectionsMeasurementSpecs.findOne({
      Order_No: { $regex: new RegExp(`^${primaryOrderNo}$`, "i") }
    }).lean();

    const result = {
      Before: { full: [], selected: [] },
      After: { full: [], selected: [] }
    };

    if (specsRecord) {
      // Process Before
      result.Before.full = specsRecord.AllBeforeWashSpecs || [];
      result.Before.selected =
        specsRecord.selectedBeforeWashSpecs &&
        specsRecord.selectedBeforeWashSpecs.length > 0
          ? specsRecord.selectedBeforeWashSpecs
          : specsRecord.AllBeforeWashSpecs || [];

      // Process After
      result.After.full = specsRecord.AllAfterWashSpecs || [];
      result.After.selected =
        specsRecord.selectedAfterWashSpecs &&
        specsRecord.selectedAfterWashSpecs.length > 0
          ? specsRecord.selectedAfterWashSpecs
          : specsRecord.AllAfterWashSpecs || [];
    } else {
      // Fallback: Check DtOrder (Legacy - usually only Before)
      const dtOrder = await DtOrder.findOne({
        Order_No: primaryOrderNo
      }).lean();

      if (dtOrder && dtOrder.BeforeWashSpecs) {
        const legacySpecs = dtOrder.BeforeWashSpecs.map((s) => ({
          ...s,
          id: s._id ? s._id.toString() : s.id
        }));
        result.Before.full = legacySpecs;
        result.Before.selected = legacySpecs;
      }
    }

    return res.status(200).json({
      success: true,
      specs: result
    });
  } catch (error) {
    console.error("Error fetching report measurement specs:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// Check User Permission for UI Visibility
// ============================================================

export const checkUserPermission = async (req, res) => {
  try {
    const { empId } = req.query;

    if (!empId) {
      return res.status(200).json({ isAdmin: false });
    }

    // Check if this Employee ID exists inside the 'users' array
    // of any document where the role is 'Admin' or 'Super Admin'
    const roleDoc = await RoleManagment.findOne({
      role: { $in: ["Admin", "Super Admin"] },
      "users.emp_id": empId
    }).select("_id");

    return res.status(200).json({
      success: true,
      isAdmin: !!roleDoc // Returns true if document found, false otherwise
    });
  } catch (error) {
    console.error("Permission check error:", error);
    return res.status(500).json({ success: false, isAdmin: false });
  }
};

// Helper to convert image to base64
const imageToBase64 = async (imageUrl) => {
  try {
    // Check if it's a local file path
    if (imageUrl.startsWith("/uploads/") || imageUrl.startsWith("uploads/")) {
      const filePath = path.join(process.cwd(), "public", imageUrl);
      if (fs.existsSync(filePath)) {
        const fileBuffer = fs.readFileSync(filePath);
        const mimeType = imageUrl.endsWith(".png") ? "image/png" : "image/jpeg";
        return `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
      }
    }

    // For external URLs
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      const response = await axios.get(imageUrl, {
        responseType: "arraybuffer",
        timeout: 10000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
      });
      const mimeType = response.headers["content-type"] || "image/jpeg";
      const base64 = Buffer.from(response.data, "binary").toString("base64");
      return `data:${mimeType};base64,${base64}`;
    }

    return null;
  } catch (error) {
    console.error(`Failed to convert image: ${imageUrl}`, error.message);
    return null;
  }
};

// Get all report images as base64
export const getReportImagesAsBase64 = async (req, res) => {
  try {
    const { reportId } = req.params;

    // Fetch the report
    const report = await FincheckInspectionReports.findOne({ reportId });
    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found" });
    }

    const imagesResult = {
      defectImages: [],
      headerImages: {},
      photoImages: [],
      inspectorImage: null
    };

    // Process Inspector Image (Server-Side)
    if (report.empId) {
      try {
        // Use UserMain as per your db connection code
        const inspector = await UserMain.findOne({
          emp_id: report.empId
        }).select("face_photo");

        if (inspector && inspector.face_photo) {
          // Convert the external URL to Base64 immediately
          const base64 = await imageToBase64(inspector.face_photo);
          if (base64) {
            imagesResult.inspectorImage = base64;
          }
        }
      } catch (err) {
        console.error("Error processing inspector image:", err);
      }
    }

    // Process Defect Images
    if (report.defectData && Array.isArray(report.defectData)) {
      for (const defect of report.defectData) {
        // Process no-location images
        if (defect.images) {
          for (const img of defect.images) {
            if (img.imageURL) {
              const base64 = await imageToBase64(img.imageURL);
              imagesResult.defectImages.push({
                id: img.imageId || img._id,
                base64
              });
            }
          }
        }
        // Process location-based images
        if (defect.locations) {
          for (const loc of defect.locations) {
            for (const pos of loc.positions || []) {
              if (pos.requiredImage?.imageURL) {
                const base64 = await imageToBase64(pos.requiredImage.imageURL);
                imagesResult.defectImages.push({
                  id: pos.requiredImage.imageId || pos._id,
                  base64
                });
              }
              for (const addImg of pos.additionalImages || []) {
                if (addImg.imageURL) {
                  const base64 = await imageToBase64(addImg.imageURL);
                  imagesResult.defectImages.push({
                    id: addImg.imageId || addImg._id,
                    base64
                  });
                }
              }
            }
          }
        }
      }
    }

    // Process Header (Checklist) Images
    if (report.headerData && Array.isArray(report.headerData)) {
      for (const section of report.headerData) {
        for (const img of section.images || []) {
          if (img.imageURL) {
            const key = `${section.headerId}_${img.id || img._id}`;
            const base64 = await imageToBase64(img.imageURL);
            imagesResult.headerImages[key] = base64;
          }
        }
      }
    }

    // Process Photo Documentation Images
    if (report.photoData && Array.isArray(report.photoData)) {
      for (const section of report.photoData) {
        for (const item of section.items || []) {
          for (const img of item.images || []) {
            if (img.imageURL) {
              const base64 = await imageToBase64(img.imageURL);
              imagesResult.photoImages.push({
                sectionId: section.sectionId,
                itemNo: item.itemNo,
                imageId: img.imageId || img._id,
                base64
              });
            }
          }
        }
      }
    }

    res.json({
      success: true,
      data: imagesResult
    });
  } catch (error) {
    console.error("Error fetching images:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch images",
      error: error.message
    });
  }
};

// ============================================================
// GET Defect Heatmap Data (Product Location Map + Counts)
// ============================================================

export const getReportDefectHeatmap = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await FincheckInspectionReports.findOne({
      reportId: parseInt(reportId)
    }).select("productTypeId defectData");

    if (!report || !report.productTypeId) {
      return res
        .status(404)
        .json({ success: false, message: "Data not found" });
    }

    const locationMap = await QASectionsProductLocation.findOne({
      productTypeId: report.productTypeId,
      isActive: true
    }).lean();

    if (!locationMap) {
      return res
        .status(404)
        .json({ success: false, message: "No map configured." });
    }

    const counts = {
      Front: {},
      Back: {}
    };

    if (report.defectData && Array.isArray(report.defectData)) {
      report.defectData.forEach((defect) => {
        if (!defect.isNoLocation && defect.locations) {
          defect.locations.forEach((loc) => {
            const locNo = loc.locationNo;
            const viewKey =
              loc.view && loc.view.toLowerCase() === "back" ? "Back" : "Front";
            const qty = loc.qty || (loc.positions ? loc.positions.length : 1);
            const defectName = defect.defectName;

            // Initialize if not exists
            if (!counts[viewKey][locNo]) {
              counts[viewKey][locNo] = {
                total: 0,
                defects: {} // Map for defect breakdown
              };
            }

            // Add to total
            counts[viewKey][locNo].total += qty;

            // Add to specific defect breakdown
            if (counts[viewKey][locNo].defects[defectName]) {
              counts[viewKey][locNo].defects[defectName] += qty;
            } else {
              counts[viewKey][locNo].defects[defectName] = qty;
            }
          });
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        map: locationMap,
        counts: counts
      }
    });
  } catch (error) {
    console.error("Error fetching defect heatmap:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

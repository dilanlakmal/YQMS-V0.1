import { SubconSewingQAReport } from "../MongoDB/dbConnectionController.js";
import { 
  generateSubconQAReportID,
  getBuyerFromMoNumber,
 } from "../../Helpers/helperFunctions.js";
 import axios from "axios";
 import sharp from "sharp";
 import fs from "fs";
 import path from "path";
 import { API_BASE_URL, __backendDir } from "../../Config/appConfig.js";
 import { Buffer } from "buffer";


// 3. ENDPOINT: Save a new QA Sample Report (MODIFIED)
export const saveSubconQAReport = async (req, res) => {
  try {
    const reportData = req.body;
    const { qcData, ...headerData } = reportData;

    // --- Calculate totals from the qcData array ---
    let totalCheckedQty = 0;
    let totalRejectPcs = 0;
    let totalOverallDefectQty = 0;

    qcData.forEach((qc) => {
      totalCheckedQty += Number(qc.checkedQty) || 0;
      totalRejectPcs += Number(qc.rejectPcs) || 0;
      totalOverallDefectQty += Number(qc.totalDefectQty) || 0;
    });

    const startOfDay = new Date(headerData.inspectionDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const reportID = await generateSubconQAReportID();
    const buyer = getBuyerFromMoNumber(headerData.moNo);

    const newReport = new SubconSewingQAReport({
      ...headerData,
      qcData,
      inspectionDate: startOfDay,
      reportID,
      buyer,
      totalCheckedQty,
      totalRejectPcs,
      totalOverallDefectQty
    });

    await newReport.save();
    res.status(201).json({
      message: "QA Report saved successfully!",
      reportID: reportID
    });
  } catch (error) {
    console.error("Error saving Sub-Con QA report:", error);
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ error: "A report with these exact details already exists." });
    }
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ error: "Validation failed", details: error.message });
    }
    res.status(500).json({ error: "Failed to save QA report" });
  }
};


// 4. ENDPOINT: Find a specific QA report (MODIFIED)
export const getSubConSewingQAReport = async (req, res) => {
   try {
    const { inspectionDate, reportType, factory, lineNo, moNo, color } =
      req.query;

    if (
      !inspectionDate ||
      !reportType ||
      !factory ||
      !lineNo ||
      !moNo ||
      !color
    ) {
      return res
        .status(400)
        .json({ error: "Missing required search parameters." });
    }

    const startOfDay = new Date(inspectionDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(inspectionDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const report = await SubconSewingQAReport.findOne({
      factory,
      reportType,
      lineNo,
      moNo,
      color,
      inspectionDate: { $gte: startOfDay, $lte: endOfDay }
    }).lean();

    res.json(report);
  } catch (error) {
    console.error("Error finding Sub-Con QA report:", error);
    res.status(500).json({ error: "Failed to find QA report" });
  }
};

// 5. ENDPOINT: Update an existing QA report by its ID
export const updateSubConSewingQAReport = async (req, res) => {
  try {
    const { id } = req.params;
    const reportData = req.body;
    const { qcData, ...headerData } = reportData;

    // --- Recalculate totals from the qcData array ---
    let totalCheckedQty = 0;
    let totalRejectPcs = 0;
    let totalOverallDefectQty = 0;

    if (qcData && Array.isArray(qcData)) {
      qcData.forEach((qc) => {
        totalCheckedQty += Number(qc.checkedQty) || 0;
        totalRejectPcs += Number(qc.rejectPcs) || 0;
        totalOverallDefectQty += Number(qc.totalDefectQty) || 0;
      });
    }

    const startOfDay = new Date(headerData.inspectionDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const buyer = getBuyerFromMoNumber(headerData.moNo);

    const updatePayload = {
      ...headerData,
      qcData,
      inspectionDate: startOfDay,
      buyer,
      totalCheckedQty,
      totalRejectPcs,
      totalOverallDefectQty
    };

    const updatedReport = await SubconSewingQAReport.findByIdAndUpdate(
      id,
      updatePayload,
      { new: true, runValidators: true }
    );

    if (!updatedReport) {
      return res.status(404).json({ error: "QA Report not found." });
    }

    res.json({
      message: "QA Report updated successfully!",
      report: updatedReport
    });
  } catch (error) {
    console.error("Error updating Sub-Con QA report:", error);
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ error: "Validation failed", details: error.message });
    }
    res.status(500).json({ error: "Failed to update QA report" });
  }
};

/* -------------------------------------
// Improved Image Proxy for PDF CORS Issue
// This endpoint acts as a middleman to bypass browser CORS restrictions.
------------------------------------- */
export const proxyPDF = async (req, res) => {
  const { url } = req.query;
  
    if (!url) {
      console.error("Image Proxy: No URL provided");
      return res.status(400).json({ error: "An image URL is required." });
    }
  
    try {
      // If it's a local file on the same server
      if (url.includes(`${API_BASE_URL}/storage/`)) {
        const localPath = url.replace(`${API_BASE_URL}/storage/`, "");
        const fullPath = path.join(__backendDir, "public/storage", localPath);
  
        if (fs.existsSync(fullPath)) {
          res.header("Access-Control-Allow-Origin", "*");
          res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
          res.header(
            "Access-Control-Allow-Headers",
            "Origin, X-Requested-With, Content-Type, Accept"
          );
  
          const ext = path.extname(fullPath).toLowerCase();
  
          // If it's a WebP image, convert it to JPEG
          if (ext === ".webp") {
            try {
              console.log("Converting WebP to JPEG:", fullPath);
  
              // Use Sharp to convert WebP to JPEG
              const convertedBuffer = await sharp(fullPath)
                .jpeg({ quality: 90 })
                .toBuffer();
  
              res.setHeader("Content-Type", "image/jpeg");
              res.setHeader("Cache-Control", "public, max-age=3600");
              res.send(convertedBuffer);
  
              return;
            } catch (conversionError) {
              console.error("Error converting WebP:", conversionError);
              return res
                .status(500)
                .json({ error: "Failed to convert WebP image." });
            }
          } else {
            // For non-WebP images, serve as normal
            let contentType = "application/octet-stream";
  
            switch (ext) {
              case ".jpg":
              case ".jpeg":
                contentType = "image/jpeg";
                break;
              case ".png":
                contentType = "image/png";
                break;
              case ".gif":
                contentType = "image/gif";
                break;
              case ".svg":
                contentType = "image/svg+xml";
                break;
            }
  
            res.setHeader("Content-Type", contentType);
            res.setHeader("Cache-Control", "public, max-age=3600");
  
            const fileStream = fs.createReadStream(fullPath);
            fileStream.pipe(res);
            return;
          }
        } else {
          console.error("Image Proxy: Local file not found:", fullPath);
          return res.status(404).json({ error: "Image file not found." });
        }
      }
  
      // For external URLs, fetch and convert if needed
      const response = await axios({
        method: "get",
        url: url,
        responseType: "arraybuffer",
        timeout: 100000,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; ImageProxy/1.0)"
        }
      });
  
      const contentType = response.headers["content-type"];
  
      if (!contentType || !contentType.startsWith("image/")) {
        console.error(
          "Image Proxy: Not a valid image content type:",
          contentType
        );
        return res
          .status(400)
          .json({ error: "URL does not point to a valid image." });
      }
  
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
      );
  
      // If it's WebP, convert to JPEG
      if (contentType === "image/webp") {
        try {
          console.log("Converting external WebP to JPEG");
  
          const convertedBuffer = await sharp(Buffer.from(response.data))
            .jpeg({ quality: 90 })
            .toBuffer();
  
          res.setHeader("Content-Type", "image/jpeg");
          res.setHeader("Cache-Control", "public, max-age=3600");
          res.send(convertedBuffer);
  
          return;
        } catch (conversionError) {
          console.error("Error converting external WebP:", conversionError);
          return res.status(500).json({ error: "Failed to convert WebP image." });
        }
      } else {
        // For non-WebP images, serve as normal
        res.setHeader("Content-Type", contentType);
        res.setHeader("Cache-Control", "public, max-age=3600");
        res.send(Buffer.from(response.data));
      }
    } catch (error) {
      console.error("Image Proxy Error:", {
        url: url,
        message: error.message,
        code: error.code
      });
  
      res.status(500).json({
        error: "Failed to retrieve image.",
        details: error.message
      });
    }
};

export const getSubConQAInspectionData = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      reportType,
      factory,
      lineNo,
      moNo,
      color,
      qaId,
      qcId,
      result
    } = req.query;

    // Build match query
    const matchQuery = {};

    if (startDate && endDate) {
      matchQuery.inspectionDate = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      };
    }
    if (reportType) matchQuery.reportType = reportType;
    if (factory) matchQuery.factory = factory;
    if (lineNo) matchQuery.lineNo = lineNo;
    if (moNo) matchQuery.moNo = moNo;
    if (color) matchQuery.color = color;
    if (qaId) matchQuery["preparedBy.empId"] = qaId;

    // Aggregate pipeline
    const pipeline = [
      { $match: matchQuery },
      { $sort: { inspectionDate: -1, _id: -1 } },

      // Unwind qcData to create one document per QC
      { $unwind: "$qcData" },

      // Optional: Filter by qcId if provided
      ...(qcId ? [{ $match: { "qcData.qcID": qcId } }] : []),

      // Calculate severity counts and pass rate for each QC
      {
        $addFields: {
          minorCount: {
            $reduce: {
              input: "$qcData.defectList",
              initialValue: 0,
              in: {
                $cond: [
                  { $eq: ["$$this.standardStatus", "Minor"] },
                  { $add: ["$$value", "$$this.qty"] },
                  "$$value"
                ]
              }
            }
          },
          majorCount: {
            $reduce: {
              input: "$qcData.defectList",
              initialValue: 0,
              in: {
                $cond: [
                  { $eq: ["$$this.standardStatus", "Major"] },
                  { $add: ["$$value", "$$this.qty"] },
                  "$$value"
                ]
              }
            }
          },
          criticalCount: {
            $reduce: {
              input: "$qcData.defectList",
              initialValue: 0,
              in: {
                $cond: [
                  { $eq: ["$$this.standardStatus", "Critical"] },
                  { $add: ["$$value", "$$this.qty"] },
                  "$$value"
                ]
              }
            }
          }
        }
      },

      // Calculate weighted defect sum
      {
        $addFields: {
          weightedDefectSum: {
            $reduce: {
              input: "$qcData.defectList",
              initialValue: 0,
              in: {
                $add: [
                  "$$value",
                  {
                    $multiply: [
                      "$$this.qty",
                      {
                        $switch: {
                          branches: [
                            {
                              case: { $eq: ["$$this.standardStatus", "Minor"] },
                              then: 1
                            },
                            {
                              case: { $eq: ["$$this.standardStatus", "Major"] },
                              then: 1.5
                            },
                            {
                              case: {
                                $eq: ["$$this.standardStatus", "Critical"]
                              },
                              then: 2
                            }
                          ],
                          default: 0
                        }
                      }
                    ]
                  }
                ]
              }
            }
          }
        }
      },

      // Calculate pass rate and result
      {
        $addFields: {
          passRate: {
            $cond: [
              { $eq: ["$qcData.checkedQty", 0] },
              0,
              {
                $subtract: [
                  1,
                  { $divide: ["$weightedDefectSum", "$qcData.checkedQty"] }
                ]
              }
            ]
          }
        }
      },

      {
        $addFields: {
          passRatePercent: { $multiply: ["$passRate", 100] },
          result: {
            $switch: {
              branches: [
                {
                  case: { $eq: [{ $multiply: ["$passRate", 100] }, 100] },
                  then: "A"
                },
                {
                  case: {
                    $and: [
                      { $gte: [{ $multiply: ["$passRate", 100] }, 95] },
                      { $lt: [{ $multiply: ["$passRate", 100] }, 100] }
                    ]
                  },
                  then: "B"
                },
                {
                  case: {
                    $and: [
                      { $gte: [{ $multiply: ["$passRate", 100] }, 92.5] },
                      { $lt: [{ $multiply: ["$passRate", 100] }, 95] }
                    ]
                  },
                  then: "C"
                }
              ],
              default: "D"
            }
          },
          defectRate: {
            $cond: [
              { $eq: ["$qcData.checkedQty", 0] },
              0,
              {
                $multiply: [
                  {
                    $divide: ["$qcData.totalDefectQty", "$qcData.checkedQty"]
                  },
                  100
                ]
              }
            ]
          }
        }
      },

      // Optional: Filter by result if provided
      ...(result ? [{ $match: { result: result } }] : []),

      // Use $facet to get both data and filter options
      {
        $facet: {
          reports: [{ $sort: { inspectionDate: -1 } }],

          summary: [
            {
              $group: {
                _id: null,
                totalCheckedQty: { $sum: "$qcData.checkedQty" },
                totalRejectPcs: { $sum: "$qcData.rejectPcs" },
                totalDefectQty: { $sum: "$qcData.totalDefectQty" },
                totalMinorCount: { $sum: "$minorCount" },
                totalMajorCount: { $sum: "$majorCount" },
                totalCriticalCount: { $sum: "$criticalCount" }
              }
            },
            {
              $project: {
                _id: 0,
                totalCheckedQty: 1,
                totalRejectPcs: 1,
                totalDefectQty: 1,
                totalMinorCount: 1,
                totalMajorCount: 1,
                totalCriticalCount: 1,
                defectRate: {
                  $cond: [
                    { $eq: ["$totalCheckedQty", 0] },
                    0,
                    {
                      $multiply: [
                        { $divide: ["$totalDefectQty", "$totalCheckedQty"] },
                        100
                      ]
                    }
                  ]
                },
                defectRatio: {
                  $cond: [
                    { $eq: ["$totalCheckedQty", 0] },
                    0,
                    {
                      $multiply: [
                        { $divide: ["$totalRejectPcs", "$totalCheckedQty"] },
                        100
                      ]
                    }
                  ]
                }
              }
            }
          ],

          filterOptions: [
            {
              $group: {
                _id: null,
                reportTypes: { $addToSet: "$reportType" },
                factories: { $addToSet: "$factory" },
                lineNos: { $addToSet: "$lineNo" },
                moNos: { $addToSet: "$moNo" },
                colors: { $addToSet: "$color" },
                qaIds: { $addToSet: "$preparedBy.empId" },
                qcIds: { $addToSet: "$qcData.qcID" },
                results: { $addToSet: "$result" }
              }
            },
            {
              $project: {
                _id: 0,
                reportTypes: {
                  $sortArray: { input: "$reportTypes", sortBy: 1 }
                },
                factories: { $sortArray: { input: "$factories", sortBy: 1 } },
                lineNos: { $sortArray: { input: "$lineNos", sortBy: 1 } },
                moNos: { $sortArray: { input: "$moNos", sortBy: 1 } },
                colors: { $sortArray: { input: "$colors", sortBy: 1 } },
                qaIds: { $sortArray: { input: "$qaIds", sortBy: 1 } },
                qcIds: { $sortArray: { input: "$qcIds", sortBy: 1 } },
                results: { $sortArray: { input: "$results", sortBy: 1 } }
              }
            }
          ]
        }
      },

      {
        $project: {
          reports: "$reports",
          summary: { $arrayElemAt: ["$summary", 0] },
          filterOptions: { $arrayElemAt: ["$filterOptions", 0] }
        }
      }
    ];

    const resultQA = await SubconSewingQAReport.aggregate(pipeline);

    const responseData = {
      reports: resultQA[0]?.reports || [],
      summary: resultQA[0]?.summary || {
        totalCheckedQty: 0,
        totalRejectPcs: 0,
        totalDefectQty: 0,
        totalMinorCount: 0,
        totalMajorCount: 0,
        totalCriticalCount: 0,
        defectRate: 0,
        defectRatio: 0
      },
      filterOptions: resultQA[0]?.filterOptions || {
        reportTypes: [],
        factories: [],
        lineNos: [],
        moNos: [],
        colors: [],
        qaIds: [],
        qcIds: [],
        results: []
      }
    };

    res.json(responseData);
  } catch (error) {
    console.error("Error fetching QA inspection data:", error);
    res.status(500).json({ error: "Failed to fetch inspection data" });
  }
};

export const getSubConQCInspectionDataByID = async (req, res) => {
  try {
      const { reportId } = req.params;
      const report = await SubconSewingQAReport.findById(reportId).lean();
  
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
  
      res.json({ report });
    } catch (error) {
      console.error("Error fetching QA inspection report:", error);
      res.status(500).json({ error: "Failed to fetch report" });
    }
};
import { 
  QC2OrderData,
  ymProdConnection,
  SCCHTOperator,
  SCCFUOperator,
  SCCElasticOperator,
  SubconSewingQc1Report,
  SubconSewingQAReport,
 } from "../controller/MongoDB/dbConnectionController.js";
 import multer from "multer";
 import path from "path";
 import {
  //  __dirname, 
   __backendDir
  } from "../Config/appConfig.js";
  import fs from 'fs';

export const normalizeDateString = (dateStr) => {
   if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  } catch (e) {
    console.error("Error normalizing date string:", dateStr, e);
    // If parsing fails, try to return as is or handle error appropriately
    // For this use case, if it's already MM/DD/YYYY, it might be fine
    const parts = dateStr.split(/[-/]/);
    if (parts.length === 3) {
      // Attempt to reformat if it looks like YYYY-MM-DD or DD-MM-YYYY
      if (parts[0].length === 4) return `${parts[1]}/${parts[2]}/${parts[0]}`; // YYYY/MM/DD -> MM/DD/YYYY
      if (parts[2].length === 4) return `${parts[0]}/${parts[1]}/${parts[2]}`; // DD/MM/YYYY -> MM/DD/YYYY
      if (parts[3].length === 4) return `${parts[2]}/${parts[1]}/${parts[0]}`; // MM/DD/YYYY -> MM/DD/YYYY
    }
    return dateStr; // Fallback
  }
};

// const normalizeDateString = (dateStr) => {
//   if (!dateStr) return null;
//   try {
//     const [month, day, year] = dateStr.split("/").map((part) => part.trim());
//     if (!month || !day || !year || isNaN(month) || isNaN(day) || isNaN(year)) {
//       throw new Error("Invalid date format");
//     }
//     // Add leading zeros to month and day
//     const normalizedMonth = ("0" + parseInt(month, 10)).slice(-2);
//     const normalizedDay = ("0" + parseInt(day, 10)).slice(-2);
//     return `${normalizedMonth}/${normalizedDay}/${year}`;
//   } catch (error) {
//     console.error(`Invalid date string: ${dateStr}`, error);
//     return null;
//   }
// };


export const getResult = (bundleQtyCheck, totalReject) => {
  if (bundleQtyCheck === 5) return totalReject > 1 ? "Fail" : "Pass";
  if (bundleQtyCheck === 9) return totalReject > 3 ? "Fail" : "Pass";
  if (bundleQtyCheck === 14) return totalReject > 5 ? "Fail" : "Pass";
  if (bundleQtyCheck === 20) return totalReject > 7 ? "Fail" : "Pass";
  return "N/A";
};

export const formatDateToMMDDYYYY = (dateInput) => {
   if (!dateInput) return null;
  const d = new Date(dateInput); // Handles ISO string or Date object
  const month = d.getMonth() + 1; // No padding
  const day = d.getDate(); // No padding
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
};

export const generateRandomId = async () => {
  let randomId;
  let isUnique = false;

  while (!isUnique) {
    randomId = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const existing = await QC2OrderData.findOne({ bundle_random_id: randomId });
    if (!existing) isUnique = true;
  }

  return randomId;
};

// Helper function to sanitize input for filenames
export const sanitize = (input) => {
  if (typeof input !== "string") input = String(input);
  let sane = input.replace(/[^a-zA-Z0-9-._]/g, "_");
  if (sane === "." || sane === "..") return "_";
  return sane;
};

// export const getOrdinal = (n) => {
//   if (n <= 0) return String(n);
//   const s = ["th", "st", "nd", "rd"];
//   const v = n % 100;
//   return n + (s[(v - 20) % 10] || s[v] || s[0] || "th");
// }
export const cleanup = (input) => {
  if (typeof input !== "string") input = String(input);
  return input;
};

export const formatDate = (date) => {
  const d = new Date(date);
  return `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d
    .getDate()
    .toString()
    .padStart(2, "0")}/${d.getFullYear()}`;
};

export const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); 
};

// This endpoint is unused
export async function fetchOrderDetails(mono) {
  const collection = ymProdConnection.db.collection("dt_orders");
  const order = await collection.findOne({ Order_No: mono });

  const colorMap = new Map();
  order.OrderColors.forEach((c) => {
    const key = c.Color.toLowerCase().trim();
    if (!colorMap.has(key)) {
      colorMap.set(key, {
        originalColor: c.Color.trim(),
        sizes: new Map(),
      });
    }

    c.OrderQty.forEach((q) => {
      if (q.Quantity > 0) {
        const sizeParts = q.Size.split(";");
        const cleanSize = sizeParts[0].trim();
        const sizeKey = cleanSize.toLowerCase();
        if (!colorMap.get(key).sizes.has(sizeKey)) {
          colorMap.get(key).sizes.set(sizeKey, cleanSize);
        }
      }
    });
  });

  return {
    engName: order.EngName,
    totalQty: order.TotalQty,
    colors: Array.from(colorMap.values()).map((c) => c.originalColor),
    colorSizeMap: Array.from(colorMap.values()).reduce((acc, curr) => {
      acc[curr.originalColor.toLowerCase()] = Array.from(curr.sizes.values());
      return acc;
    }, {}),
  };
}

// Helper function to get the correct operator model
export const getOperatorModel = (type) => {
  switch (type.toLowerCase()) {
      case "ht":
        return SCCHTOperator;
      case "fu":
        return SCCFUOperator;
      case "elastic":
        return SCCElasticOperator;
      default:
        return null;
    }
};


//washing live dashboard
export const getDayRange = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

//Roving Buyer selection

const BUYER_MAPPINGS = [
  { pattern: "COM", name: "MWW" },    // "COM" is intentionally first to be checked before "CO"
  { pattern: "CO", name: "Costco" },
  { pattern: "AR", name: "Aritzia" },
  { pattern: "RT", name: "Reitmans" },
  { pattern: "AF", name: "ANF" },
  { pattern: "NT", name: "STORI" },
  // Add more mappings here as needed
];

export const determineBuyerRoving = (MONo) => {
  if (!MONo) {
    return "Other";
  }

  for (const mapping of BUYER_MAPPINGS) {
    if (MONo.includes(mapping.pattern)) {
      return mapping.name;
    }
  }

  return "Other";
};

const getBuyerAggregationSwitch = () => {
  return {
    $switch: {
      branches: [
        {
          case: { $regexMatch: { input: "$moNo", regex: "COM" } },
          then: "MWW",
        },
        {
          case: { $regexMatch: { input: "$moNo", regex: "CO" } },
          then: "Costco",
        },
        {
          case: { $regexMatch: { input: "$moNo", regex: "AR" } },
          then: "Aritzia",
        },
        {
          case: { $regexMatch: { input: "$moNo", regex: "RT" } },
          then: "Reitmans",
        },
        { case: { $regexMatch: { input: "$moNo", regex: "AF" } }, then: "ANF" },
        {
          case: { $regexMatch: { input: "$moNo", regex: "NT" } },
          then: "STORI",
        },
      ],
      default: "Other",
    },
  };
};

export const buildReportMatchPipeline = (filters) => {
  const {
    startDate,
    endDate,
    buyer,
    moNo,
    tableNo,
    qcId,
    color,
    garmentType,
    spreadTable,
    material,
  } = filters;

  const pipeline = [];
  const match = {};

  // Add buyer field first
  pipeline.push({ $addFields: { buyer: getBuyerAggregationSwitch() } });

  // Build match conditions
  if (buyer) match.buyer = buyer;
  if (moNo) match.moNo = { $regex: moNo, $options: "i" };
  if (tableNo) match.tableNo = tableNo;
  if (qcId) match.cutting_emp_id = qcId;
  if (color) match.color = color;
  if (garmentType) match.garmentType = garmentType;
  if (spreadTable) match["cuttingTableDetails.spreadTable"] = spreadTable;
  if (material) match["fabricDetails.material"] = material;

  // Date filtering
  if (startDate || endDate) {
    match.$expr = match.$expr || {};
    match.$expr.$and = match.$expr.$and || [];
    const dateFromStringExpr = {
      $dateFromString: {
        dateString: "$inspectionDate",
        format: "%m/%d/%Y",
        onError: new Date(0),
        onNull: new Date(0),
      },
    };

    if (startDate) {
      match.$expr.$and.push({
        $gte: [
          dateFromStringExpr,
          new Date(new Date(startDate).setHours(0, 0, 0, 0)),
        ],
      });
    }
    if (endDate) {
      match.$expr.$and.push({
        $lte: [
          dateFromStringExpr,
          new Date(new Date(endDate).setHours(23, 59, 59, 999)),
        ],
      });
    }
  }

  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }

  return pipeline;
};


// Use memoryStorage to handle the file as a buffer in memory first.
const qc2MemoryStorage = multer.memoryStorage();

// Configure multer with memory storage, file filter, and limits.
export const uploadQc2Image = multer({
  storage: qc2MemoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and GIF images are allowed"), false);
    }
  },
});


const rovingStorage = multer.memoryStorage();

// Multer instance for Roving image uploads
export const rovingUpload = multer({
  storage: rovingStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /^(jpeg|jpg|png|gif)$/i;
    const allowedMimeTypes = /^image\/(jpeg|pjpeg|png|gif)$/i;
    const fileExt = path.extname(file.originalname).toLowerCase().substring(1);
    const isExtAllowed = allowedExtensions.test(fileExt);
    const isMimeAllowed = allowedMimeTypes.test(file.mimetype.toLowerCase());
    if (isMimeAllowed && isExtAllowed) {
      cb(null, true);
    } else {
      console.error(
        `File rejected by filter: name='${file.originalname}', mime='${file.mimetype}', ext='${fileExt}'. IsMimeAllowed: ${isMimeAllowed}, IsExtAllowed: ${isExtAllowed}`,
      );
      cb(new Error("Error: Images Only! (jpeg, jpg, png, gif)"));
    }
  },
});

export const getBuyerFromMoNumber = (moNo) => {
  if (!moNo) return "Other";

  // Check for the more specific "COM" first to correctly identify MWW
  if (moNo.includes("COM")) return "MWW";

  // Then, check for the more general "CO" for Costco
  if (moNo.includes("CO")) return "Costco";

  // The rest of the original rules
  if (moNo.includes("AR")) return "Aritzia";
  if (moNo.includes("RT")) return "Reitmans";
  if (moNo.includes("AF")) return "ANF";
  if (moNo.includes("NT")) return "STORI";

  if (moNo.includes("YMCMH")) return "Elite";
  if (moNo.includes("YMCMT")) return "Elite";

  // Default case if no other rules match
  return "Other";
};

export const sccUploadPath = path.join(__backendDir, "public", "storage", "scc_images");
//fs.mkdirSync(sccUploadPath, { recursive: true }); // Make sure directory exists

// 2. MODIFIED: Use memoryStorage to process the image buffer in RAM before saving
const sccMemoryStorage = multer.memoryStorage();
export const sccUpload = multer({
  storage: sccMemoryStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // Optional: Add a limit (e.g., 25MB) to prevent very large files
});

export const getAqlLevelForBuyer = (buyer) => {
  if (!buyer) return 1.0;
  const buyerUpper = buyer.toUpperCase();

  if (buyerUpper.includes("MWW")) return 2.5;
  if (buyerUpper.includes("REITMANS")) return 4.0;
  if (buyerUpper.includes("ARITZIA")) return 1.5;
  if (
    buyerUpper.includes("A & F") ||
    buyerUpper.includes("A&F") ||
    buyerUpper.includes("ANF")
  )
    return 1.5;
  if (buyerUpper.includes("COSCO")) return 1.0;

  return 1.0;
};

// Use memoryStorage to handle the file as a buffer in memory first.
const qc2_washing_MemoryStorage = multer.memoryStorage();

// Configure multer with memory storage, file filter, and limits.
export const uploadQC2_washing_image = multer({
  storage: qc2_washing_MemoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and GIF images are allowed"), false);
    }
  },
});

const inspectionMemoryStorage = multer.memoryStorage();

export const uploadInspectionImage = multer({
  storage: inspectionMemoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and GIF images are allowed"), false);
    }
  },
});

const defectMemoryStorage = multer.memoryStorage();
export const uploadDefectImage = multer({
  storage: defectMemoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and GIF images are allowed"), false);
    }
  },
});

export const getMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".bmp": "image/bmp",
    ".svg": "image/svg+xml",
  };
  return mimeTypes[ext] || "image/jpeg";
};

// Helper function to generate a unique Report ID
export const generateSubconReportID = async () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  // Generate a 4-digit random number
  const randomPart = Math.floor(1000 + Math.random() * 9000).toString();

  let reportID = `SC${year}${month}${day}${randomPart}`;

  // Check if the ID already exists to ensure uniqueness
  let existingReport = await SubconSewingQc1Report.findOne({ reportID });
  while (existingReport) {
    const newRandomPart = Math.floor(1000 + Math.random() * 9000).toString();
    reportID = `SC${year}${month}${day}${newRandomPart}`;
    existingReport = await SubconSewingQc1Report.findOne({ reportID });
  }

  return reportID;
};


// QA Standered defect Imagers//
const qaImageStorage = multer.memoryStorage();
export const qaImageUpload = multer({
  storage: qaImageStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
});

// Helper function to generate a unique Report ID for QA
 export const generateSubconQAReportID = async () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const randomPart = Math.floor(1000 + Math.random() * 9000).toString();
  let reportID = `SQA${year}${month}${day}${randomPart}`;

  let existingReport = await SubconSewingQAReport.findOne({ reportID });
  while (existingReport) {
    const newRandomPart = Math.floor(1000 + Math.random() * 9000).toString();
    reportID = `SQA${year}${month}${day}${newRandomPart}`;
    existingReport = await SubconSewingQAReport.findOne({ reportID });
  }
  return reportID;
};

// Helper function to escape special characters for regex
export function escapeRegex(string) {
  if (typeof string !== "string") {
    return "";
  }
  return string.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

// Configure multer for roving pairing images
const rovingImageStorage = multer.memoryStorage();
export const uploadRovingImage = multer({
  storage: rovingImageStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, GIF, and WebP images are allowed'), false);
    }
  },
});

// MODIFIED: Use memoryStorage to handle the file in memory for processing.
const cuttingMemoryStorage = multer.memoryStorage();
 export const cutting_upload = multer({
  storage: cuttingMemoryStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // Increased limit to 25MB to handle uncompressed files from client
});


// Helper to parse pressure string to number (if needed, but schema now enforces Number)
export const parsePressureToNumber = (pressureStr) => {
  if (pressureStr === null || pressureStr === undefined || pressureStr === "")
    return null;
  const num = parseFloat(pressureStr);
  return isNaN(num) ? null : num;
};


// Helper function to generate all necessary date formats from a single input
export const getConsolidatedDateFormats = (dateInput) => {
  const date = new Date(dateInput);

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Format for schemas without leading zeros: 'M/D/YYYY'
  const stringDate = `${month}/${day}/${year}`;

  // Format for schemas WITH leading zeros: 'MM/DD/YYYY'
  const paddedStringDate = `${String(month).padStart(2, "0")}/${String(
    day,
  ).padStart(2, "0")}/${year}`;

  // Format for ISODate-based schemas (timestamp)
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return {
    stringDate,
    paddedStringDate,
    isoStartDate: startOfDay,
    isoEndDate: endOfDay,
  };
};


// 1. Define the absolute destination path and ensure the directory exists
const auditUploadPath = path.join(
  __backendDir,
  "public",
  "storage",
  "audit_images",
);
//fs.mkdirSync(auditUploadPath, { recursive: true }); // This is the correct way to ensure the directory exists

// 2. Update the multer storage configuration
const audit_storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use the absolute path variable here
    cb(null, auditUploadPath);
  },
  filename: (req, file, cb) => {
    // Sanitize requirementId or use a UUID for more robust filenames
    const requirementId = req.body.requirementId || "unknown";
    cb(
      null,
      `audit-${requirementId}-${Date.now()}${path.extname(file.originalname)}`,
    );
  },
});

export const audit_image_upload = multer({
  storage: audit_storage,
  fileFilter: (req, file, cb) => {
    // Same fileFilter as your cutting_upload
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"]; // Added GIF
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, GIF images are allowed"), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});


// Helper function to map page identifiers to keywords in processName
export const getProcessKeywordForPage = (pageIdentifier) => {
  const keywordMap = {
    "bundle-registration": "bundle",
    washing: "washing",
    opa: "opa",
    ironing: "ironing",
    packing: "packing", // The keyword remains the same
    "qc2-inspection": "qc2",
  };
  return keywordMap[pageIdentifier.toLowerCase()];
};

// --- FIX #2: NEW IMAGE UPLOAD ENDPOINT FOR QA ACCURACY ---
const qaAccuracyStorage = multer.memoryStorage();
export const qaAccuracyUpload = multer({
  storage: qaAccuracyStorage,
  limits: { fileSize: 25 * 1024 * 1024 },
});


// Helper function to generate date strings in M/D/YYYY format for filtering
export const generateDateStringsCuttingDashboard = (startDate, endDate) => {
  if (!startDate || !endDate) return [];
  const dates = [];
  let currentDate = new Date(startDate);
  const lastDate = new Date(endDate);

  currentDate.setHours(0, 0, 0, 0);
  lastDate.setHours(0, 0, 0, 0);

  while (currentDate <= lastDate) {
    const M = currentDate.getMonth() + 1;
    const D = currentDate.getDate();
    const Y = currentDate.getFullYear();
    dates.push(`${M}/${D}/${Y}`);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
};

// This is the logic for the buyer helper, translated into MongoDB aggregation syntax.
// It will be used inside an $addFields stage.
export const derivedBuyerLogic = {
  $switch: {
    branches: [
      { case: { $regexMatch: { input: "$moNo", regex: "COM" } }, then: "MWW" },
      {
        case: { $regexMatch: { input: "$moNo", regex: "CO" } },
        then: "Costco",
      },
      {
        case: { $regexMatch: { input: "$moNo", regex: "AR" } },
        then: "Aritzia",
      },
      {
        case: { $regexMatch: { input: "$moNo", regex: "RT" } },
        then: "Reitmans",
      },
      { case: { $regexMatch: { input: "$moNo", regex: "AF" } }, then: "ANF" },
      { case: { $regexMatch: { input: "$moNo", regex: "NT" } }, then: "STORI" },
    ],
    default: "Other",
  },
};

//AfterIroning Overall summary card calculation
export const calculateOverallSummary = (data) => {
  const {
    defectDetails = {},
    measurementDetails = {},
    checkedQty = 0,
    ironingQty = 0,
    washQty = 0,
  } = data;

  // 1. Calculate totalCheckedPcs from measurement data
  let totalCheckedPcs = 0;
  const measurementArray = measurementDetails.measurement || [];
  
  measurementArray.forEach((measurement) => {
    if (typeof measurement.qty === "number" && measurement.qty > 0) {
      totalCheckedPcs += measurement.qty;
    }
  });

  // Fallback to checkedQty if no measurement data
  if (totalCheckedPcs === 0) {
    totalCheckedPcs = parseInt(checkedQty, 10) || 0;
  }

  // 2. Calculate measurement points and passes
  let measurementPoints = 0;
  let measurementPass = 0;

  // Use measurementSizeSummary if available (most accurate)
  if (measurementDetails.measurementSizeSummary?.length > 0) {
    measurementDetails.measurementSizeSummary.forEach(sizeData => {
      measurementPoints += (sizeData.checkedPoints || 0);
      measurementPass += (sizeData.totalPass || 0);
    });
  } else {
    // Fallback: Calculate from measurement array
    measurementArray.forEach((data) => {
      if (Array.isArray(data.pcs)) {
        data.pcs.forEach((pc) => {
          if (Array.isArray(pc.measurementPoints)) {
            pc.measurementPoints.forEach((point) => {
              if (point.result === "pass" || point.result === "fail") {
                measurementPoints++;
                if (point.result === "pass") measurementPass++;
              }
            });
          }
        });
      }
    });
  }

  // 3. Calculate defect statistics
  const rejectedDefectPcs = Array.isArray(defectDetails.defectsByPc)
    ? defectDetails.defectsByPc.length
    : 0;
    
  const totalDefectCount = defectDetails.defectsByPc
    ? defectDetails.defectsByPc.reduce((sum, pc) => {
        return sum + (Array.isArray(pc.pcDefects)
          ? pc.pcDefects.reduce((defSum, defect) =>
              defSum + (parseInt(defect.defectQty, 10) || 0), 0)
          : 0);
      }, 0)
    : 0;

  // 4. Calculate rates
  const defectRate = totalCheckedPcs > 0
    ? Number(((totalDefectCount / totalCheckedPcs) * 100).toFixed(1))
    : 0;
    
  const defectRatio = totalCheckedPcs > 0
    ? Number(((rejectedDefectPcs / totalCheckedPcs) * 100).toFixed(1))
    : 0;

  const passRate = measurementPoints > 0 
    ? Math.round((measurementPass / measurementPoints) * 100) 
    : 100;

  // 5. SINGLE OVERALL RESULT CALCULATION
  const defectResult = defectDetails.result || "Pass";
  const overallFinalResult = (passRate >= 95 && defectResult === "Pass") ? "Pass" : "Fail";

  return {
    totalCheckedPcs,
    rejectedDefectPcs,
    totalDefectCount,
    defectRate,
    defectRatio,
    totalCheckedPoint: measurementPoints,
    totalPass: measurementPass,
    totalFail: measurementPoints - measurementPass,
    passRate,
    overallFinalResult,
    // For compatibility
    overallResult: overallFinalResult,
  };
};

//translator imagers
export const tanslatorImage
 = multer({ 
  storage: multer.memoryStorage(), // Store in memory instead of disk
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

const coverPageStorage = multer.memoryStorage();

export const uploadCoverPageImage = multer({
  storage: coverPageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, GIF, and WebP images are allowed"), false);
    }
  },
});

export const processImageBuffer = async (buffer, filename, directory) => {
  try {
    // Create the full path to the storage directory
    const uploadPath = path.join(__backendDir, "public", "storage", directory);
    
    // Create the full file path
    const filePath = path.join(uploadPath, filename);
    
    // Ensure the directory exists. If not, create it.
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    // Write the buffer to the file
    fs.writeFileSync(filePath, buffer);
    
    // Return the relative path for API URL (this gets saved in DB)
    return `/storage/${directory}/${filename}`;
  } catch (error) {
    console.error('Error in processImageBuffer:', error);
    throw new Error(`Failed to process image: ${error.message}`);
  }
};

// Enhanced image validation
export const validateImageBuffer = (buffer, maxSizeInMB = 5) => {
  try {
    if (!buffer) return { isValid: true };
    
    const sizeInMB = buffer.length / (1024 * 1024);
    
    if (sizeInMB > maxSizeInMB) {
      return { 
        isValid: false, 
        error: `Image size exceeds ${maxSizeInMB}MB limit` 
      };
    }
    
    return { isValid: true };
  } catch (error) {
    return { 
      isValid: false, 
      error: 'Error validating image buffer' 
    };
  }
};

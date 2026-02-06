import {
  FincheckAIChat,
  FincheckInspectionReports,
  QASectionsAqlBuyerConfig,
} from "../../MongoDB/dbConnectionController.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- CONFIGURATION ---
const HARDCODED_KEY = "your-harcoded-key-xxx";
const API_KEY = process.env.GEMINI_API_KEY || HARDCODED_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);

// ============================================================================
// SCHEMA CONTEXT - DETAILED FOR AI UNDERSTANDING
// ============================================================================
const SCHEMA_CONTEXT = `
You have access to a MongoDB collection 'FincheckInspectionReports' for Quality Assurance Inspection data.

MAIN FIELDS:
- reportId (Number): Unique report ID (e.g., 7582054152)
- inspectionDate (Date): When the inspection occurred
- inspectionType (String): "first" or "re" (re-inspection)
- buyer (String): Buyer/Brand name (e.g., "Zara", "H&M", "Uniqlo")
- orderNos (Array of Strings): PO/Order numbers
- orderNosString (String): Comma-separated order numbers
- orderType (String): "single", "multi", or "batch"
- productType (String): Type of garment
- reportType (String): Report template name
- empId (String): Inspector's employee ID
- empName (String): Inspector's name
- status (String): "draft", "in_progress", "completed", "cancelled"
- measurementMethod (String): "Before", "After", "N/A", "No"
- inspectionMethod (String): "Fixed" or "AQL" - THIS IS CRITICAL FOR AQL CALCULATIONS

INSPECTION DETAILS (nested in inspectionDetails):
- supplier (String): Factory/Supplier name
- factory (String): Factory name
- isSubCon (Boolean): If subcontracted
- subConFactory (String): Subcon factory name
- inspectedQty (Number): Total pieces inspected - CRITICAL FOR AQL
- aqlSampleSize (Number): AQL sample size
- cartonQty (Number): Number of cartons
- shippingStage (String): e.g., "FRI", "DRI", "Size Set"
- totalOrderQty (Number): Total order quantity
- custStyle (String): Customer style code
- customer (String): Customer name
- remarks (String): General remarks

AQL CONFIG (nested in inspectionDetails.aqlConfig):
- inspectionType (String): e.g., "General"
- level (String): e.g., "II"
- minorAQL (Number): Minor AQL level (e.g., 2.5, 4.0)
- majorAQL (Number): Major AQL level (e.g., 2.5, 1.5)
- criticalAQL (Number): Critical AQL level (e.g., 0, 0.65)
- inspectedQty (Number): Qty for AQL calculation
- batch (String): Batch range (e.g., "501 ~ 1200")
- sampleLetter (String): Sample letter code (e.g., "J")
- sampleSize (Number): Sample size from AQL table
- items (Array): Ac/Re values [{status: "Minor", ac: 10, re: 11}, ...]

DEFECT DATA (defectData array - CRITICAL):
Each defect object contains:
- groupId (Number): Configuration group ID
- defectId (ObjectId): Defect reference ID
- defectName (String): Name of the defect
- defectCode (String): Defect code number
- categoryName (String): Defect category
- status (String): "Minor", "Major", or "Critical" (for no-location mode)
- qty (Number): Quantity of this defect
- isNoLocation (Boolean): If defect was recorded without specific location
- locations (Array): Location details with positions
  - Each location has: uniqueId, locationId, locationNo, locationName, view, qty
  - positions array: [{pcsNo, status ("Minor"/"Major"/"Critical"), ...}]
- lineName, tableName, colorName: Context info
- qcUser: QC inspector who recorded it

MEASUREMENT DATA (measurementData array):
- groupId (Number): Config group
- stage (String): "Before" or "After"
- line, table, color: Context
- size (String): Size being measured
- kValue (String): K-value for wash
- allMeasurements (Object): Measured values by spec
- criticalMeasurements (Object): Critical point measurements
- inspectorDecision (String): "pass" or "fail"
- systemDecision (String): "pending", "pass", "fail"

PRODUCTION STATUS (inspectionDetails.productionStatus):
- cutting, sewing, ironing, qc2FinishedChecking, folding, packing (all Numbers)

PACKING LIST (inspectionDetails.packingList):
- totalCartons, totalPcs, finishedCartons, finishedPcs (all Numbers)

TIMESTAMPS:
- createdAt, updatedAt (Date)

IMPORTANT RULES FOR QUERYING:
1. For order numbers: Use orderNos array or orderNosString
2. For buyer search: buyer field (case-sensitive)
3. For inspector: empId or empName
4. For date range: inspectionDate with $gte, $lte
5. For AQL reports: inspectionMethod === "AQL"
6. For Fixed reports: inspectionMethod === "Fixed"
`;

const AQL_CALCULATION_CONTEXT = `
AQL (Acceptable Quality Level) CALCULATION LOGIC:

1. DEFECT COUNTING:
   - For NO-LOCATION defects: status is on the defect itself, qty is the count
   - For LOCATION-BASED defects: status is on each position in locations[].positions[]
   - Count each position as 1 defect of its status type

2. AQL RESULT DETERMINATION:
   - Get Ac (Accept) and Re (Reject) values from aqlConfig.items
   - For each severity (Minor, Major, Critical):
     * If found_count <= Ac → PASS
     * If found_count >= Re → FAIL
   
3. FINAL RESULT:
   - If ANY severity FAILS → Overall FAIL
   - If ALL severities PASS → Overall PASS

4. FIXED METHOD REPORTS:
   - No AQL calculation applies
   - inspectionMethod === "Fixed"
   - Simply report defect counts without Ac/Re comparison
`;

const SYSTEM_INSTRUCTION = `
You are the Fincheck Inspection AI Assistant - an expert in garment quality assurance, AQL standards, and inspection data analysis.

${SCHEMA_CONTEXT}

${AQL_CALCULATION_CONTEXT}

YOUR CAPABILITIES:
1. Query inspection reports by any field
2. Calculate AQL results for AQL-method inspections
3. Analyze defect patterns and trends
4. Summarize measurement data
5. Compare inspections across time periods
6. Provide quality insights and recommendations

RESPONSE RULES:
1. For GENERAL questions about QA/AQL concepts, answer directly with expertise.
2. For DATA-SPECIFIC questions, you MUST request data using the QUERY or FUNCTION prefix.

QUERY FORMAT (for fetching data):
QUERY: {"reportId": 7582054152}
QUERY: {"buyer": "Zara", "status": "completed", "limit": 5}
QUERY: {"inspectionDate": {"$gte": "2024-01-01"}, "limit": 10}
QUERY: {"orderNos": "PO12345"}
QUERY: {"defectAnalysis": true, "reportId": 7582054152}
QUERY: {"aqlCalculation": true, "reportId": 7582054152}

FUNCTION FORMAT (for special calculations):
FUNCTION: calculateAQL(reportId: 7582054152)
FUNCTION: getDefectSummary(reportId: 7582054152)
FUNCTION: compareReports(reportIds: [123, 456])
FUNCTION: getInspectorStats(empId: "E001", dateRange: "last30days")

FORMATTING:
- Use **bold** for important values
- Use \`code\` for technical terms, codes, and IDs
- Use bullet points for lists
- Present data in clear, structured formats
- When showing defect summaries, always show: Defect Code, Name, Minor/Major/Critical counts

NEVER make up data. Always query first.
When you receive SYSTEM_DATA_RESULT, analyze it thoroughly and answer the user's question.
`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate defect totals from defectData array
 */
const calculateDefectTotals = (defectData) => {
  const totals = { minor: 0, major: 0, critical: 0, total: 0 };
  const defectsList = {};

  if (!defectData || !Array.isArray(defectData))
    return { totals, defectsList: [] };

  defectData.forEach((defect) => {
    const defectKey = defect.defectId?.toString() || defect.defectName;

    if (!defectsList[defectKey]) {
      defectsList[defectKey] = {
        defectId: defect.defectId,
        defectName: defect.defectName,
        defectCode: defect.defectCode,
        categoryName: defect.categoryName,
        minor: 0,
        major: 0,
        critical: 0,
        total: 0,
      };
    }

    const entry = defectsList[defectKey];

    if (defect.isNoLocation) {
      // No-location mode: status is on defect itself
      const status = defect.status?.toLowerCase();
      const qty = defect.qty || 1;

      if (status === "minor") {
        entry.minor += qty;
        totals.minor += qty;
      } else if (status === "major") {
        entry.major += qty;
        totals.major += qty;
      } else if (status === "critical") {
        entry.critical += qty;
        totals.critical += qty;
      }
      entry.total += qty;
      totals.total += qty;
    } else {
      // Location-based: status is on each position
      if (defect.locations && Array.isArray(defect.locations)) {
        defect.locations.forEach((loc) => {
          if (loc.positions && Array.isArray(loc.positions)) {
            loc.positions.forEach((pos) => {
              const status = pos.status?.toLowerCase();
              if (status === "minor") {
                entry.minor += 1;
                totals.minor += 1;
              } else if (status === "major") {
                entry.major += 1;
                totals.major += 1;
              } else if (status === "critical") {
                entry.critical += 1;
                totals.critical += 1;
              }
              entry.total += 1;
              totals.total += 1;
            });
          }
        });
      }
    }
  });

  return {
    totals,
    defectsList: Object.values(defectsList).sort((a, b) => {
      const codeA = parseFloat(a.defectCode) || 0;
      const codeB = parseFloat(b.defectCode) || 0;
      return codeA - codeB;
    }),
  };
};

/**
 * ✅ FIXED: Fetch AQL Configuration from QASectionsAqlBuyerConfig
 */
const fetchAQLConfigForBuyer = async (buyer, inspectedQty) => {
  try {
    // Fetch all configs for this buyer (Minor, Major, Critical)
    const configs = await QASectionsAqlBuyerConfig.find({ Buyer: buyer });

    if (!configs || configs.length === 0) {
      return {
        error: true,
        message: `No AQL configuration found for buyer: ${buyer}`,
      };
    }

    // Find the matching sample data based on inspectedQty
    const minorConfig = configs.find((c) => c.Status === "Minor");
    const majorConfig = configs.find((c) => c.Status === "Major");
    const criticalConfig = configs.find((c) => c.Status === "Critical");

    // Helper to find matching batch
    const findMatchingSample = (config) => {
      if (!config || !config.SampleData) return null;
      return config.SampleData.find(
        (sample) => inspectedQty >= sample.Min && inspectedQty <= sample.Max,
      );
    };

    const minorSample = findMatchingSample(minorConfig);
    const majorSample = findMatchingSample(majorConfig);
    const criticalSample = findMatchingSample(criticalConfig);

    // Use the first available config for base info
    const baseConfig = minorConfig || majorConfig || criticalConfig;

    return {
      error: false,
      buyer,
      inspectedQty,
      inspectionType: baseConfig?.InspectionType || "General",
      level: baseConfig?.Level || "II",
      minorAQL: minorConfig?.AQLLevel || null,
      majorAQL: majorConfig?.AQLLevel || null,
      criticalAQL: criticalConfig?.AQLLevel || null,
      batch: minorSample?.BatchName || majorSample?.BatchName || "N/A",
      sampleLetter:
        minorSample?.SampleLetter || majorSample?.SampleLetter || "N/A",
      sampleSize: minorSample?.SampleSize || majorSample?.SampleSize || 0,
      minor: minorSample,
      major: majorSample,
      critical: criticalSample,
    };
  } catch (error) {
    console.error("Error fetching AQL config:", error);
    return {
      error: true,
      message: `Failed to fetch AQL config: ${error.message}`,
    };
  }
};

/**
 * ✅ FIXED: Calculate AQL result using QASectionsAqlBuyerConfig
 */
const calculateAQLResult = async (report) => {
  if (!report) return null;

  // Check if this is an AQL method report
  if (report.inspectionMethod !== "AQL") {
    return {
      isAQL: false,
      message:
        "This report uses Fixed Qty method, not AQL. AQL calculation is not applicable.",
      inspectionMethod: report.inspectionMethod,
    };
  }

  const { defectData, buyer, inspectionDetails } = report;
  const inspectedQty = inspectionDetails?.inspectedQty || 0;

  if (!buyer) {
    return {
      isAQL: true,
      error: true,
      message: "Buyer information is missing from this report.",
    };
  }

  if (!inspectedQty || inspectedQty <= 0) {
    return {
      isAQL: true,
      error: true,
      message: "Inspected quantity is missing or invalid.",
    };
  }

  // ✅ FIXED: Fetch AQL config from QASectionsAqlBuyerConfig
  const aqlConfig = await fetchAQLConfigForBuyer(buyer, inspectedQty);

  if (aqlConfig.error) {
    return {
      isAQL: true,
      error: true,
      message: aqlConfig.message,
    };
  }

  // Calculate defect totals
  const { totals, defectsList } = calculateDefectTotals(defectData);

  // Determine status for each severity
  const getStatus = (count, sample) => {
    if (!sample || sample.Ac === null || sample.Ac === undefined) {
      return { status: "N/A", reason: "No AQL config for this level" };
    }
    if (count <= sample.Ac) {
      return { status: "PASS", reason: `${count} ≤ ${sample.Ac} (Ac)` };
    } else {
      return { status: "FAIL", reason: `${count} ≥ ${sample.Re} (Re)` };
    }
  };

  const minorResult = getStatus(totals.minor, aqlConfig.minor);
  const majorResult = getStatus(totals.major, aqlConfig.major);
  const criticalResult = getStatus(totals.critical, aqlConfig.critical);

  const hasAnyFail =
    minorResult.status === "FAIL" ||
    majorResult.status === "FAIL" ||
    criticalResult.status === "FAIL";

  return {
    isAQL: true,
    reportId: report.reportId,
    buyer: report.buyer,
    inspectedQty,
    aqlConfig: {
      inspectionType: aqlConfig.inspectionType,
      level: aqlConfig.level,
      batch: aqlConfig.batch,
      sampleLetter: aqlConfig.sampleLetter,
      sampleSize: aqlConfig.sampleSize,
      minorAQL: aqlConfig.minorAQL,
      majorAQL: aqlConfig.majorAQL,
      criticalAQL: aqlConfig.criticalAQL,
    },
    defectTotals: totals,
    defectsList,
    results: {
      minor: {
        count: totals.minor,
        ac: aqlConfig.minor?.Ac || null,
        re: aqlConfig.minor?.Re || null,
        ...minorResult,
      },
      major: {
        count: totals.major,
        ac: aqlConfig.major?.Ac || null,
        re: aqlConfig.major?.Re || null,
        ...majorResult,
      },
      critical: {
        count: totals.critical,
        ac: aqlConfig.critical?.Ac || null,
        re: aqlConfig.critical?.Re || null,
        ...criticalResult,
      },
    },
    finalResult: hasAnyFail ? "FAIL" : "PASS",
    finalMessage: hasAnyFail
      ? "❌ INSPECTION FAILED - One or more severity levels exceeded acceptance criteria"
      : "✅ INSPECTION PASSED - All severity levels within acceptance criteria",
  };
};

/**
 * Get defect summary by group (configuration)
 */
const getDefectSummaryByGroup = (report) => {
  if (!report || !report.defectData) return null;

  const groupsMap = {};
  const { inspectionConfig, defectData } = report;

  // Pre-fill from config groups if available
  if (inspectionConfig?.configGroups) {
    inspectionConfig.configGroups.forEach((group, idx) => {
      const configKey = group.id ? String(group.id) : `conf_${idx}`;
      let label = "";
      if (group.lineName || group.line)
        label += `Line ${group.lineName || group.line}`;
      if (group.tableName || group.table)
        label +=
          (label ? " • " : "") + `Table ${group.tableName || group.table}`;
      if (group.colorName || group.color)
        label += (label ? " • " : "") + (group.colorName || group.color);

      groupsMap[configKey] = {
        configKey,
        configLabel: label || "General",
        lineName: group.lineName || group.line,
        tableName: group.tableName || group.table,
        colorName: group.colorName || group.color,
        defects: [],
        totals: { minor: 0, major: 0, critical: 0, total: 0 },
      };
    });
  }

  // Process defects
  defectData.forEach((defect) => {
    const configKey = defect.groupId ? String(defect.groupId) : "legacy";

    if (!groupsMap[configKey]) {
      let label = "";
      if (defect.lineName) label += `Line ${defect.lineName}`;
      if (defect.tableName)
        label += (label ? " • " : "") + `Table ${defect.tableName}`;
      if (defect.colorName) label += (label ? " • " : "") + defect.colorName;

      groupsMap[configKey] = {
        configKey,
        configLabel: label || "Unknown",
        lineName: defect.lineName,
        tableName: defect.tableName,
        colorName: defect.colorName,
        defects: [],
        totals: { minor: 0, major: 0, critical: 0, total: 0 },
      };
    }

    const group = groupsMap[configKey];
    let minor = 0,
      major = 0,
      critical = 0,
      total = 0;

    if (defect.isNoLocation) {
      const status = defect.status?.toLowerCase();
      const qty = defect.qty || 1;
      if (status === "minor") minor += qty;
      else if (status === "major") major += qty;
      else if (status === "critical") critical += qty;
      total += qty;
    } else if (defect.locations) {
      defect.locations.forEach((loc) => {
        if (loc.positions) {
          loc.positions.forEach((pos) => {
            const status = pos.status?.toLowerCase();
            if (status === "minor") minor += 1;
            else if (status === "major") major += 1;
            else if (status === "critical") critical += 1;
            total += 1;
          });
        }
      });
    }

    group.defects.push({
      defectCode: defect.defectCode,
      defectName: defect.defectName,
      minor,
      major,
      critical,
      total,
    });

    group.totals.minor += minor;
    group.totals.major += major;
    group.totals.critical += critical;
    group.totals.total += total;
  });

  return Object.values(groupsMap);
};

/**
 * Get measurement summary
 */
const getMeasurementSummary = (report) => {
  if (
    !report ||
    !report.measurementData ||
    report.measurementData.length === 0
  ) {
    return { available: false };
  }

  const data = report.measurementData;
  const byStage = { Before: [], After: [] };

  data.forEach((m) => {
    const stage = m.stage || "Before";
    byStage[stage].push({
      size: m.size,
      decision: m.inspectorDecision,
      systemDecision: m.systemDecision,
      line: m.lineName,
      table: m.tableName,
      color: m.colorName,
    });
  });

  const totalMeasurements = data.length;
  const passCount = data.filter((m) => m.inspectorDecision === "pass").length;
  const failCount = data.filter((m) => m.inspectorDecision === "fail").length;

  return {
    available: true,
    method: report.measurementMethod,
    totalMeasurements,
    passCount,
    failCount,
    passRate:
      totalMeasurements > 0
        ? ((passCount / totalMeasurements) * 100).toFixed(1)
        : 0,
    byStage,
  };
};

/**
 * Build a smart query from AI request
 */
const buildSmartQuery = (queryParams) => {
  const query = {};
  const options = { limit: 5, sort: { inspectionDate: -1 } };

  Object.keys(queryParams).forEach((key) => {
    const value = queryParams[key];

    switch (key) {
      case "limit":
        options.limit = Math.min(parseInt(value) || 5, 20);
        break;
      case "sort":
        options.sort = value;
        break;
      case "reportId":
        query.reportId = parseInt(value);
        break;
      case "buyer":
        query.buyer = { $regex: value, $options: "i" };
        break;
      case "orderNo":
      case "orderNos":
        query.orderNos = { $in: [value] };
        break;
      case "empId":
        query.empId = value;
        break;
      case "empName":
        query.empName = { $regex: value, $options: "i" };
        break;
      case "status":
        query.status = value;
        break;
      case "inspectionMethod":
        query.inspectionMethod = value;
        break;
      case "inspectionType":
        query.inspectionType = value;
        break;
      case "productType":
        query.productType = { $regex: value, $options: "i" };
        break;
      case "factory":
        query["inspectionDetails.factory"] = { $regex: value, $options: "i" };
        break;
      case "supplier":
        query["inspectionDetails.supplier"] = { $regex: value, $options: "i" };
        break;
      case "custStyle":
        query["inspectionDetails.custStyle"] = { $regex: value, $options: "i" };
        break;
      case "inspectionDate":
        if (typeof value === "object") {
          query.inspectionDate = {};
          if (value.$gte) query.inspectionDate.$gte = new Date(value.$gte);
          if (value.$lte) query.inspectionDate.$lte = new Date(value.$lte);
        } else {
          query.inspectionDate = new Date(value);
        }
        break;
      case "dateFrom":
        query.inspectionDate = query.inspectionDate || {};
        query.inspectionDate.$gte = new Date(value);
        break;
      case "dateTo":
        query.inspectionDate = query.inspectionDate || {};
        query.inspectionDate.$lte = new Date(value);
        break;
      // Skip special flags
      case "defectAnalysis":
      case "aqlCalculation":
      case "measurementSummary":
      case "fullDetails":
        break;
      default:
        // Generic field match
        query[key] = value;
    }
  });

  return { query, options };
};

/**
 * Execute query and enrich with calculations
 */
const executeEnrichedQuery = async (queryParams) => {
  const { query, options } = buildSmartQuery(queryParams);

  // Determine what fields to select based on request
  let select =
    "reportId inspectionDate buyer orderNos orderNosString inspectionType status empId empName inspectionMethod measurementMethod productType reportType inspectionDetails defectData";

  if (queryParams.measurementSummary || queryParams.fullDetails) {
    select += " measurementData";
  }

  if (queryParams.fullDetails) {
    select += " inspectionConfig headerData photoData ppSheetData";
  }

  const reports = await FincheckInspectionReports.find(query)
    .select(select)
    .sort(options.sort)
    .limit(options.limit)
    .lean();

  // Enrich each report
  const enrichedReports = reports.map((report) => {
    const enriched = {
      ...report,
      // Clean up for AI
      inspectionDetails: {
        factory: report.inspectionDetails?.factory,
        supplier: report.inspectionDetails?.supplier,
        subConFactory: report.inspectionDetails?.subConFactory,
        inspectedQty: report.inspectionDetails?.inspectedQty,
        totalOrderQty: report.inspectionDetails?.totalOrderQty,
        cartonQty: report.inspectionDetails?.cartonQty,
        shippingStage: report.inspectionDetails?.shippingStage,
        custStyle: report.inspectionDetails?.custStyle,
        customer: report.inspectionDetails?.customer,
        aqlConfig: report.inspectionDetails?.aqlConfig,
        productionStatus: report.inspectionDetails?.productionStatus,
        packingList: report.inspectionDetails?.packingList,
        remarks: report.inspectionDetails?.remarks,
      },
    };

    // Calculate defect totals
    if (report.defectData && report.defectData.length > 0) {
      const { totals, defectsList } = calculateDefectTotals(report.defectData);
      enriched.defectSummary = {
        totals,
        defectsList,
        totalUniqueDefects: defectsList.length,
        totalDefectCount: totals.total,
      };
    } else {
      enriched.defectSummary = {
        totals: { minor: 0, major: 0, critical: 0, total: 0 },
        defectsList: [],
        totalUniqueDefects: 0,
        totalDefectCount: 0,
      };
    }

    // AQL calculation if requested or if AQL method
    if (queryParams.aqlCalculation || report.inspectionMethod === "AQL") {
      enriched.aqlResult = calculateAQLResult(report);
    }

    // Measurement summary if requested
    if (queryParams.measurementSummary && report.measurementData) {
      enriched.measurementSummary = getMeasurementSummary(report);
    }

    // Defect by group if requested
    if (queryParams.defectAnalysis) {
      enriched.defectsByGroup = getDefectSummaryByGroup(report);
    }

    // Remove raw arrays to reduce token size unless full details requested
    if (!queryParams.fullDetails) {
      delete enriched.defectData;
      delete enriched.measurementData;
    }

    return enriched;
  });

  return enrichedReports;
};

/**
 * Parse AI response for QUERY or FUNCTION requests
 */
const parseAIRequest = (responseText) => {
  const trimmed = responseText.trim();

  // Check for QUERY
  if (trimmed.startsWith("QUERY:")) {
    try {
      const jsonStr = trimmed.replace("QUERY:", "").trim();
      // Handle potential markdown code blocks
      const cleanJson = jsonStr
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      return { type: "QUERY", params: JSON.parse(cleanJson) };
    } catch (e) {
      console.error("Failed to parse QUERY:", e);
      return null;
    }
  }

  // Check for FUNCTION
  if (trimmed.startsWith("FUNCTION:")) {
    try {
      const funcStr = trimmed.replace("FUNCTION:", "").trim();
      // Parse function name and params: functionName(param: value, ...)
      const match = funcStr.match(/(\w+)\((.*)\)/);
      if (match) {
        const funcName = match[1];
        const paramsStr = match[2];
        const params = {};

        // Parse key: value pairs
        paramsStr.split(",").forEach((pair) => {
          const [key, val] = pair.split(":").map((s) => s.trim());
          if (key && val) {
            // Try to parse as JSON, fallback to string
            try {
              params[key] = JSON.parse(val);
            } catch {
              params[key] = val.replace(/['"]/g, "");
            }
          }
        });

        return { type: "FUNCTION", name: funcName, params };
      }
    } catch (e) {
      console.error("Failed to parse FUNCTION:", e);
      return null;
    }
  }

  return null;
};

/**
 * Execute a function request
 */
const executeFunction = async (funcName, params) => {
  switch (funcName) {
    case "calculateAQL": {
      const report = await FincheckInspectionReports.findOne({
        reportId: parseInt(params.reportId),
      })
        .select("reportId inspectionMethod defectData inspectionDetails")
        .lean();

      if (!report) {
        return { error: `Report ${params.reportId} not found` };
      }
      return calculateAQLResult(report);
    }

    case "getDefectSummary": {
      const report = await FincheckInspectionReports.findOne({
        reportId: parseInt(params.reportId),
      })
        .select("reportId defectData inspectionConfig")
        .lean();

      if (!report) {
        return { error: `Report ${params.reportId} not found` };
      }
      return {
        reportId: report.reportId,
        summary: getDefectSummaryByGroup(report),
      };
    }

    case "compareReports": {
      const reportIds = params.reportIds;
      const reports = await FincheckInspectionReports.find({
        reportId: { $in: reportIds.map((id) => parseInt(id)) },
      })
        .select(
          "reportId inspectionDate buyer inspectionMethod defectData inspectionDetails",
        )
        .lean();

      return reports.map((r) => ({
        reportId: r.reportId,
        inspectionDate: r.inspectionDate,
        buyer: r.buyer,
        inspectionMethod: r.inspectionMethod,
        defectSummary: calculateDefectTotals(r.defectData),
        aqlResult: r.inspectionMethod === "AQL" ? calculateAQLResult(r) : null,
      }));
    }

    case "getInspectorStats": {
      const dateFilter = {};
      if (params.dateRange === "last30days") {
        dateFilter.$gte = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      } else if (params.dateRange === "last7days") {
        dateFilter.$gte = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      }

      const query = { empId: params.empId };
      if (Object.keys(dateFilter).length > 0) {
        query.inspectionDate = dateFilter;
      }

      const reports = await FincheckInspectionReports.find(query)
        .select("reportId inspectionDate status inspectionMethod defectData")
        .lean();

      let totalDefects = 0;
      let totalMinor = 0;
      let totalMajor = 0;
      let totalCritical = 0;

      reports.forEach((r) => {
        const { totals } = calculateDefectTotals(r.defectData);
        totalDefects += totals.total;
        totalMinor += totals.minor;
        totalMajor += totals.major;
        totalCritical += totals.critical;
      });

      return {
        empId: params.empId,
        totalReports: reports.length,
        statusBreakdown: {
          completed: reports.filter((r) => r.status === "completed").length,
          draft: reports.filter((r) => r.status === "draft").length,
          in_progress: reports.filter((r) => r.status === "in_progress").length,
        },
        totalDefectsFound: totalDefects,
        defectBreakdown: {
          minor: totalMinor,
          major: totalMajor,
          critical: totalCritical,
        },
      };
    }

    default:
      return { error: `Unknown function: ${funcName}` };
  }
};

// ============================================================================
// API ENDPOINTS
// ============================================================================

// --- 1. Create Chat ---
export const createChat = async (req, res) => {
  try {
    const { empId, initialMessage } = req.body;
    const newChat = new FincheckAIChat({
      empId,
      title: initialMessage
        ? initialMessage.substring(0, 40) +
          (initialMessage.length > 40 ? "..." : "")
        : "New Conversation",
      messages: [],
    });
    await newChat.save();
    return res.status(200).json({ success: true, data: newChat });
  } catch (error) {
    console.error("Create Chat Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// --- 2. Get User's Chats ---
export const getUserChats = async (req, res) => {
  try {
    const { empId } = req.query;
    const chats = await FincheckAIChat.find({ empId, isDeleted: false })
      .select("title updatedAt createdAt")
      .sort({ updatedAt: -1 });
    return res.status(200).json({ success: true, data: chats });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// --- 3. Get Chat By ID ---
export const getChatById = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await FincheckAIChat.findById(chatId);
    if (!chat) {
      return res
        .status(404)
        .json({ success: false, message: "Chat not found" });
    }
    return res.status(200).json({ success: true, data: chat });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// --- 4. Send Message (Main AI Logic) ---
export const sendMessage = async (req, res) => {
  try {
    const { chatId, message } = req.body;

    if (!API_KEY) {
      return res
        .status(500)
        .json({ success: false, error: "API Key not configured" });
    }

    const chat = await FincheckAIChat.findById(chatId);
    if (!chat) {
      return res
        .status(404)
        .json({ success: false, message: "Chat not found" });
    }

    // 1. Add User Message
    chat.messages.push({ role: "user", content: message });

    // 2. Prepare History for AI
    const history = chat.messages.slice(0, -1).map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    // 3. Initialize Model
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 4096,
      },
    });

    const chatSession = model.startChat({ history });

    // 4. First Call to AI
    let result = await chatSession.sendMessage(message);
    let responseText = result.response.text();

    // 5. Check if AI wants data
    const aiRequest = parseAIRequest(responseText);

    if (aiRequest) {
      try {
        let dataResult;

        if (aiRequest.type === "QUERY") {
          dataResult = await executeEnrichedQuery(aiRequest.params);
        } else if (aiRequest.type === "FUNCTION") {
          console.log(
            `AI Requested FUNCTION: ${aiRequest.name}`,
            aiRequest.params,
          );
          dataResult = await executeFunction(aiRequest.name, aiRequest.params);
        }

        const dataString = JSON.stringify(dataResult, null, 2);

        // Feed data back to AI
        const followUpPrompt = `
SYSTEM_DATA_RESULT:
\`\`\`json
${dataString}
\`\`\`

Now analyze this data and provide a comprehensive, well-formatted answer to the user's original question: "${message}"

Remember to:
- Format numbers clearly
- Highlight important findings
- If this is an AQL report, explain the pass/fail status
- For defects, show the breakdown by severity
- Use tables or lists for better readability
`;

        result = await chatSession.sendMessage(followUpPrompt);
        responseText = result.response.text();
      } catch (dbError) {
        console.error("Data Fetch Error:", dbError);
        responseText = `I encountered an error while fetching data: ${dbError.message}. Please try rephrasing your question or provide more specific criteria.`;
      }
    }

    // 6. Save AI Response
    chat.messages.push({ role: "model", content: responseText });

    // 7. Update Chat Title if new
    if (chat.messages.length <= 4 && chat.title === "New Conversation") {
      // Generate a smart title
      const titlePrompt = `Based on this question: "${message.substring(0, 100)}", generate a very short title (max 35 chars) for this conversation. Just respond with the title, nothing else.`;
      try {
        const titleResult = await model.generateContent(titlePrompt);
        const newTitle = titleResult.response.text().trim().replace(/"/g, "");
        chat.title = newTitle.substring(0, 40);
      } catch {
        chat.title = message.substring(0, 35) + "...";
      }
    }

    chat.updatedAt = new Date();
    await chat.save();

    return res.status(200).json({ success: true, data: chat });
  } catch (error) {
    console.error("AI Error:", error);
    return res.status(500).json({
      success: false,
      error: "AI Service temporarily unavailable. Please try again.",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// --- 5. Rename Chat ---
export const renameChat = async (req, res) => {
  try {
    const { chatId, newTitle } = req.body;
    await FincheckAIChat.findByIdAndUpdate(chatId, {
      title: newTitle,
      updatedAt: new Date(),
    });
    return res
      .status(200)
      .json({ success: true, message: "Chat renamed successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// --- 6. Delete Chat ---
export const deleteChat = async (req, res) => {
  try {
    const { chatId } = req.body;
    await FincheckAIChat.findByIdAndUpdate(chatId, {
      isDeleted: true,
      updatedAt: new Date(),
    });
    return res
      .status(200)
      .json({ success: true, message: "Chat deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// --- 7. Clear Chat History (Keep chat, remove messages) ---
export const clearChatHistory = async (req, res) => {
  try {
    const { chatId } = req.body;
    await FincheckAIChat.findByIdAndUpdate(chatId, {
      messages: [],
      updatedAt: new Date(),
    });
    return res
      .status(200)
      .json({ success: true, message: "Chat history cleared" });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// --- 8. Get Quick Stats (For AI Context) ---
export const getQuickStats = async (req, res) => {
  try {
    const { empId } = req.query;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalReports, todayReports, pendingReports] = await Promise.all([
      FincheckInspectionReports.countDocuments(empId ? { empId } : {}),
      FincheckInspectionReports.countDocuments({
        ...(empId ? { empId } : {}),
        inspectionDate: { $gte: today },
      }),
      FincheckInspectionReports.countDocuments({
        ...(empId ? { empId } : {}),
        status: { $in: ["draft", "in_progress"] },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalReports,
        todayReports,
        pendingReports,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export default {
  createChat,
  getUserChats,
  getChatById,
  sendMessage,
  renameChat,
  deleteChat,
  clearChatHistory,
  getQuickStats,
};

// --- Add Feedback to Message ---
export const addMessageFeedback = async (req, res) => {
  try {
    const { chatId, messageId, rating, comment } = req.body;

    const chat = await FincheckAIChat.findById(chatId);
    if (!chat) {
      return res
        .status(404)
        .json({ success: false, message: "Chat not found" });
    }

    const message = chat.messages.id(messageId);
    if (!message) {
      return res
        .status(404)
        .json({ success: false, message: "Message not found" });
    }

    message.feedback = {
      rating, // 'up' or 'down'
      comment,
      feedbackAt: new Date(),
    };

    await chat.save();

    return res.status(200).json({
      success: true,
      message: "Feedback recorded",
      data: { messageId, rating },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// --- Toggle Pin Chat ---
export const togglePinChat = async (req, res) => {
  try {
    const { chatId } = req.body;

    const chat = await FincheckAIChat.findById(chatId);
    if (!chat) {
      return res
        .status(404)
        .json({ success: false, message: "Chat not found" });
    }

    chat.isPinned = !chat.isPinned;
    await chat.save();

    return res.status(200).json({
      success: true,
      message: chat.isPinned ? "Chat pinned" : "Chat unpinned",
      data: { isPinned: chat.isPinned },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// --- Archive Chat ---
export const archiveChat = async (req, res) => {
  try {
    const { chatId } = req.body;

    await FincheckAIChat.findByIdAndUpdate(chatId, {
      isArchived: true,
      updatedAt: new Date(),
    });

    return res.status(200).json({ success: true, message: "Chat archived" });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// --- Search Chats ---
export const searchChats = async (req, res) => {
  try {
    const { empId, query } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters",
      });
    }

    const chats = await FincheckAIChat.find({
      empId,
      isDeleted: false,
      $or: [
        { title: { $regex: query, $options: "i" } },
        { tags: { $regex: query, $options: "i" } },
      ],
    })
      .select("title updatedAt isPinned tags stats")
      .sort({ isPinned: -1, lastActivityAt: -1 })
      .limit(20);

    return res.status(200).json({ success: true, data: chats });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// --- Get User AI Stats ---
export const getUserAIStats = async (req, res) => {
  try {
    const { empId } = req.query;

    const stats = await FincheckAIChat.aggregate([
      { $match: { empId, isDeleted: false } },
      {
        $group: {
          _id: null,
          totalChats: { $sum: 1 },
          totalMessages: { $sum: "$stats.messageCount" },
          totalQueries: { $sum: "$stats.queriesExecuted" },
          totalPositiveRatings: { $sum: "$stats.positiveRatings" },
          totalNegativeRatings: { $sum: "$stats.negativeRatings" },
          pinnedChats: {
            $sum: { $cond: [{ $eq: ["$isPinned", true] }, 1, 0] },
          },
        },
      },
    ]);

    const result = stats[0] || {
      totalChats: 0,
      totalMessages: 0,
      totalQueries: 0,
      totalPositiveRatings: 0,
      totalNegativeRatings: 0,
      pinnedChats: 0,
    };

    // Calculate satisfaction rate
    const totalRatings =
      result.totalPositiveRatings + result.totalNegativeRatings;
    result.satisfactionRate =
      totalRatings > 0
        ? ((result.totalPositiveRatings / totalRatings) * 100).toFixed(1)
        : null;

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// --- Add Tags to Chat ---
export const addChatTags = async (req, res) => {
  try {
    const { chatId, tags } = req.body;

    const chat = await FincheckAIChat.findById(chatId);
    if (!chat) {
      return res
        .status(404)
        .json({ success: false, message: "Chat not found" });
    }

    // Add unique tags
    const existingTags = new Set(chat.tags);
    tags.forEach((tag) => existingTags.add(tag.toLowerCase()));
    chat.tags = Array.from(existingTags);

    await chat.save();

    return res.status(200).json({
      success: true,
      message: "Tags added",
      data: { tags: chat.tags },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// --- Get Pinned Chats ---
export const getPinnedChats = async (req, res) => {
  try {
    const { empId } = req.query;

    const chats = await FincheckAIChat.find({
      empId,
      isPinned: true,
      isDeleted: false,
    })
      .select("title updatedAt tags stats")
      .sort({ lastActivityAt: -1 });

    return res.status(200).json({ success: true, data: chats });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

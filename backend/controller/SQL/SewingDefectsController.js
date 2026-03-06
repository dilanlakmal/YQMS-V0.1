import sql from "mssql";
import {
  getRealTimeSunrisePool,
  ensureRealTimeSunriseConnected,
} from "./RealTimeSunriseConnectionManager.js";
import { UserMain } from "../MongoDB/dbConnectionController.js";

// Helper: Get dynamic table name for tWork (Adjusted for Cambodia Time GMT+7)
const getTodayTableName = () => {
  const now = new Date();
  const cambodiaOffset = 7 * 60;
  const localOffset = now.getTimezoneOffset();
  const cambodiaTime = new Date(
    now.getTime() + (cambodiaOffset + localOffset) * 60000,
  );

  const year = cambodiaTime.getFullYear();
  const month = String(cambodiaTime.getMonth() + 1).padStart(2, "0");
  const day = String(cambodiaTime.getDate()).padStart(2, "0");

  return `tWork${year}${month}${day}`;
};

// Helper: Get today's date string for dDate filter (YYYY-MM-DD)
const getTodayDateString = () => {
  const now = new Date();
  const cambodiaOffset = 7 * 60;
  const localOffset = now.getTimezoneOffset();
  const cambodiaTime = new Date(
    now.getTime() + (cambodiaOffset + localOffset) * 60000,
  );

  const year = cambodiaTime.getFullYear();
  const month = String(cambodiaTime.getMonth() + 1).padStart(2, "0");
  const day = String(cambodiaTime.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// Helper: Get Buyer from MO Number
const getBuyerFromMoNumber = (moNo) => {
  if (!moNo) return "Other";
  if (moNo.includes("COM")) return "MWW";
  if (moNo.includes("CO")) return "Costco";
  if (moNo.includes("AR")) return "Aritzia";
  if (moNo.includes("RT")) return "Reitmans";
  if (moNo.includes("AF")) return "ANF";
  if (moNo.includes("NT")) return "STORI";
  if (moNo.includes("YMCMH")) return "Elite";
  if (moNo.includes("YMCMT")) return "Elite";
  return "Other";
};

// --- Get Defects Summary Stats ---
export const getDefectsSummaryStats = async (req, res) => {
  try {
    await ensureRealTimeSunriseConnected();
    const pool = getRealTimeSunrisePool();
    const tableName = getTodayTableName();
    const todayDate = getTodayDateString();

    // Query 1: Get Output from tWork table
    const outputQuery = `
      SELECT 
        ISNULL(SUM(CASE WHEN SeqNo = 38 THEN Qty ELSE 0 END), 0) AS Task38Qty,
        ISNULL(SUM(CASE WHEN SeqNo = 39 THEN Qty ELSE 0 END), 0) AS Task39Qty
      FROM [YM-SUNRISE].[SunRiseGar].[dbo].[${tableName}]
      WHERE SeqNo IN (38, 39)
    `;

    // Query 2: Get Defects from tFailHis table (with valid ReworkCode mapping)
    const defectsQuery = `
  SELECT 
    COUNT(*) AS TotalDefects,
    COUNT(DISTINCT f.EmpIDQC) AS TotalQCInspectors,
    COUNT(DISTINCT f.WorkLine) AS TotalLines,
    COUNT(DISTINCT f.MONo) AS TotalStyles,
    COUNT(DISTINCT f.FailCode) AS TotalDefectTypes
  FROM [YM-SUNRISE].[SunRiseGar].[dbo].[tFailHis] f
  INNER JOIN [YM-SUNRISE].[SunRiseGar].[dbo].[tReworkCode] r 
    ON f.FailCode = r.ReworkCode
  WHERE CAST(f.dDate AS DATE) = @TodayDate
    AND f.RackQCFail = 1
`;

    const [outputResult, defectsResult] = await Promise.all([
      pool.request().query(outputQuery),
      pool
        .request()
        .input("TodayDate", sql.Date, todayDate)
        .query(defectsQuery),
    ]);

    const outputRow = outputResult.recordset[0] || {};
    const defectsRow = defectsResult.recordset[0] || {};

    const task38Qty = parseInt(outputRow.Task38Qty) || 0;
    const task39Qty = parseInt(outputRow.Task39Qty) || 0;
    const totalOutput = Math.max(task38Qty, task39Qty);
    const totalDefects = parseInt(defectsRow.TotalDefects) || 0;

    // Calculate defect rate (percentage)
    const defectRate = totalOutput > 0 ? (totalDefects / totalOutput) * 100 : 0;

    const data = {
      Task38Qty: task38Qty,
      Task39Qty: task39Qty,
      TotalOutput: totalOutput,
      TotalDefects: totalDefects,
      DefectRate: parseFloat(defectRate.toFixed(2)),
      TotalQCInspectors: parseInt(defectsRow.TotalQCInspectors) || 0,
      TotalLines: parseInt(defectsRow.TotalLines) || 0,
      TotalStyles: parseInt(defectsRow.TotalStyles) || 0,
      TotalDefectTypes: parseInt(defectsRow.TotalDefectTypes) || 0,
    };

    res.json(data);
  } catch (error) {
    console.error(`[SewingDefects] Stats Error:`, error.message);
    if (error.message.includes("Invalid object name")) {
      return res.json({
        Task38Qty: 0,
        Task39Qty: 0,
        TotalOutput: 0,
        TotalDefects: 0,
        DefectRate: 0,
        TotalQCInspectors: 0,
        TotalLines: 0,
        TotalStyles: 0,
        TotalDefectTypes: 0,
      });
    }
    res.status(500).json({ error: "Failed to fetch defects stats" });
  }
};

// --- Get Defects by Line with Output Data, MO Numbers, and Top Defects ---
export const getDefectsByLine = async (req, res) => {
  try {
    await ensureRealTimeSunriseConnected();
    const pool = getRealTimeSunrisePool();
    const tableName = getTodayTableName();
    const todayDate = getTodayDateString();

    // Query 1: Get Output by Line from tWork table with MO Numbers
    const outputQuery = `
      SELECT 
        WorkLine AS [LineNo],
        MONo,
        ISNULL(SUM(CASE WHEN SeqNo = 38 THEN Qty ELSE 0 END), 0) AS Task38Qty,
        ISNULL(SUM(CASE WHEN SeqNo = 39 THEN Qty ELSE 0 END), 0) AS Task39Qty
      FROM [YM-SUNRISE].[SunRiseGar].[dbo].[${tableName}]
      WHERE SeqNo IN (38, 39)
      GROUP BY WorkLine, MONo
    `;

    // Query 2: Get Defects by Line from tFailHis table
    const defectsQuery = `
      SELECT 
        f.WorkLine AS [LineNo],
        COUNT(*) AS TotalDefects,
        COUNT(DISTINCT f.MONo) AS MOCount,
        COUNT(DISTINCT f.EmpIDQC) AS InspectorCount
      FROM [YM-SUNRISE].[SunRiseGar].[dbo].[tFailHis] f
      INNER JOIN [YM-SUNRISE].[SunRiseGar].[dbo].[tReworkCode] r 
        ON f.FailCode = r.ReworkCode
      WHERE CAST(f.dDate AS DATE) = @TodayDate
        AND f.RackQCFail = 1
      GROUP BY f.WorkLine
    `;

    // Query 3: Get Top Defects by Line with Defect Names
    const topDefectsQuery = `
      SELECT 
        f.WorkLine AS [LineNo],
        r.ReworkCode,
        r.ReworkName,
        COUNT(*) AS DefectQty
      FROM [YM-SUNRISE].[SunRiseGar].[dbo].[tFailHis] f
      INNER JOIN [YM-SUNRISE].[SunRiseGar].[dbo].[tReworkCode] r 
        ON f.FailCode = r.ReworkCode
      WHERE CAST(f.dDate AS DATE) = @TodayDate
        AND f.RackQCFail = 1
      GROUP BY f.WorkLine, r.ReworkCode, r.ReworkName
      ORDER BY f.WorkLine, DefectQty DESC
    `;

    const [outputResult, defectsResult, topDefectsResult] = await Promise.all([
      pool.request().query(outputQuery),
      pool
        .request()
        .input("TodayDate", sql.Date, todayDate)
        .query(defectsQuery),
      pool
        .request()
        .input("TodayDate", sql.Date, todayDate)
        .query(topDefectsQuery),
    ]);

    // Build output map with MO details per line
    const outputMap = {};
    outputResult.recordset.forEach((row) => {
      const lineNo = String(row.LineNo || "").trim();
      const moNo = String(row.MONo || "").trim();
      const task38 = parseInt(row.Task38Qty) || 0;
      const task39 = parseInt(row.Task39Qty) || 0;
      const outputQty = Math.max(task38, task39);

      if (!outputMap[lineNo]) {
        outputMap[lineNo] = {
          Task38Qty: 0,
          Task39Qty: 0,
          OutputQty: 0,
          MONumbers: [],
          MODetails: [],
        };
      }

      outputMap[lineNo].Task38Qty += task38;
      outputMap[lineNo].Task39Qty += task39;
      outputMap[lineNo].OutputQty += outputQty;

      if (moNo && !outputMap[lineNo].MONumbers.includes(moNo)) {
        outputMap[lineNo].MONumbers.push(moNo);
        outputMap[lineNo].MODetails.push({
          MONo: moNo,
          OutputQty: outputQty,
          Buyer: getBuyerFromMoNumber(moNo),
        });
      }
    });

    // Recalculate OutputQty as max of total Task38 and Task39
    Object.keys(outputMap).forEach((lineNo) => {
      outputMap[lineNo].OutputQty = Math.max(
        outputMap[lineNo].Task38Qty,
        outputMap[lineNo].Task39Qty,
      );
    });

    // Build defects map
    const defectsMap = {};
    defectsResult.recordset.forEach((row) => {
      const lineNo = String(row.LineNo || "").trim();
      defectsMap[lineNo] = {
        TotalDefects: parseInt(row.TotalDefects) || 0,
        MOCount: parseInt(row.MOCount) || 0,
        InspectorCount: parseInt(row.InspectorCount) || 0,
      };
    });

    // Build top defects map per line (keep top 3)
    const topDefectsMap = {};
    topDefectsResult.recordset.forEach((row) => {
      const lineNo = String(row.LineNo || "").trim();
      if (!topDefectsMap[lineNo]) {
        topDefectsMap[lineNo] = [];
      }
      // Only keep top 5 for each line
      if (topDefectsMap[lineNo].length < 5) {
        topDefectsMap[lineNo].push({
          ReworkCode: row.ReworkCode,
          ReworkName: row.ReworkName || `Code ${row.ReworkCode}`,
          DefectQty: parseInt(row.DefectQty) || 0,
        });
      }
    });

    // Get all unique lines
    const allLines = new Set([
      ...Object.keys(outputMap),
      ...Object.keys(defectsMap),
    ]);

    // Build final data
    const data = Array.from(allLines)
      .map((lineNo) => {
        const output = outputMap[lineNo] || {
          Task38Qty: 0,
          Task39Qty: 0,
          OutputQty: 0,
          MONumbers: [],
          MODetails: [],
        };
        const defects = defectsMap[lineNo] || {
          TotalDefects: 0,
          MOCount: 0,
          InspectorCount: 0,
        };
        const topDefects = topDefectsMap[lineNo] || [];

        const defectRate =
          output.OutputQty > 0
            ? parseFloat(
                ((defects.TotalDefects / output.OutputQty) * 100).toFixed(2),
              )
            : 0;

        // Calculate defect rate for each top defect
        const topDefectsWithRate = topDefects.map((d) => ({
          ...d,
          DefectRate:
            output.OutputQty > 0
              ? parseFloat(((d.DefectQty / output.OutputQty) * 100).toFixed(2))
              : 0,
        }));

        return {
          LineNo: lineNo,
          OutputQty: output.OutputQty,
          Task38Qty: output.Task38Qty,
          Task39Qty: output.Task39Qty,
          TotalDefects: defects.TotalDefects,
          DefectRate: defectRate,
          MOCount: output.MONumbers.length,
          MONumbers: output.MONumbers,
          MODetails: output.MODetails,
          InspectorCount: defects.InspectorCount,
          TopDefects: topDefectsWithRate.slice(0, 3), // Top 3 only
        };
      })
      .filter((item) => item.TotalDefects > 0 || item.OutputQty > 0)
      .sort((a, b) => {
        // Sort by LineNo naturally
        return a.LineNo.localeCompare(b.LineNo, undefined, {
          numeric: true,
          sensitivity: "base",
        });
      });

    res.json(data);
  } catch (error) {
    console.error(`[SewingDefects] By Line Error:`, error.message);
    res.json([]);
  }
};

export const getDefectsByType = async (req, res) => {
  try {
    await ensureRealTimeSunriseConnected();
    const pool = getRealTimeSunrisePool();
    const todayDate = getTodayDateString();

    const query = `
  SELECT 
    r.ReworkCode,
    r.ReworkName,
    COUNT(*) AS TotalDefects,
    COUNT(DISTINCT f.WorkLine) AS LineCount,
    COUNT(DISTINCT f.MONo) AS MOCount
  FROM [YM-SUNRISE].[SunRiseGar].[dbo].[tFailHis] f
  INNER JOIN [YM-SUNRISE].[SunRiseGar].[dbo].[tReworkCode] r 
    ON f.FailCode = r.ReworkCode
  WHERE CAST(f.dDate AS DATE) = @TodayDate
    AND f.RackQCFail = 1
  GROUP BY r.ReworkCode, r.ReworkName
  ORDER BY TotalDefects DESC
`;

    const result = await pool
      .request()
      .input("TodayDate", sql.Date, todayDate)
      .query(query);

    res.json(result.recordset || []);
  } catch (error) {
    console.error(`[SewingDefects] By Type Error:`, error.message);
    res.json([]);
  }
};

// --- Get Defects by MONo with Full Details ---
export const getDefectsByMONo = async (req, res) => {
  try {
    await ensureRealTimeSunriseConnected();
    const pool = getRealTimeSunrisePool();
    const tableName = getTodayTableName();
    const todayDate = getTodayDateString();

    // Query 1: Get Output by MONo from tWork table
    const outputQuery = `
      SELECT 
        MONo,
        ISNULL(SUM(CASE WHEN SeqNo = 38 THEN Qty ELSE 0 END), 0) AS Task38Qty,
        ISNULL(SUM(CASE WHEN SeqNo = 39 THEN Qty ELSE 0 END), 0) AS Task39Qty
      FROM [YM-SUNRISE].[SunRiseGar].[dbo].[${tableName}]
      WHERE SeqNo IN (38, 39)
      GROUP BY MONo
    `;

    // Query 2: Get Defects summary by MONo
    const defectsSummaryQuery = `
      SELECT 
        f.MONo,
        COUNT(*) AS TotalDefects,
        COUNT(DISTINCT f.EmpID) AS WorkerCount,
        COUNT(DISTINCT f.EmpIDQC) AS QCCount
      FROM [YM-SUNRISE].[SunRiseGar].[dbo].[tFailHis] f
      INNER JOIN [YM-SUNRISE].[SunRiseGar].[dbo].[tReworkCode] r 
        ON f.FailCode = r.ReworkCode
      WHERE CAST(f.dDate AS DATE) = @TodayDate
        AND f.RackQCFail = 1
      GROUP BY f.MONo
    `;

    // Query 3: Get Line numbers by MONo
    const linesQuery = `
      SELECT DISTINCT
        f.MONo,
        f.WorkLine AS [LineNo]
      FROM [YM-SUNRISE].[SunRiseGar].[dbo].[tFailHis] f
      INNER JOIN [YM-SUNRISE].[SunRiseGar].[dbo].[tReworkCode] r 
        ON f.FailCode = r.ReworkCode
      WHERE CAST(f.dDate AS DATE) = @TodayDate
        AND f.RackQCFail = 1
      ORDER BY f.MONo, f.WorkLine
    `;

    // Query 4: Get Top defects by MONo with defect names
    const topDefectsQuery = `
      SELECT 
        f.MONo,
        r.ReworkCode,
        r.ReworkName,
        COUNT(*) AS DefectQty
      FROM [YM-SUNRISE].[SunRiseGar].[dbo].[tFailHis] f
      INNER JOIN [YM-SUNRISE].[SunRiseGar].[dbo].[tReworkCode] r 
        ON f.FailCode = r.ReworkCode
      WHERE CAST(f.dDate AS DATE) = @TodayDate
        AND f.RackQCFail = 1
      GROUP BY f.MONo, r.ReworkCode, r.ReworkName
      ORDER BY f.MONo, DefectQty DESC
    `;

    const [outputResult, defectsSummaryResult, linesResult, topDefectsResult] =
      await Promise.all([
        pool.request().query(outputQuery),
        pool
          .request()
          .input("TodayDate", sql.Date, todayDate)
          .query(defectsSummaryQuery),
        pool
          .request()
          .input("TodayDate", sql.Date, todayDate)
          .query(linesQuery),
        pool
          .request()
          .input("TodayDate", sql.Date, todayDate)
          .query(topDefectsQuery),
      ]);

    // Build output map
    const outputMap = {};
    outputResult.recordset.forEach((row) => {
      const moNo = String(row.MONo || "").trim();
      const task38 = parseInt(row.Task38Qty) || 0;
      const task39 = parseInt(row.Task39Qty) || 0;
      outputMap[moNo] = {
        Task38Qty: task38,
        Task39Qty: task39,
        OutputQty: Math.max(task38, task39),
      };
    });

    // Build lines map: MONo -> [LineNo1, LineNo2, ...]
    const linesMap = {};
    linesResult.recordset.forEach((row) => {
      const moNo = String(row.MONo || "").trim();
      const lineNo = String(row.LineNo || "").trim();
      if (!linesMap[moNo]) {
        linesMap[moNo] = [];
      }
      if (lineNo && !linesMap[moNo].includes(lineNo)) {
        linesMap[moNo].push(lineNo);
      }
    });

    // Sort line numbers naturally
    Object.keys(linesMap).forEach((moNo) => {
      linesMap[moNo].sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
      );
    });

    // Build top defects map: MONo -> [{ReworkCode, ReworkName, DefectQty}, ...]
    const topDefectsMap = {};
    topDefectsResult.recordset.forEach((row) => {
      const moNo = String(row.MONo || "").trim();
      if (!topDefectsMap[moNo]) {
        topDefectsMap[moNo] = [];
      }
      // Keep top 5 only
      if (topDefectsMap[moNo].length < 5) {
        topDefectsMap[moNo].push({
          ReworkCode: row.ReworkCode,
          ReworkName: row.ReworkName || `Code ${row.ReworkCode}`,
          DefectQty: parseInt(row.DefectQty) || 0,
        });
      }
    });

    // Build final data
    const data = defectsSummaryResult.recordset.map((row) => {
      const moNo = String(row.MONo || "").trim();
      const output = outputMap[moNo] || {
        Task38Qty: 0,
        Task39Qty: 0,
        OutputQty: 0,
      };
      const lines = linesMap[moNo] || [];
      const topDefects = topDefectsMap[moNo] || [];
      const totalDefects = parseInt(row.TotalDefects) || 0;

      // Calculate defect rate
      const defectRate =
        output.OutputQty > 0
          ? parseFloat(((totalDefects / output.OutputQty) * 100).toFixed(2))
          : 0;

      // Calculate individual defect rates for top defects
      const topDefectsWithRate = topDefects.map((d) => ({
        ...d,
        DefectRate:
          output.OutputQty > 0
            ? parseFloat(((d.DefectQty / output.OutputQty) * 100).toFixed(2))
            : 0,
      }));

      return {
        MONo: moNo,
        Buyer: getBuyerFromMoNumber(moNo),
        OutputQty: output.OutputQty,
        Task38Qty: output.Task38Qty,
        Task39Qty: output.Task39Qty,
        TotalDefects: totalDefects,
        DefectRate: defectRate,
        LineCount: lines.length,
        Lines: lines,
        WorkerCount: parseInt(row.WorkerCount) || 0,
        QCCount: parseInt(row.QCCount) || 0,
        TopDefects: topDefectsWithRate,
        DefectTypeCount: topDefects.length,
      };
    });

    // Sort by TotalDefects descending
    data.sort((a, b) => b.TotalDefects - a.TotalDefects);

    res.json(data);
  } catch (error) {
    console.error(`[SewingDefects] By MONo Error:`, error.message);
    res.json([]);
  }
};

// --- Get Defects by QC Inspector ---
export const getDefectsByQCInspector = async (req, res) => {
  try {
    await ensureRealTimeSunriseConnected();
    const pool = getRealTimeSunrisePool();
    const todayDate = getTodayDateString();

    const query = `
  SELECT 
    f.EmpIDQC AS EmpID,
    COUNT(*) AS TotalDefectsFound,
    COUNT(DISTINCT f.WorkLine) AS LineCount,
    COUNT(DISTINCT f.MONo) AS MOCount,
    COUNT(DISTINCT f.FailCode) AS DefectTypeCount
  FROM [YM-SUNRISE].[SunRiseGar].[dbo].[tFailHis] f
  INNER JOIN [YM-SUNRISE].[SunRiseGar].[dbo].[tReworkCode] r 
    ON f.FailCode = r.ReworkCode
  WHERE CAST(f.dDate AS DATE) = @TodayDate
    AND f.RackQCFail = 1
  GROUP BY f.EmpIDQC
  ORDER BY TotalDefectsFound DESC
`;

    const result = await pool
      .request()
      .input("TodayDate", sql.Date, todayDate)
      .query(query);

    res.json(result.recordset || []);
  } catch (error) {
    console.error(`[SewingDefects] By QC Inspector Error:`, error.message);
    res.json([]);
  }
};

// --- Get Defects by Responsible Worker (Enhanced with Photos & Details) ---
export const getDefectsByWorker = async (req, res) => {
  try {
    await ensureRealTimeSunriseConnected();
    const pool = getRealTimeSunrisePool();
    const todayDate = getTodayDateString();

    // Query 1: Get worker summary (grouped by EmpID, StationID, LineNo)
    const summaryQuery = `
      SELECT 
        f.EmpID,
        f.StationID,
        f.WorkLine AS [LineNo],
        COUNT(*) AS TotalDefects,
        COUNT(DISTINCT f.FailCode) AS DefectTypeCount,
        COUNT(DISTINCT f.MONo) AS MOCount
      FROM [YM-SUNRISE].[SunRiseGar].[dbo].[tFailHis] f
      INNER JOIN [YM-SUNRISE].[SunRiseGar].[dbo].[tReworkCode] r 
        ON f.FailCode = r.ReworkCode
      WHERE CAST(f.dDate AS DATE) = @TodayDate
        AND f.RackQCFail = 1
      GROUP BY f.EmpID, f.StationID, f.WorkLine
      ORDER BY TotalDefects DESC
    `;

    // Query 2: Get MO numbers per worker combination
    const moQuery = `
      SELECT DISTINCT
        f.EmpID,
        f.StationID,
        f.WorkLine AS [LineNo],
        f.MONo
      FROM [YM-SUNRISE].[SunRiseGar].[dbo].[tFailHis] f
      INNER JOIN [YM-SUNRISE].[SunRiseGar].[dbo].[tReworkCode] r 
        ON f.FailCode = r.ReworkCode
      WHERE CAST(f.dDate AS DATE) = @TodayDate
        AND f.RackQCFail = 1
    `;

    // Query 3: Get defects breakdown per worker with defect names
    const defectsDetailQuery = `
      SELECT 
        f.EmpID,
        f.StationID,
        f.WorkLine AS [LineNo],
        r.ReworkCode,
        r.ReworkName,
        COUNT(*) AS DefectQty
      FROM [YM-SUNRISE].[SunRiseGar].[dbo].[tFailHis] f
      INNER JOIN [YM-SUNRISE].[SunRiseGar].[dbo].[tReworkCode] r 
        ON f.FailCode = r.ReworkCode
      WHERE CAST(f.dDate AS DATE) = @TodayDate
        AND f.RackQCFail = 1
      GROUP BY f.EmpID, f.StationID, f.WorkLine, r.ReworkCode, r.ReworkName
      ORDER BY f.EmpID, f.StationID, f.WorkLine, DefectQty DESC
    `;

    const [summaryResult, moResult, defectsDetailResult] = await Promise.all([
      pool
        .request()
        .input("TodayDate", sql.Date, todayDate)
        .query(summaryQuery),
      pool.request().input("TodayDate", sql.Date, todayDate).query(moQuery),
      pool
        .request()
        .input("TodayDate", sql.Date, todayDate)
        .query(defectsDetailQuery),
    ]);

    // Build MO map: "EmpID-StationID-LineNo" -> [MONo1, MONo2, ...]
    const moMap = {};
    moResult.recordset.forEach((row) => {
      const key = `${row.EmpID}-${row.StationID}-${row.LineNo}`;
      if (!moMap[key]) {
        moMap[key] = [];
      }
      if (row.MONo && !moMap[key].includes(row.MONo)) {
        moMap[key].push(row.MONo);
      }
    });

    // Build defects map: "EmpID-StationID-LineNo" -> [{ReworkCode, ReworkName, DefectQty}, ...]
    const defectsMap = {};
    defectsDetailResult.recordset.forEach((row) => {
      const key = `${row.EmpID}-${row.StationID}-${row.LineNo}`;
      if (!defectsMap[key]) {
        defectsMap[key] = [];
      }
      defectsMap[key].push({
        ReworkCode: row.ReworkCode,
        ReworkName: row.ReworkName || `Code ${row.ReworkCode}`,
        DefectQty: parseInt(row.DefectQty) || 0,
      });
    });

    // Get unique emp IDs for MongoDB lookup
    const empIds = [...new Set(summaryResult.recordset.map((r) => r.EmpID))];

    // Fetch user photos and names from MongoDB
    let userMap = {};
    try {
      const users = await UserMain.find(
        { emp_id: { $in: empIds } },
        { emp_id: 1, face_photo: 1, eng_name: 1, kh_name: 1, profile: 1 },
      ).lean();

      users.forEach((u) => {
        userMap[u.emp_id] = {
          facePhoto: u.face_photo || u.profile || null,
          engName: u.eng_name || null,
          khName: u.kh_name || null,
        };
      });
    } catch (mongoErr) {
      console.error("[MongoDB] Error fetching user photos:", mongoErr.message);
      // Continue without photos if MongoDB fails
    }

    // Build final response data
    const data = summaryResult.recordset.map((row, index) => {
      const key = `${row.EmpID}-${row.StationID}-${row.LineNo}`;
      const userData = userMap[row.EmpID] || {};
      const moList = moMap[key] || [];
      const defectsList = defectsMap[key] || [];

      // Sort defects by quantity descending
      defectsList.sort((a, b) => b.DefectQty - a.DefectQty);

      return {
        Rank: index + 1,
        EmpID: row.EmpID,
        EmpName: userData.engName || null,
        KhName: userData.khName || null,
        FacePhoto: userData.facePhoto || null,
        LineNo: row.LineNo,
        StationID: row.StationID,
        TotalDefects: parseInt(row.TotalDefects) || 0,
        DefectTypeCount: parseInt(row.DefectTypeCount) || 0,
        MOCount: parseInt(row.MOCount) || 0,
        MONumbers: moList,
        Defects: defectsList,
      };
    });

    res.json(data);
  } catch (error) {
    console.error(`[SewingDefects] By Worker Error:`, error.message);
    res.json([]);
  }
};

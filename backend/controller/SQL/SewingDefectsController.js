import sql from "mssql";
import {
  getRealTimeSunrisePool,
  ensureRealTimeSunriseConnected,
} from "./RealTimeSunriseConnectionManager.js";

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

// --- Get Defects by Line ---
// --- Get Defects by Line with Output Data ---
export const getDefectsByLine = async (req, res) => {
  try {
    await ensureRealTimeSunriseConnected();
    const pool = getRealTimeSunrisePool();
    const tableName = getTodayTableName();
    const todayDate = getTodayDateString();

    // Query 1: Get Output by Line from tWork table
    const outputQuery = `
      SELECT 
        WorkLine AS [LineNo],
        ISNULL(SUM(CASE WHEN SeqNo = 38 THEN Qty ELSE 0 END), 0) AS Task38Qty,
        ISNULL(SUM(CASE WHEN SeqNo = 39 THEN Qty ELSE 0 END), 0) AS Task39Qty
      FROM [YM-SUNRISE].[SunRiseGar].[dbo].[${tableName}]
      WHERE SeqNo IN (38, 39)
      GROUP BY WorkLine
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

    const [outputResult, defectsResult] = await Promise.all([
      pool.request().query(outputQuery),
      pool
        .request()
        .input("TodayDate", sql.Date, todayDate)
        .query(defectsQuery),
    ]);

    // Build output map
    const outputMap = {};
    outputResult.recordset.forEach((row) => {
      const lineNo = String(row.LineNo || "").trim();
      const task38 = parseInt(row.Task38Qty) || 0;
      const task39 = parseInt(row.Task39Qty) || 0;
      outputMap[lineNo] = {
        Task38Qty: task38,
        Task39Qty: task39,
        OutputQty: Math.max(task38, task39),
      };
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
        };
        const defects = defectsMap[lineNo] || {
          TotalDefects: 0,
          MOCount: 0,
          InspectorCount: 0,
        };

        const defectRate =
          output.OutputQty > 0
            ? parseFloat(
                ((defects.TotalDefects / output.OutputQty) * 100).toFixed(2),
              )
            : 0;

        return {
          LineNo: lineNo,
          OutputQty: output.OutputQty,
          Task38Qty: output.Task38Qty,
          Task39Qty: output.Task39Qty,
          TotalDefects: defects.TotalDefects,
          DefectRate: defectRate,
          MOCount: defects.MOCount,
          InspectorCount: defects.InspectorCount,
        };
      })
      .filter((item) => item.TotalDefects > 0 || item.OutputQty > 0)
      .sort((a, b) => b.DefectRate - a.DefectRate); // Sort by defect rate descending

    res.json(data);
  } catch (error) {
    console.error(`[SewingDefects] By Line Error:`, error.message);
    res.json([]);
  }
};

// export const getDefectsByLine = async (req, res) => {
//   try {
//     await ensureRealTimeSunriseConnected();
//     const pool = getRealTimeSunrisePool();
//     const todayDate = getTodayDateString();

//     const query = `
//   SELECT
//     f.WorkLine AS [LineNo],
//     COUNT(*) AS TotalDefects,
//     COUNT(DISTINCT f.MONo) AS MOCount,
//     COUNT(DISTINCT f.EmpIDQC) AS InspectorCount
//   FROM [YM-SUNRISE].[SunRiseGar].[dbo].[tFailHis] f
//   INNER JOIN [YM-SUNRISE].[SunRiseGar].[dbo].[tReworkCode] r
//     ON f.FailCode = r.ReworkCode
//   WHERE CAST(f.dDate AS DATE) = @TodayDate
//     AND f.RackQCFail = 1
//   GROUP BY f.WorkLine
//   ORDER BY TotalDefects DESC
// `;

//     const result = await pool
//       .request()
//       .input("TodayDate", sql.Date, todayDate)
//       .query(query);

//     res.json(result.recordset || []);
//   } catch (error) {
//     console.error(`[SewingDefects] By Line Error:`, error.message);
//     res.json([]);
//   }
// };

// --- Get Defects by Rework Code (Defect Type) ---
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

// --- Get Defects by MO Number ---
export const getDefectsByMONo = async (req, res) => {
  try {
    await ensureRealTimeSunriseConnected();
    const pool = getRealTimeSunrisePool();
    const todayDate = getTodayDateString();
    const query = `
  SELECT 
    f.MONo,
    COUNT(*) AS TotalDefects,
    COUNT(DISTINCT f.WorkLine) AS LineCount,
    COUNT(DISTINCT f.FailCode) AS DefectTypeCount,
    COUNT(DISTINCT f.EmpID) AS WorkerCount
  FROM [YM-SUNRISE].[SunRiseGar].[dbo].[tFailHis] f
  INNER JOIN [YM-SUNRISE].[SunRiseGar].[dbo].[tReworkCode] r 
    ON f.FailCode = r.ReworkCode
  WHERE CAST(f.dDate AS DATE) = @TodayDate
    AND f.RackQCFail = 1
  GROUP BY f.MONo
  ORDER BY TotalDefects DESC
`;

    const result = await pool
      .request()
      .input("TodayDate", sql.Date, todayDate)
      .query(query);

    const data = result.recordset.map((row) => ({
      ...row,
      Buyer: getBuyerFromMoNumber(row.MONo),
    }));

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

// --- Get Defects by Responsible Worker ---
export const getDefectsByWorker = async (req, res) => {
  try {
    await ensureRealTimeSunriseConnected();
    const pool = getRealTimeSunrisePool();
    const todayDate = getTodayDateString();

    const query = `
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

    const result = await pool
      .request()
      .input("TodayDate", sql.Date, todayDate)
      .query(query);

    res.json(result.recordset || []);
  } catch (error) {
    console.error(`[SewingDefects] By Worker Error:`, error.message);
    res.json([]);
  }
};

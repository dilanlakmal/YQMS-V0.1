import sql from "mssql";
import {
  getRealTimeSunrisePool,
  ensureRealTimeSunriseConnected,
} from "./RealTimeSunriseConnectionManager.js";
import { UserMain } from "../MongoDB/dbConnectionController.js";

// Helper: Get dynamic table name (Adjusted for Cambodia Time GMT+7)
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

// --- Get Header Cards Data (Updated with Total Output) ---
// --- Get Header Cards Data (Updated with Total Output, SAM, and Inspectors) ---
export const getWIPSummaryStats = async (req, res) => {
  try {
    await ensureRealTimeSunriseConnected();
    const pool = getRealTimeSunrisePool();
    const tableName = getTodayTableName();

    const query = `
      SELECT 
        ISNULL(SUM(CASE WHEN SeqNo = 38 THEN Qty ELSE 0 END), 0) AS Task38Qty,
        ISNULL(SUM(CASE WHEN SeqNo = 39 THEN Qty ELSE 0 END), 0) AS Task39Qty,
        COUNT(DISTINCT MONo) AS TotalStyles,
        ISNULL(SUM(CASE WHEN SeqNo = 38 THEN SAM ELSE 0 END), 0) AS Task38SAM,
        ISNULL(SUM(CASE WHEN SeqNo = 39 THEN SAM ELSE 0 END), 0) AS Task39SAM,
        ISNULL(SUM(CASE WHEN SeqNo IN (38, 39) THEN SAM ELSE 0 END), 0) AS TotalSAM,
        COUNT(DISTINCT CASE WHEN SeqNo = 38 THEN EmpID END) AS Task38Inspectors,
        COUNT(DISTINCT CASE WHEN SeqNo = 39 THEN EmpID END) AS Task39Inspectors,
        COUNT(DISTINCT CASE WHEN SeqNo IN (38, 39) THEN EmpID END) AS TotalInspectors
      FROM [YM-SUNRISE].[SunRiseGar].[dbo].[${tableName}]
    `;

    const result = await pool.request().query(query);
    const row = result.recordset[0] || {};

    const data = {
      Task38Qty: parseInt(row.Task38Qty) || 0,
      Task39Qty: parseInt(row.Task39Qty) || 0,
      TotalStyles: parseInt(row.TotalStyles) || 0,
      TotalOutput: Math.max(
        parseInt(row.Task38Qty) || 0,
        parseInt(row.Task39Qty) || 0,
      ),
      Task38SAM: parseFloat(row.Task38SAM) || 0,
      Task39SAM: parseFloat(row.Task39SAM) || 0,
      TotalSAM: parseFloat(row.TotalSAM) || 0,
      Task38Inspectors: parseInt(row.Task38Inspectors) || 0,
      Task39Inspectors: parseInt(row.Task39Inspectors) || 0,
      TotalInspectors: parseInt(row.TotalInspectors) || 0,
    };

    res.json(data);
  } catch (error) {
    console.error(`[RealTimeSunrise] Stats Error:`, error.message);
    if (error.message.includes("Invalid object name")) {
      return res.json({
        Task38Qty: 0,
        Task39Qty: 0,
        TotalStyles: 0,
        TotalOutput: 0,
        Task38SAM: 0,
        Task39SAM: 0,
        TotalSAM: 0,
        Task38Inspectors: 0,
        Task39Inspectors: 0,
        TotalInspectors: 0,
      });
    }
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};

// export const getWIPSummaryStats = async (req, res) => {
//   try {
//     await ensureRealTimeSunriseConnected();
//     const pool = getRealTimeSunrisePool();
//     const tableName = getTodayTableName();

//     const query = `
//       SELECT
//         ISNULL(SUM(CASE WHEN SeqNo = 38 THEN Qty ELSE 0 END), 0) AS Task38Qty,
//         ISNULL(SUM(CASE WHEN SeqNo = 39 THEN Qty ELSE 0 END), 0) AS Task39Qty,
//         COUNT(DISTINCT MONo) AS TotalStyles
//       FROM [YM-SUNRISE].[SunRiseGar].[dbo].[${tableName}]
//     `;

//     const result = await pool.request().query(query);
//     const data = result.recordset[0] || {
//       Task38Qty: 0,
//       Task39Qty: 0,
//       TotalStyles: 0,
//     };

//     // Calculate Total Output (max of Task38 and Task39)
//     data.TotalOutput = Math.max(data.Task38Qty, data.Task39Qty);

//     res.json(data);
//   } catch (error) {
//     console.error(`[RealTimeSunrise] Stats Error:`, error.message);
//     if (error.message.includes("Invalid object name")) {
//       return res.json({
//         Task38Qty: 0,
//         Task39Qty: 0,
//         TotalStyles: 0,
//         TotalOutput: 0,
//       });
//     }
//     res.status(500).json({ error: "Failed to fetch stats" });
//   }
// };

// --- Get Chart Data with MONo breakdown for Tooltip ---

// --- Get Chart Data with MONo breakdown and Buyer info ---
export const getWIPLineChartData = async (req, res) => {
  const { taskNo } = req.query;

  if (taskNo !== "38" && taskNo !== "39") {
    return res.status(400).json({ error: "Invalid Task Number" });
  }

  try {
    await ensureRealTimeSunriseConnected();
    const pool = getRealTimeSunrisePool();
    const tableName = getTodayTableName();

    // Get totals by WorkLine
    const totalQuery = `
      SELECT 
        WorkLine AS [LineNo], 
        ISNULL(SUM(Qty), 0) AS TotalQty
      FROM [YM-SUNRISE].[SunRiseGar].[dbo].[${tableName}]
      WHERE SeqNo = @TaskNo 
      GROUP BY WorkLine
      ORDER BY WorkLine
    `;

    // Get breakdown by WorkLine and MONo
    const detailQuery = `
      SELECT 
        WorkLine AS [LineNo],
        MONo,
        ISNULL(SUM(Qty), 0) AS Qty
      FROM [YM-SUNRISE].[SunRiseGar].[dbo].[${tableName}]
      WHERE SeqNo = @TaskNo 
      GROUP BY WorkLine, MONo
      ORDER BY WorkLine, MONo
    `;

    const [totalResult, detailResult] = await Promise.all([
      pool
        .request()
        .input("TaskNo", sql.Int, parseInt(taskNo))
        .query(totalQuery),
      pool
        .request()
        .input("TaskNo", sql.Int, parseInt(taskNo))
        .query(detailQuery),
    ]);

    // Build line data with MONo details and determine buyer
    const lineDetails = {};
    const lineBuyers = {};

    detailResult.recordset.forEach((row) => {
      if (!lineDetails[row.LineNo]) {
        lineDetails[row.LineNo] = [];
        lineBuyers[row.LineNo] = new Set();
      }
      const buyer = getBuyerFromMoNumber(row.MONo);
      lineDetails[row.LineNo].push({
        MONo: row.MONo,
        Qty: row.Qty,
        Buyer: buyer,
      });
      lineBuyers[row.LineNo].add(buyer);
    });

    const chartData = totalResult.recordset.map((row) => {
      const buyers = lineBuyers[row.LineNo]
        ? Array.from(lineBuyers[row.LineNo])
        : [];
      const buyer =
        buyers.length === 1 ? buyers[0] : buyers.length > 1 ? "Mixed" : "Other";

      return {
        LineNo: row.LineNo,
        TotalQty: row.TotalQty,
        Buyer: buyer,
        BuyerCount: buyers.length,
        MODetails: lineDetails[row.LineNo] || [],
      };
    });

    res.json(chartData);
  } catch (error) {
    console.error(`[RealTimeSunrise] Chart Error:`, error.message);
    if (error.message.includes("Invalid object name")) {
      return res.json([]);
    }
    res.json([]);
  }
};

// --- Get Output by MONo with Color/Size Breakdown ---
// --- Get Output by MONo with Color/Size Breakdown ---
export const getOutputByMONo = async (req, res) => {
  try {
    await ensureRealTimeSunriseConnected();
    const pool = getRealTimeSunrisePool();
    const tableName = getTodayTableName();

    // Get summary by MONo - Direct sum from database
    const summaryQuery = `
      SELECT 
        MONo,
        ISNULL(SUM(CASE WHEN SeqNo = 38 THEN Qty ELSE 0 END), 0) AS Task38Qty,
        ISNULL(SUM(CASE WHEN SeqNo = 39 THEN Qty ELSE 0 END), 0) AS Task39Qty
      FROM [YM-SUNRISE].[SunRiseGar].[dbo].[${tableName}]
      WHERE SeqNo IN (38, 39)
      GROUP BY MONo
      ORDER BY MONo
    `;

    // Get color/size breakdown - Group by MONo, ColorName, SizeName, SeqNo
    const detailQuery = `
      SELECT 
        MONo,
        ISNULL(ColorName, 'Unknown') AS ColorName,
        ISNULL(SizeName, 'Unknown') AS SizeName,
        SeqNo,
        ISNULL(SUM(Qty), 0) AS Qty
      FROM [YM-SUNRISE].[SunRiseGar].[dbo].[${tableName}]
      WHERE SeqNo IN (38, 39)
      GROUP BY MONo, ColorName, SizeName, SeqNo
      ORDER BY MONo, ColorName, SizeName, SeqNo
    `;

    const [summaryResult, detailResult] = await Promise.all([
      pool.request().query(summaryQuery),
      pool.request().query(detailQuery),
    ]);

    // Build color/size breakdown map
    // Structure: MONo -> { colors: { colorName: { sizes: { sizeName: { T38, T39 } } } }, allSizes: Set }
    const detailsMap = {};

    detailResult.recordset.forEach((row) => {
      const moNo = String(row.MONo || "").trim();
      const colorName = String(row.ColorName || "Unknown").trim();
      const sizeName = String(row.SizeName || "Unknown").trim();
      const seqNo = parseInt(row.SeqNo);
      const qty = parseInt(row.Qty) || 0;

      if (!moNo) return;

      if (!detailsMap[moNo]) {
        detailsMap[moNo] = {
          colors: {},
          allSizes: new Set(),
        };
      }

      if (!detailsMap[moNo].colors[colorName]) {
        detailsMap[moNo].colors[colorName] = {
          colorName: colorName,
          sizes: {},
          totalT38: 0,
          totalT39: 0,
        };
      }

      if (!detailsMap[moNo].colors[colorName].sizes[sizeName]) {
        detailsMap[moNo].colors[colorName].sizes[sizeName] = {
          sizeName: sizeName,
          Task38Qty: 0,
          Task39Qty: 0,
        };
      }

      // Add size to allSizes set for this MO
      detailsMap[moNo].allSizes.add(sizeName);

      // Update quantities based on SeqNo
      if (seqNo === 38) {
        detailsMap[moNo].colors[colorName].sizes[sizeName].Task38Qty += qty;
        detailsMap[moNo].colors[colorName].totalT38 += qty;
      } else if (seqNo === 39) {
        detailsMap[moNo].colors[colorName].sizes[sizeName].Task39Qty += qty;
        detailsMap[moNo].colors[colorName].totalT39 += qty;
      }
    });

    // Build final response using summary data (accurate totals from DB)
    const data = summaryResult.recordset.map((row) => {
      const moNo = String(row.MONo || "").trim();
      const task38Qty = parseInt(row.Task38Qty) || 0;
      const task39Qty = parseInt(row.Task39Qty) || 0;
      const buyer = getBuyerFromMoNumber(moNo);
      const moDetails = detailsMap[moNo] || { colors: {}, allSizes: new Set() };

      // Convert colors object to array
      const colorsArray = Object.values(moDetails.colors).map((color) => ({
        colorName: color.colorName,
        totalT38: color.totalT38,
        totalT39: color.totalT39,
        totalQty: Math.max(color.totalT38, color.totalT39),
        sizes: Object.values(color.sizes).sort((a, b) => {
          // Sort sizes - try numeric first, then alphabetical
          const aNum = parseFloat(a.sizeName);
          const bNum = parseFloat(b.sizeName);
          if (!isNaN(aNum) && !isNaN(bNum)) {
            return aNum - bNum;
          }
          // Size order: XS, S, M, L, XL, XXL, etc.
          const sizeOrder = [
            "XXS",
            "XS",
            "S",
            "M",
            "L",
            "XL",
            "XXL",
            "XXXL",
            "2XL",
            "3XL",
            "4XL",
          ];
          const aIndex = sizeOrder.indexOf(a.sizeName.toUpperCase());
          const bIndex = sizeOrder.indexOf(b.sizeName.toUpperCase());
          if (aIndex !== -1 && bIndex !== -1) {
            return aIndex - bIndex;
          }
          if (aIndex !== -1) return -1;
          if (bIndex !== -1) return 1;
          return a.sizeName.localeCompare(b.sizeName);
        }),
      }));

      // Sort colors by total quantity descending
      colorsArray.sort((a, b) => b.totalQty - a.totalQty);

      // Get all unique sizes for this MO (sorted)
      const allSizesArray = Array.from(moDetails.allSizes).sort((a, b) => {
        const aNum = parseFloat(a);
        const bNum = parseFloat(b);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        const sizeOrder = [
          "XXS",
          "XS",
          "S",
          "M",
          "L",
          "XL",
          "XXL",
          "XXXL",
          "2XL",
          "3XL",
          "4XL",
        ];
        const aIndex = sizeOrder.indexOf(a.toUpperCase());
        const bIndex = sizeOrder.indexOf(b.toUpperCase());
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        }
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return a.localeCompare(b);
      });

      // Use the summary totals directly from database (accurate)
      return {
        MONo: moNo,
        Buyer: buyer,
        Task38Qty: task38Qty,
        Task39Qty: task39Qty,
        TotalQty: Math.max(task38Qty, task39Qty), // Max of T38 and T39 from summary
        Colors: colorsArray,
        AllSizes: allSizesArray,
        ColorCount: colorsArray.length,
      };
    });

    // Sort by TotalQty descending
    data.sort((a, b) => b.TotalQty - a.TotalQty);

    res.json(data);
  } catch (error) {
    console.error(`[RealTimeSunrise] Output by MONo Error:`, error.message);
    if (error.message.includes("Invalid object name")) {
      return res.json([]);
    }
    res.status(500).json({ error: "Failed to fetch output by MONo" });
  }
};

// --- Get Output by Buyer ---
export const getOutputByBuyer = async (req, res) => {
  try {
    await ensureRealTimeSunriseConnected();
    const pool = getRealTimeSunrisePool();
    const tableName = getTodayTableName();

    const query = `
      SELECT 
        MONo,
        ISNULL(SUM(CASE WHEN SeqNo = 38 THEN Qty ELSE 0 END), 0) AS Task38Qty,
        ISNULL(SUM(CASE WHEN SeqNo = 39 THEN Qty ELSE 0 END), 0) AS Task39Qty
      FROM [YM-SUNRISE].[SunRiseGar].[dbo].[${tableName}]
      WHERE SeqNo IN (38, 39)
      GROUP BY MONo
    `;

    const result = await pool.request().query(query);

    // Group by Buyer
    const buyerData = {};
    result.recordset.forEach((row) => {
      const buyer = getBuyerFromMoNumber(row.MONo);
      if (!buyerData[buyer]) {
        buyerData[buyer] = {
          Buyer: buyer,
          Task38Qty: 0,
          Task39Qty: 0,
          MOCount: 0,
        };
      }
      buyerData[buyer].Task38Qty += row.Task38Qty;
      buyerData[buyer].Task39Qty += row.Task39Qty;
      buyerData[buyer].MOCount += 1;
    });

    const data = Object.values(buyerData).map((b) => ({
      ...b,
      TotalQty: Math.max(b.Task38Qty, b.Task39Qty),
    }));

    // Sort by TotalQty descending
    data.sort((a, b) => b.TotalQty - a.TotalQty);

    res.json(data);
  } catch (error) {
    console.error(`[RealTimeSunrise] Output by Buyer Error:`, error.message);
    if (error.message.includes("Invalid object name")) {
      return res.json([]);
    }
    res.status(500).json({ error: "Failed to fetch output by buyer" });
  }
};

// --- Get Output by Inspector ---
export const getOutputByInspector = async (req, res) => {
  const { taskNo } = req.query;

  const validTasks = ["38", "39", "all"];
  if (!validTasks.includes(taskNo)) {
    return res.status(400).json({ error: "Invalid Task Number" });
  }

  try {
    await ensureRealTimeSunriseConnected();
    const pool = getRealTimeSunrisePool();
    const tableName = getTodayTableName();

    let whereClause = "WHERE SeqNo IN (38, 39)";
    if (taskNo === "38") {
      whereClause = "WHERE SeqNo = 38";
    } else if (taskNo === "39") {
      whereClause = "WHERE SeqNo = 39";
    }

    // Get summary by inspector
    const summaryQuery = `
      SELECT 
        EmpID,
        EmpName,
        ISNULL(SUM(CASE WHEN SeqNo = 38 THEN Qty ELSE 0 END), 0) AS Task38Qty,
        ISNULL(SUM(CASE WHEN SeqNo = 39 THEN Qty ELSE 0 END), 0) AS Task39Qty,
        ISNULL(SUM(Qty), 0) AS TotalQty
      FROM [YM-SUNRISE].[SunRiseGar].[dbo].[${tableName}]
      ${whereClause}
      GROUP BY EmpID, EmpName
      ORDER BY TotalQty DESC
    `;

    // Get details by inspector, line, MONo, SeqNo
    const detailQuery = `
      SELECT 
        EmpID,
        WorkLine AS [LineNo],
        MONo,
        SeqNo,
        ISNULL(SUM(Qty), 0) AS Qty
      FROM [YM-SUNRISE].[SunRiseGar].[dbo].[${tableName}]
      ${whereClause}
      GROUP BY EmpID, WorkLine, MONo, SeqNo
      ORDER BY EmpID, WorkLine, MONo, SeqNo
    `;

    const [summaryResult, detailResult] = await Promise.all([
      pool.request().query(summaryQuery),
      pool.request().query(detailQuery),
    ]);

    // Build details map: EmpID -> LineNo -> MODetails[]
    const detailsMap = {};
    detailResult.recordset.forEach((row) => {
      if (!detailsMap[row.EmpID]) {
        detailsMap[row.EmpID] = {};
      }
      if (!detailsMap[row.EmpID][row.LineNo]) {
        detailsMap[row.EmpID][row.LineNo] = [];
      }

      const buyer = getBuyerFromMoNumber(row.MONo);
      detailsMap[row.EmpID][row.LineNo].push({
        MONo: row.MONo,
        SeqNo: row.SeqNo,
        Qty: row.Qty,
        Buyer: buyer,
      });
    });

    // Get unique emp IDs for MongoDB lookup
    const empIds = summaryResult.recordset.map((r) => r.EmpID);

    // Fetch user photos from MongoDB
    let userMap = {};
    try {
      const users = await UserMain.find(
        // ✅ Correct - use directly
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

    // Build final response
    const data = summaryResult.recordset.map((row, index) => {
      const lineDetails = detailsMap[row.EmpID] || {};

      // Build lines array with MO details
      const lines = Object.entries(lineDetails).map(([lineNo, moDetails]) => {
        // Group MO details and calculate totals
        const moMap = {};
        moDetails.forEach((mo) => {
          if (!moMap[mo.MONo]) {
            moMap[mo.MONo] = {
              MONo: mo.MONo,
              Buyer: mo.Buyer,
              Task38Qty: 0,
              Task39Qty: 0,
              TotalQty: 0,
            };
          }
          if (mo.SeqNo === 38) {
            moMap[mo.MONo].Task38Qty += mo.Qty;
          } else if (mo.SeqNo === 39) {
            moMap[mo.MONo].Task39Qty += mo.Qty;
          }
          moMap[mo.MONo].TotalQty += mo.Qty;
        });

        const moList = Object.values(moMap).sort(
          (a, b) => b.TotalQty - a.TotalQty,
        );
        const lineBuyers = [...new Set(moList.map((m) => m.Buyer))];
        const lineTotal = moList.reduce((sum, m) => sum + m.TotalQty, 0);

        return {
          LineNo: lineNo,
          TotalQty: lineTotal,
          Buyers: lineBuyers,
          MODetails: moList,
        };
      });

      // Sort lines by total qty
      lines.sort((a, b) => b.TotalQty - a.TotalQty);

      const userData = userMap[row.EmpID] || {};
      const allBuyers = [...new Set(lines.flatMap((l) => l.Buyers))];

      return {
        Rank: index + 1,
        EmpID: row.EmpID,
        EmpName: row.EmpName,
        FacePhoto: userData.facePhoto,
        EngName: userData.engName,
        KhName: userData.khName,
        Task38Qty: row.Task38Qty,
        Task39Qty: row.Task39Qty,
        TotalQty: row.TotalQty,
        Lines: lines,
        LineCount: lines.length,
        AllBuyers: allBuyers,
      };
    });

    res.json(data);
  } catch (error) {
    console.error(
      `[RealTimeSunrise] Output by Inspector Error:`,
      error.message,
    );
    if (error.message.includes("Invalid object name")) {
      return res.json([]);
    }
    res.status(500).json({ error: "Failed to fetch output by inspector" });
  }
};

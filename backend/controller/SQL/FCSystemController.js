import sql from "mssql";
import { getFCPool, ensureFCConnected } from "./fcConnectionManager.js";

/* ------------------------------
   Marker Ratio API
------------------------------ */

export const getMarkerRatioData = async (req, res) => {
  try {
    await ensureFCConnected();
  } catch (connErr) {
    return res.status(503).json({
      success: false,
      message: "Service Unavailable: FC System database is not connected.",
      error: connErr.message,
    });
  }

  try {
    const { search } = req.query;
    if (!search || search.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Search parameter is required (TxnNo or Style)",
      });
    }

    const pool = getFCPool();
    const searchParam = `%${search.trim()}%`;

    // 1. Main marker ratio data
    const sqlReq1 = pool.request();
    sqlReq1.input("search", sql.NVarChar, searchParam);
    const markerResult = await sqlReq1.query(`
      SELECT [TxnNo], [OrderCode], [Dept], [Shipment], [Style], [ColorNo],
             [ChnColor], [EngColor], [FabricColor], [Fabric_Type], [Fabric_Type2],
             [Material], [Pattern], [Actual_Width], [Edit_Width], [Spread_Speed],
             [Relax_SetTime], [RatioNo], [Category],
             [Ratio1], [Ratio2], [Ratio3], [Ratio4], [Ratio5],
             [Ratio6], [Ratio7], [Ratio8], [Ratio9], [Ratio10],
             [TotalQty], [TotalLayer], [Spread_PlanLayer], [SpreadLayer],
             [MarkerKgs], [MarkerLength], [AddUsage], [AddLength],
             [RatioCode], [Remarks]
      FROM [FC_SYSTEM].[dbo].[ViewMarkerRatio]
      WHERE [Style] LIKE @search OR [TxnNo] LIKE @search
      ORDER BY [Dept], [Shipment], [Style], [EngColor], [Fabric_Type], [Fabric_Type2], [Material]
    `);

    if (markerResult.recordset.length === 0) {
      return res.json({
        success: true,
        groups: [],
        totalGroups: 0,
        message: "No data found for the given search term.",
      });
    }

    // 2. Sizes + header info from ViewMarkerRatio_Inv
    const sqlReq2 = pool.request();
    sqlReq2.input("search", sql.NVarChar, searchParam);
    const invResult = await sqlReq2.query(`
      SELECT [TxnNo], [Create_Date], [PreparedBy], [Dept], [Buyer], [BuyerStyle],
             [Style], [Size1], [Size2], [Size3], [Size4], [Size5],
             [Size6], [Size7], [Size8], [Size9], [Size10]
      FROM [FC_SYSTEM].[dbo].[ViewMarkerRatio_Inv]
      WHERE [Style] IN (
        SELECT DISTINCT [Style]
        FROM [FC_SYSTEM].[dbo].[ViewMarkerRatio]
        WHERE [Style] LIKE @search OR [TxnNo] LIKE @search
      )
    `);

    // 3. Total Qty summary
    const sqlReq3 = pool.request();
    sqlReq3.input("search", sql.NVarChar, searchParam);
    const totalResult = await sqlReq3.query(`
      SELECT [TxnNo], [OrderCode], [TotalQty], [TotalUse]
      FROM [FC_SYSTEM].[dbo].[ViewMarkerRatio_TotalQty]
      WHERE [TxnNo] IN (
        SELECT DISTINCT [TxnNo]
        FROM [FC_SYSTEM].[dbo].[ViewMarkerRatio]
        WHERE [Style] LIKE @search OR [TxnNo] LIKE @search
      )
    `);

    // ---- Build Maps ----

    // Size map per Style
    const sizeMap = new Map();
    const invInfoMap = new Map();

    invResult.recordset.forEach((row) => {
      if (!sizeMap.has(row.Style)) {
        const sizes = [];
        for (let i = 1; i <= 10; i++) {
          const name = row[`Size${i}`];
          if (name && name.toString().trim() !== "") {
            sizes.push({ index: i, name: name.toString().trim() });
          }
        }
        if (sizes.length > 0) {
          sizeMap.set(row.Style, sizes);
        }
      }

      if (!invInfoMap.has(row.TxnNo)) {
        invInfoMap.set(row.TxnNo, {
          createDate: row.Create_Date,
          preparedBy: row.PreparedBy,
          buyer: row.Buyer,
          buyerStyle: row.BuyerStyle,
        });
      }
    });

    // Total map per TxnNo
    const totalMap = new Map();
    totalResult.recordset.forEach((row) => {
      totalMap.set(row.TxnNo, {
        TotalQty: row.TotalQty,
        TotalUse: row.TotalUse,
      });
    });

    // ---- Group by Dept + Shipment + Style + EngColor + FT1 + FT2 + Material ----

    const groupMap = new Map();

    markerResult.recordset.forEach((row) => {
      const cat = row.Category ? row.Category.toString().trim() : "";
      if (cat === "===" || cat === "") return;

      const dept = row.Dept || "";
      const shipment = row.Shipment || "";
      const style = row.Style || "";
      const engColor = row.EngColor || "";
      const ft1 = row.Fabric_Type || "";
      const ft2 =
        row.Fabric_Type2 != null
          ? row.Fabric_Type2.toString().trim()
          : "__NULL__";
      const material = row.Material || "";

      const key = `${dept}||${shipment}||${style}||${engColor}||${ft1}||${ft2}||${material}`;

      if (!groupMap.has(key)) {
        const sizes = sizeMap.get(style) || [];
        const finalSizes =
          sizes.length > 0
            ? sizes
            : Array.from({ length: 10 }, (_, i) => ({
                index: i + 1,
                name: `Size ${i + 1}`,
              }));

        const invInfo = invInfoMap.get(row.TxnNo) || {};

        groupMap.set(key, {
          headerInfo: {
            style: style,
            engColor: engColor,
            chnColor: row.ChnColor || "",
            colorNo: row.ColorNo || "",
            fabricType1: ft1,
            fabricType2: ft2 === "__NULL__" ? null : ft2,
            dept: dept,
            shipment: shipment,
            material: material,
            txnNo: row.TxnNo,
            orderCode: row.OrderCode || "",
            fabricColor: row.FabricColor || "",
            createDate: invInfo.createDate || null,
            preparedBy: invInfo.preparedBy || null,
            buyer: invInfo.buyer || null,
            buyerStyle: invInfo.buyerStyle || null,
          },
          sizeNames: finalSizes.map((s) => s.name),
          sizeIndices: finalSizes.map((s) => s.index),
          totalInfo: totalMap.get(row.TxnNo) || null,
          rows: [],
        });
      }

      const group = groupMap.get(key);
      group.rows.push({
        dept: row.Dept,
        shipment: row.Shipment,
        colorNo: row.ColorNo,
        chnColor: row.ChnColor,
        engColor: row.EngColor,
        fabricType1: row.Fabric_Type,
        fabricType2: row.Fabric_Type2,
        material: row.Material,
        pattern: row.Pattern,
        actualWidth: row.Actual_Width,
        editWidth: row.Edit_Width,
        ratioNo: row.RatioNo,
        category: cat,
        sizeValues: group.sizeIndices.map((idx) => row[`Ratio${idx}`] ?? null),
        totalQty: row.TotalQty,
        totalLayer: row.TotalLayer,
        spreadPlanLayer: row.Spread_PlanLayer,
        spreadLayer: row.SpreadLayer,
        markerKgs: row.MarkerKgs,
        markerLength: row.MarkerLength,
        addUsage: row.AddUsage,
        addLength: row.AddLength,
        ratioCode: row.RatioCode,
        remarks: row.Remarks,
      });
    });

    // ---- Category sort order ----
    const getCatOrder = (cat) => {
      if (!cat) return 999;
      const c = cat.toString().toLowerCase().trim();
      if (c.includes("orderqty")) return 0;
      if (c.includes("plancut") || c.includes("+3.5") || c.includes("plan"))
        return 1;
      const n = parseInt(cat);
      if (!isNaN(n) && n > 0) return 100 + n;
      if (c.includes("totalqty")) return 900;
      if (c.includes("diffqty")) return 901;
      return 500;
    };

    // ---- Process groups ----
    let groups = Array.from(groupMap.values()).map((group) => {
      // Sort rows: category order first, then RatioNo ASC
      group.rows.sort((a, b) => {
        const catDiff = getCatOrder(a.category) - getCatOrder(b.category);
        if (catDiff !== 0) return catDiff;
        return (Number(a.ratioNo) || 0) - (Number(b.ratioNo) || 0);
      });

      // Find active size positions (have data)
      const activePositions = group.sizeIndices
        .map((_, i) => i)
        .filter((i) =>
          group.rows.some(
            (row) =>
              row.sizeValues[i] !== null &&
              row.sizeValues[i] !== undefined &&
              row.sizeValues[i] !== 0,
          ),
        );

      group.sizeNames = activePositions.map((pos) => group.sizeNames[pos]);
      group.rows = group.rows.map((row) => ({
        ...row,
        sizeValues: activePositions.map((pos) => row.sizeValues[pos]),
      }));

      delete group.sizeIndices;
      return group;
    });

    // Sort groups: FT1=A first, then Style, EngColor, Dept, Shipment, Material
    groups.sort((a, b) => {
      const hA = a.headerInfo;
      const hB = b.headerInfo;

      // Fabric Type A first
      const ftA = (hA.fabricType1 || "").toUpperCase();
      const ftB = (hB.fabricType1 || "").toUpperCase();
      if (ftA === "A" && ftB !== "A") return -1;
      if (ftA !== "A" && ftB === "A") return 1;
      if (ftA !== ftB) return ftA.localeCompare(ftB);

      // Then by Style
      const styleCmp = (hA.style || "").localeCompare(hB.style || "");
      if (styleCmp !== 0) return styleCmp;

      // Then by EngColor
      const colorCmp = (hA.engColor || "").localeCompare(hB.engColor || "");
      if (colorCmp !== 0) return colorCmp;

      // Then by Dept
      const deptCmp = (hA.dept || "").localeCompare(hB.dept || "");
      if (deptCmp !== 0) return deptCmp;

      // Then by Shipment
      const shipCmp = (hA.shipment || "").localeCompare(hB.shipment || "");
      if (shipCmp !== 0) return shipCmp;

      // Then by FT2
      const ft2A = hA.fabricType2 || "";
      const ft2B = hB.fabricType2 || "";
      if (ft2A !== ft2B) return ft2A.localeCompare(ft2B);

      // Then by Material
      return (hA.material || "").localeCompare(hB.material || "");
    });

    res.json({
      success: true,
      groups,
      totalGroups: groups.length,
    });
  } catch (err) {
    console.error("Error fetching marker ratio data:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch marker ratio data",
      error: err.message,
    });
  }
};

/* ------------------------------
   Shrinkage Test API
------------------------------ */

// 1. Get Summary List based on filters
export const getShrinkageSearchList = async (req, res) => {
  try {
    await ensureFCConnected();
    const pool = getFCPool();
    const { startDate, endDate, txnNo, mpoNo, supplier, engColor } = req.query;

    let query = `
      SELECT [TxnNo], [Create_Date], [PreparedBy], [MPOCode], [MPONo], 
             [Supplier], [Fabric_Type], [EngColor], [Lot], [RollNo]
      FROM [FC_SYSTEM].[dbo].[ViewShrinkage_Test]
      WHERE 1=1
    `;

    const request = pool.request();

    // Date Filter (Required)
    if (startDate && endDate) {
      query += ` AND [Create_Date] BETWEEN @startDate AND @endDate`;
      request.input("startDate", sql.DateTime, new Date(startDate));
      request.input("endDate", sql.DateTime, new Date(endDate));
    }

    // Optional Filters
    if (txnNo) {
      query += ` AND [TxnNo] LIKE @txnNo`;
      request.input("txnNo", sql.NVarChar, `%${txnNo}%`);
    }
    if (mpoNo) {
      query += ` AND [MPONo] LIKE @mpoNo`;
      request.input("mpoNo", sql.NVarChar, `%${mpoNo}%`);
    }
    if (supplier) {
      query += ` AND [Supplier] LIKE @supplier`;
      request.input("supplier", sql.NVarChar, `%${supplier}%`);
    }
    if (engColor) {
      query += ` AND [EngColor] LIKE @engColor`;
      request.input("engColor", sql.NVarChar, `%${engColor}%`);
    }

    // Order by latest
    query += ` ORDER BY [Create_Date] DESC, [TxnNo] DESC`;

    const result = await request.query(query);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (err) {
    console.error("Error fetching shrinkage search list:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Get Distinct Values for Dropdowns
export const getShrinkageFieldValues = async (req, res) => {
  try {
    await ensureFCConnected();
    const pool = getFCPool();
    const { field, startDate, endDate, search } = req.query;

    // Whitelist allowed fields to prevent injection
    const allowedFields = ["MPONo", "Supplier", "EngColor"];
    if (!allowedFields.includes(field)) {
      return res.status(400).json({ success: false, message: "Invalid field" });
    }

    let query = `
      SELECT DISTINCT TOP (20) [${field}] as value
      FROM [FC_SYSTEM].[dbo].[ViewShrinkage_Test]
      WHERE [Create_Date] BETWEEN @startDate AND @endDate
    `;

    const request = pool.request();
    request.input("startDate", sql.DateTime, new Date(startDate));
    request.input("endDate", sql.DateTime, new Date(endDate));

    if (search) {
      query += ` AND [${field}] LIKE @search`;
      request.input("search", sql.NVarChar, `%${search}%`);
    }

    query += ` ORDER BY [${field}]`;

    const result = await request.query(query);
    res.json({ success: true, data: result.recordset.map((r) => r.value) });
  } catch (err) {
    console.error("Error fetching dropdown values:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getShrinkageTestData = async (req, res) => {
  try {
    await ensureFCConnected();
  } catch (connErr) {
    return res.status(503).json({
      success: false,
      message: "Service Unavailable: FC System database is not connected.",
      error: connErr.message,
    });
  }

  try {
    const { search } = req.query;
    if (!search || search.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Search parameter is required (TxnNo)",
      });
    }

    const pool = getFCPool();
    const searchParam = `%${search.trim()}%`;

    // Fetch data
    const request = pool.request();
    request.input("search", sql.NVarChar, searchParam);

    const result = await request.query(`
      SELECT [PreparedBy], [TxnNo], [Create_Date], [Container], [Buyer],
             [MPOCode], [MPONo], [Supplier], [Invoice], [Rk],
             [Fabric_Type], [Material], [Description], [Width], [Weight],
             [ColorNo], [ChnColor], [EngColor], [TotalRoll], [TotalQty],
             [Lot], [RollNo], [Unit], [AS], [BS],
             [WWA], [WWB], [WLA], [WLB], [WTACA], [WTBDA], [WTACB], [WTBDB],
             [SWA], [SWB], [SLA], [SLB], [STACA], [STBDA], [STACB], [STBDB],
             [Barcode], [Remarks]
      FROM [FC_SYSTEM].[dbo].[ViewShrinkage_Test]
      WHERE [TxnNo] LIKE @search
      ORDER BY [TxnNo], [EngColor], [Rk]
    `);

    if (result.recordset.length === 0) {
      return res.json({
        success: true,
        reports: [],
        message: "No data found.",
      });
    }

    // Group by TxnNo (In case multiple reports match the partial search)
    const reportMap = new Map();

    result.recordset.forEach((row) => {
      const txn = row.TxnNo;

      if (!reportMap.has(txn)) {
        reportMap.set(txn, {
          header: {
            txnNo: row.TxnNo,
            buyer: row.Buyer,
            container: row.Container,
            preparedBy: row.PreparedBy,
            mpoNo: row.MPONo,
            supplier: row.Supplier,
            invoice: row.Invoice,
            createDate: row.Create_Date,
            remarks: row.Remarks, // Top level remarks if needed, though usually per row
          },
          rows: [],
        });
      }

      const report = reportMap.get(txn);

      // Push the detailed row
      report.rows.push({
        id: row.Rk,
        fabricType: row.Fabric_Type,
        engColor: row.EngColor,
        lot: row.Lot,
        totalRoll: row.TotalRoll,
        totalQty: row.TotalQty,
        unit: row.Unit,
        rollNo: row.RollNo,
        bs: row.BS, // Base Size (e.g. 50CM)

        // Washing Test Data
        wash: {
          width: { a: row.WWA, b: row.WWB },
          length: { a: row.WLA, b: row.WLB },
          twist: {
            acA: row.WTACA,
            bdA: row.WTBDA,
            acB: row.WTACB,
            bdB: row.WTBDB,
          },
        },

        // Steam/Acid Test Data
        steam: {
          width: { a: row.SWA, b: row.SWB },
          length: { a: row.SLA, b: row.SLB },
          twist: {
            acA: row.STACA,
            bdA: row.STBDA,
            acB: row.STACB,
            bdB: row.STBDB,
          },
        },

        description: row.Description, // often contains composition
        widthInfo: row.Width,
        weightInfo: row.Weight,
        remarks: row.Remarks,
      });
    });

    res.json({
      success: true,
      reports: Array.from(reportMap.values()),
    });
  } catch (err) {
    console.error("Error fetching shrinkage test data:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch shrinkage test data",
      error: err.message,
    });
  }
};

/* ------------------------------
   Density Test API
------------------------------ */

// 1. Get Summary List based on filters
export const getDensitySearchList = async (req, res) => {
  try {
    await ensureFCConnected();
    const pool = getFCPool();
    const {
      startDate,
      endDate,
      txnNo,
      buyer,
      mpoNo,
      supplier,
      type,
      engColor,
    } = req.query;

    let query = `
      SELECT [Id], [TxnNo], [Create_Date], [Update_Date], [Buyer], [MPOCode], 
             [MPONo], [Supplier], [Material], [Description], [EngColor], 
             [Lot], [RollNo], [Type], [PreparedBy]
      FROM [FC_SYSTEM].[dbo].[ViewDensity_Test]
      WHERE 1=1
    `;

    const request = pool.request();

    // Date Filter (Required) - Filtering by Create_Date (Inspection Date)
    if (startDate && endDate) {
      query += ` AND [Create_Date] BETWEEN @startDate AND @endDate`;
      request.input("startDate", sql.DateTime, new Date(startDate));
      request.input("endDate", sql.DateTime, new Date(endDate));
    }

    // Optional Filters
    if (txnNo) {
      query += ` AND [TxnNo] LIKE @txnNo`;
      request.input("txnNo", sql.NVarChar, `%${txnNo}%`);
    }
    if (buyer) {
      query += ` AND [Buyer] LIKE @buyer`;
      request.input("buyer", sql.NVarChar, `%${buyer}%`);
    }
    if (mpoNo) {
      query += ` AND [MPONo] LIKE @mpoNo`;
      request.input("mpoNo", sql.NVarChar, `%${mpoNo}%`);
    }
    if (supplier) {
      query += ` AND [Supplier] LIKE @supplier`;
      request.input("supplier", sql.NVarChar, `%${supplier}%`);
    }
    if (type) {
      query += ` AND [Type] LIKE @type`;
      request.input("type", sql.NVarChar, `%${type}%`);
    }
    if (engColor) {
      query += ` AND [EngColor] LIKE @engColor`;
      request.input("engColor", sql.NVarChar, `%${engColor}%`);
    }

    // Order by latest
    query += ` ORDER BY [Create_Date] DESC, [TxnNo] DESC`;

    const result = await request.query(query);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (err) {
    console.error("Error fetching density search list:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Get Distinct Values for Dropdowns
export const getDensityFieldValues = async (req, res) => {
  try {
    await ensureFCConnected();
    const pool = getFCPool();
    const { field, startDate, endDate, search } = req.query;

    // Whitelist allowed fields
    const allowedFields = ["Buyer", "MPONo", "Supplier", "Type", "EngColor"];
    if (!allowedFields.includes(field)) {
      return res.status(400).json({ success: false, message: "Invalid field" });
    }

    let query = `
      SELECT DISTINCT TOP (20) [${field}] as value
      FROM [FC_SYSTEM].[dbo].[ViewDensity_Test]
      WHERE [Create_Date] BETWEEN @startDate AND @endDate
    `;

    const request = pool.request();
    request.input("startDate", sql.DateTime, new Date(startDate));
    request.input("endDate", sql.DateTime, new Date(endDate));

    if (search) {
      query += ` AND [${field}] LIKE @search`;
      request.input("search", sql.NVarChar, `%${search}%`);
    }

    query += ` ORDER BY [${field}]`;

    const result = await request.query(query);
    res.json({ success: true, data: result.recordset.map((r) => r.value) });
  } catch (err) {
    console.error("Error fetching dropdown values:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 3. Get Detailed Density Test Data by TxnNo

export const getDensityTestData = async (req, res) => {
  try {
    await ensureFCConnected();
  } catch (connErr) {
    return res.status(503).json({
      success: false,
      message: "Service Unavailable: FC System database is not connected.",
      error: connErr.message,
    });
  }

  try {
    const { search } = req.query;
    if (!search || search.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Search parameter is required (TxnNo)",
      });
    }

    const pool = getFCPool();
    const searchParam = `%${search.trim()}%`;

    const request = pool.request();
    request.input("search", sql.NVarChar, searchParam);

    const result = await request.query(`
      SELECT [Id], [Update_Date], [PreparedBy], [CheckBy], [ReceivedBy],
             [Create_Date], [TxnNo], [Buyer], [Container], [MPOCode],
             [MPONo], [Supplier], [Invoice], [Material], [Description],
             [Type], [ColorNo], [ChnColor], [EngColor], [Lot],
             [RollNo], [OrderWidth], [ActualWidth], [OrderWeight],
             [ActualWeight], [LeftGM2], [CenterGM2], [RightGM2],
             [Barcode], [Remarks], [TotalRoll], [TotalQty], [Unit], [Fabric_Type]
      FROM [FC_SYSTEM].[dbo].[ViewDensity_Test]
      WHERE [TxnNo] LIKE @search
      ORDER BY [TxnNo], [Id]
    `);

    if (result.recordset.length === 0) {
      return res.json({
        success: true,
        reports: [],
        message: "No data found.",
      });
    }

    // Helper to calculate Grams per Linear Yard (G/Y)
    // Formula: G/M² * (Width_Inches * 0.0254) * 0.9144
    const calculateGY = (gm2, widthInch) => {
      const g = parseFloat(gm2);
      const w = parseFloat(widthInch);
      if (isNaN(g) || isNaN(w)) return 0;
      return (g * (w * 0.0254) * 0.9144).toFixed(1);
    };

    const reports = result.recordset.map((row) => ({
      id: row.Id,
      txnNo: row.TxnNo,
      date: row.Create_Date,
      type: row.Type,
      buyer: row.Buyer,
      mpoNo: row.MPONo,
      container: row.Container,
      supplier: row.Supplier,
      invoice: row.Invoice,
      lot: row.Lot,
      rollNo: row.RollNo,
      engColor: row.EngColor,
      description: row.Description,
      preparedBy: row.PreparedBy,
      checkBy: row.CheckBy,
      receivedBy: row.ReceivedBy,

      // Measurements
      orderWidth: row.OrderWidth,
      actualWidth: row.ActualWidth,
      orderGM2: row.OrderWeight, // OrderG/M2
      actualGM2: row.ActualWeight, // AvgG/M2

      // Calculated Fields
      orderGY: calculateGY(row.OrderWeight, row.OrderWidth),
      actualGY: calculateGY(row.ActualWeight, row.ActualWidth),

      // Positions
      leftGM2: row.LeftGM2,
      centerGM2: row.CenterGM2,
      rightGM2: row.RightGM2,
    }));

    res.json({
      success: true,
      reports,
    });
  } catch (err) {
    console.error("Error fetching density test data:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch density test data",
      error: err.message,
    });
  }
};

/* ------------------------------
   Seperation Color List API
------------------------------ */

export const getSeperationColorListData = async (req, res) => {
  try {
    await ensureFCConnected();
  } catch (connErr) {
    return res.status(503).json({
      success: false,
      message: "Service Unavailable: FC System database is not connected.",
      error: connErr.message,
    });
  }

  try {
    const { search } = req.query;
    if (!search || search.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Search parameter is required (TxnNo)",
      });
    }

    const pool = getFCPool();
    const searchParam = `%${search.trim()}%`;

    const request = pool.request();
    request.input("search", sql.NVarChar, searchParam);

    // Note: PreparedBy is not in the provided SQL column list, so it is omitted here.
    const result = await request.query(`
      SELECT [Create_Date], [TxnNo], [Code], [Tone_Code], [MPOCode], [MPONo],
             [Style], [Material], [Description], [ColorNo], [ChnColor], [EngColor],
             [Body_Lot], [Body_Qty], [Body_CST], [Unit], [Tone],
             [Rib_Lot], [Rib_Qty], [Rib_CST], [Rib_DiffQty], [Remarks]
      FROM [FC_SYSTEM].[dbo].[ViewSeperation_ColorList]
      WHERE [TxnNo] LIKE @search
      ORDER BY [TxnNo], [Tone_Code]
    `);

    if (result.recordset.length === 0) {
      return res.json({
        success: true,
        reports: [],
        message: "No data found.",
      });
    }

    // Group by TxnNo
    const reportMap = new Map();

    result.recordset.forEach((row) => {
      const txn = row.TxnNo;

      if (!reportMap.has(txn)) {
        reportMap.set(txn, {
          header: {
            txnNo: row.TxnNo,
            createDate: row.Create_Date,
            // Header remarks are often distinct from row remarks,
            // but if the view is flat, we might not have a specific header remark.
            // We'll leave it generic or grab the first row's if appropriate,
            // but usually grid remarks are specific to the lot.
          },
          rows: [],
        });
      }

      const report = reportMap.get(txn);

      report.rows.push({
        tone: row.Tone,
        mpoCode: row.MPOCode,
        mpoNo: row.MPONo,
        style: row.Style,
        material: row.Material,
        engColor: row.EngColor,
        bodyLot: row.Body_Lot,
        bodyQty: row.Body_Qty,
        bodyCst: row.Body_CST,
        unit: row.Unit,
        ribLot: row.Rib_Lot,
        ribQty: row.Rib_Qty,
        ribCst: row.Rib_CST,
        ribDiffQty: row.Rib_DiffQty,
        remarks: row.Remarks,
      });
    });

    res.json({
      success: true,
      reports: Array.from(reportMap.values()),
    });
  } catch (err) {
    console.error("Error fetching seperation color list:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch data",
      error: err.message,
    });
  }
};

/* ------------------------------
   Crocking Test API
------------------------------ */

export const getCrockingTestData = async (req, res) => {
  try {
    await ensureFCConnected();
  } catch (connErr) {
    return res.status(503).json({
      success: false,
      message: "Service Unavailable: FC System database is not connected.",
      error: connErr.message,
    });
  }

  try {
    const { search } = req.query;
    if (!search || search.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Search parameter is required (TxnNo)",
      });
    }

    const pool = getFCPool();
    const searchParam = `%${search.trim()}%`; // Precise match preferred for TxnNo, but keeping LIKE for consistency

    // 1. Fetch Header Info
    const requestHeader = pool.request();
    requestHeader.input("search", sql.NVarChar, searchParam);
    const headerResult = await requestHeader.query(`
      SELECT TOP (1) [Id], [Update_Date], [PreparedBy], [CheckBy], [ReceivedBy],
             [Create_Date], [TxnNo], [MPOCode], [MPONo], [Supplier],
             [Description], [EngColor], [GRNTxnNo], [Container],
             [Invoice], [BuyerStyle]
      FROM [FC_SYSTEM].[dbo].[ViewCrocking_Test_Inv]
      WHERE [TxnNo] LIKE @search
    `);

    if (headerResult.recordset.length === 0) {
      return res.json({
        success: true,
        reports: [],
        message: "No data found.",
      });
    }

    const header = headerResult.recordset[0];

    // 2. Fetch Detail Rows
    const requestRows = pool.request();
    requestRows.input("txnNo", sql.NVarChar, header.TxnNo);
    const rowsResult = await requestRows.query(`
      SELECT [TxnNo], [Lot], [RollNo],
             [D_Requirment], [D_Grade], [D_Result],
             [W_Requirment], [W_Grade], [W_Result],
             [Barcode], [Remarks]
      FROM [FC_SYSTEM].[dbo].[ViewCrocking_Test]
      WHERE [TxnNo] = @txnNo
      ORDER BY [Lot], [RollNo]
    `);

    // Construct the Report Object
    const report = {
      header: {
        txnNo: header.TxnNo,
        createDate: header.Create_Date,
        buyerStyle: header.BuyerStyle,
        mpoNo: header.MPONo,
        engColor: header.EngColor,
        description: header.Description,
        container: header.Container,
        supplier: header.Supplier,
        invoice: header.Invoice,
        preparedBy: header.PreparedBy,
        checkBy: header.CheckBy,
        receivedBy: header.ReceivedBy,
        // Note: 'Buyer' column wasn't in the provided SQL,
        // we might infer it or leave blank if not available in ViewCrocking_Test_Inv
      },
      rows: rowsResult.recordset.map((row) => ({
        lot: row.Lot,
        rollNo: row.RollNo,
        dry: {
          req: row.D_Requirment,
          grade: row.D_Grade,
          result: row.D_Result,
        },
        wet: {
          req: row.W_Requirment,
          grade: row.W_Grade,
          result: row.W_Result,
        },
        barcode: row.Barcode,
        remarks: row.Remarks,
      })),
    };

    res.json({
      success: true,
      reports: [report], // Returning array to maintain frontend consistency
    });
  } catch (err) {
    console.error("Error fetching crocking test data:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch data",
      error: err.message,
    });
  }
};

/* ------------------------------
   Supplier Evaluation API
------------------------------ */

export const getSupplierEvaluationData = async (req, res) => {
  try {
    await ensureFCConnected();
  } catch (connErr) {
    return res.status(503).json({
      success: false,
      message: "Service Unavailable: FC System database is not connected.",
      error: connErr.message,
    });
  }

  try {
    const { search } = req.query;
    if (!search || search.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Search parameter is required (TxnNo)",
      });
    }

    const pool = getFCPool();
    const searchParam = `%${search.trim()}%`;

    // 1. Fetch Header Info (Inv)
    const requestHeader = pool.request();
    requestHeader.input("search", sql.NVarChar, searchParam);
    const headerResult = await requestHeader.query(`
      SELECT TOP (1) [Id], [Update_Date], [PreparedBy], [Create_Date], 
             [TxnNo], [TMonth], [Remarks]
      FROM [FC_SYSTEM].[dbo].[tbSupplier_Evaluation_Inv]
      WHERE [TxnNo] LIKE @search
    `);

    if (headerResult.recordset.length === 0) {
      return res.json({
        success: true,
        report: null,
        message: "No data found.",
      });
    }

    const header = headerResult.recordset[0];

    // 2. Fetch Detail Rows with Supplier Name
    // We LEFT JOIN tbSupplier to get the Name based on the Supplier Code
    const requestRows = pool.request();
    requestRows.input("txnNo", sql.NVarChar, header.TxnNo);
    const rowsResult = await requestRows.query(`
      SELECT E.[TxnNo], E.[TMonth], E.[Supplier], S.[SupplierName], E.[Buyer],
             E.[TotalInsYds], E.[TotalTP100sq], E.[TP100sq_Per],
             E.[DP], E.[NT], E.[LW], E.[OverGrade], E.[Ins_Per], E.[Remarks]
      FROM [FC_SYSTEM].[dbo].[tbSupplier_Evaluation] E
      LEFT JOIN [FC_SYSTEM].[dbo].[tbSupplier] S ON E.[Supplier] = S.[Supplier]
      WHERE E.[TxnNo] = @txnNo
    `);

    // 3. Fetch Grading Criteria
    const requestGrades = pool.request();
    const gradeResult = await requestGrades.query(`
      SELECT [Id], [F_DefPoint], [T_DefPoint], [Grade], [Color], [Comment]
      FROM [FC_SYSTEM].[dbo].[tbSupplier_Evaluation_Grade]
      ORDER BY [Id] ASC
    `);

    // Construct Response
    const report = {
      header: {
        txnNo: header.TxnNo,
        storeDate: header.Update_Date,
        preparedBy: header.PreparedBy,
        remarks: header.Remarks,
        createDate: header.Create_Date,
      },
      rows: rowsResult.recordset.map((row) => ({
        month: row.TMonth,
        buyer: row.Buyer,
        supplierCode: row.Supplier,
        supplierName: row.SupplierName, // Added Supplier Name
        totalInsYds: row.TotalInsYds,
        totalTP100sq: row.TotalTP100sq,
        tp100sqPer: row.TP100sq_Per,
        dp: row.DP,
        nt: row.NT,
        lw: row.LW,
        overGrade: row.OverGrade,
        insPer: row.Ins_Per,
        remarks: row.Remarks,
      })),
      grades: gradeResult.recordset.map((g) => ({
        range: `${g.F_DefPoint} - ${g.T_DefPoint} Point`,
        grade: g.Grade,
        color: g.Color,
        comment: g.Comment,
      })),
    };

    res.json({
      success: true,
      report,
    });
  } catch (err) {
    console.error("Error fetching supplier evaluation data:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch data",
      error: err.message,
    });
  }
};

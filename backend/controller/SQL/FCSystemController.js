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

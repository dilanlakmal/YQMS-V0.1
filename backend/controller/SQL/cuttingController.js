import cron from "node-cron";
import {
  poolFCSystem,
  sqlConnectionStatus,
  ensurePoolConnected,
} from "./sqlConnectionManager.js";
import { CutPanelOrders } from "../MongoDB/dbConnectionController.js";

/* --------------------------------------------------------
   Cut Panel Orders Sync with GATEKEEPER to prevent deadlocks
-------------------------------------------------------- */

let isCutPanelSyncRunning = false;

export async function syncCutPanelOrders() {
  if (isCutPanelSyncRunning) {
    console.log(
      "[CutPanelOrders] Sync is already in progress. Skipping this run.",
    );
    return;
  }

  try {
    isCutPanelSyncRunning = true;
    console.log("[CutPanelOrders] Starting sync at", new Date().toISOString());

    if (!sqlConnectionStatus.FCSystem) {
      console.warn(
        "[CutPanelOrders] Skipping sync: FCSystem database is not connected.",
      );
      return;
    }

    let records = [];
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await ensurePoolConnected(poolFCSystem, "FCSystem");
        const request = poolFCSystem.request();

        // Paste the CutPanel query from original syncCutPanelOrders (DECLARE @StartDate ... WITH LotData AS ... )
        const query = `
      DECLARE @StartDate DATE = CAST(DATEADD(DAY, -7, GETDATE()) AS DATE);
      -- The rest of your optimized SQL query...
      WITH
      LotData AS (
          SELECT v.Style, v.TableNo, STUFF((SELECT DISTINCT ', ' + v_inner.Lot FROM [FC_SYSTEM].[dbo].[ViewSpreading_ForQC] AS v_inner WHERE v_inner.Style = v.Style AND v_inner.TableNo = v.TableNo AND v_inner.Lot IS NOT NULL AND v_inner.Lot <> '' FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 2, '') AS LotNos
          FROM [FC_SYSTEM].[dbo].[ViewSpreading_ForQC] AS v INNER JOIN [FC_SYSTEM].[dbo].[ViewSpreading_Inv] AS inv_filter ON v.TxnNo = inv_filter.TxnNo
          WHERE v.Lot IS NOT NULL AND v.Lot <> '' AND inv_filter.Create_Date >= @StartDate
          GROUP BY v.Style, v.TableNo
      ),
      OrderData AS (
          SELECT Style, EngColor, Size1, Size2, Size3, Size4, Size5, Size6, Size7, Size8, Size9, Size10,
              OrderQty1, OrderQty2, OrderQty3, OrderQty4, OrderQty5, OrderQty6, OrderQty7, OrderQty8, OrderQty9, OrderQty10,
              TotalOrderQty, SUM(TotalOrderQty) OVER (PARTITION BY Style) AS TotalOrderQtyStyle
          FROM (
              SELECT o.Style, o.EngColor, MAX(o.Size1) AS Size1, MAX(o.Size2) AS Size2, MAX(o.Size3) AS Size3, MAX(o.Size4) AS Size4, MAX(o.Size5) AS Size5, MAX(o.Size6) AS Size6, MAX(o.Size7) AS Size7, MAX(o.Size8) AS Size8, MAX(o.Size9) AS Size9, MAX(o.Size10) AS Size10,
                  SUM(ISNULL(o.Qty1, 0)) AS OrderQty1, SUM(ISNULL(o.Qty2, 0)) AS OrderQty2, SUM(ISNULL(o.Qty3, 0)) AS OrderQty3, SUM(ISNULL(o.Qty4, 0)) AS OrderQty4, SUM(ISNULL(o.Qty5, 0)) AS OrderQty5, SUM(ISNULL(o.Qty6, 0)) AS OrderQty6, SUM(ISNULL(o.Qty7, 0)) AS OrderQty7, SUM(ISNULL(o.Qty8, 0)) AS OrderQty8, SUM(ISNULL(o.Qty9, 0)) AS OrderQty9, SUM(ISNULL(o.Qty10, 0)) AS OrderQty10,
                  SUM(ISNULL(o.Total, 0)) AS TotalOrderQty
              FROM [FC_SYSTEM].[dbo].[ViewOrderQty] AS o
              WHERE EXISTS (SELECT 1 FROM [FC_SYSTEM].[dbo].[ViewSpreading_Inv] vi WHERE vi.Style = o.Style AND vi.EngColor = o.EngColor AND vi.Create_Date >= @StartDate)
              GROUP BY o.Style, o.EngColor
          ) AS OrderColorAggregates
      )
      SELECT
          v.Style AS StyleNo, v.Create_Date AS TxnDate, v.TxnNo, CASE WHEN v.Buyer = 'ABC' THEN 'ANF' ELSE v.Buyer END AS Buyer, v.BuyerStyle,
          v.EngColor AS Color, v.ChnColor, v.ColorNo AS ColorCode, v.Fabric_Type AS FabricType, v.Material,
          CASE WHEN PATINDEX('%[_ ]%', v.PreparedBy) > 0 THEN LTRIM(SUBSTRING(v.PreparedBy, PATINDEX('%[_ ]%', v.PreparedBy) + 1, LEN(v.PreparedBy))) ELSE v.PreparedBy END AS SpreadTable,
          v.TableNo, v.RollQty, ROUND(v.SpreadYds, 3) AS SpreadYds, v.Unit, ROUND(v.GrossKgs, 3) AS GrossKgs, ROUND(v.NetKgs, 3) AS NetKgs,
          v.PlanLayer, v.ActualLayer, CAST(ISNULL(v.PlanLayer, 0) * (ISNULL(v.Ratio1, 0) + ISNULL(v.Ratio2, 0) + ISNULL(v.Ratio3, 0) + ISNULL(v.Ratio4, 0) + ISNULL(v.Ratio5, 0) + ISNULL(v.Ratio6, 0) + ISNULL(v.Ratio7, 0) + ISNULL(v.Ratio8, 0) + ISNULL(v.Ratio9, 0) + ISNULL(v.Ratio10, 0)) AS INT) AS TotalPcs,
          v.Pattern AS MackerNo, ROUND(v.MarkerLength, 3) AS MackerLength, ld.LotNos, od.OrderQty1, od.OrderQty2, od.OrderQty3, od.OrderQty4, od.OrderQty5,
          od.OrderQty6, od.OrderQty7, od.OrderQty8, od.OrderQty9, od.OrderQty10, od.TotalOrderQty, od.TotalOrderQtyStyle, v.Ratio1 AS CuttingRatio1,
          v.Ratio2 AS CuttingRatio2, v.Ratio3 AS CuttingRatio3, v.Ratio4 AS CuttingRatio4, v.Ratio5 AS CuttingRatio5, v.Ratio6 AS CuttingRatio6,
          v.Ratio7 AS CuttingRatio7, v.Ratio8 AS CuttingRatio8, v.Ratio9 AS CuttingRatio9, v.Ratio10 AS CuttingRatio10, v.Size1, v.Size2, v.Size3,
          v.Size4, v.Size5, v.Size6, v.Size7, v.Size8, v.Size9, v.Size10,
          NULL AS TotalTTLRoll, NULL AS TotalTTLQty, NULL AS TotalBiddingQty, NULL AS TotalBiddingRollQty,
          NULL AS SendFactory, NULL AS SendTxnDate, NULL AS SendTxnNo, NULL AS SendTotalQty
      FROM [FC_SYSTEM].[dbo].[ViewSpreading_Inv] AS v
      LEFT JOIN LotData AS ld ON v.Style = ld.Style AND v.TableNo = ld.TableNo
      LEFT JOIN OrderData AS od ON v.Style = od.Style AND v.EngColor = od.EngColor
      WHERE v.TableNo IS NOT NULL AND v.TableNo <> '' AND v.Create_Date >= @StartDate  AND v.Fabric_Type = 'A'
      ORDER BY v.Create_Date DESC;
    `;

        const result = await request.query(query);
        records = result.recordset;
        break;
      } catch (err) {
        if (err.number === 1205 && attempt < maxRetries) {
          const delay = Math.random() * 1000 + 1500;
          console.warn(
            `[CutPanelOrders] Deadlock detected. Retrying in ${delay.toFixed(
              0,
            )}ms (attempt ${attempt}/${maxRetries})`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          throw err;
        }
      }
    }

    if (records.length > 0) {
      console.log(
        `[CutPanelOrders] Fetched ${records.length} records from SQL Server.`,
      );
      const bulkOps = records.map((row) => ({
        updateOne: {
          filter: { TxnNo: row.TxnNo },
          update: {
            $set: {
              StyleNo: row.StyleNo,
              TxnDate: row.TxnDate ? new Date(row.TxnDate) : null,
              TxnNo: row.TxnNo,
              Buyer: row.Buyer,
              Color: row.Color,
              SpreadTable: row.SpreadTable,
              TableNo: row.TableNo,
              BuyerStyle: row.BuyerStyle,
              ChColor: row.ChColor,
              ColorCode: row.ColorCode,
              FabricType: row.FabricType,
              Material: row.Material,
              RollQty: row.RollQty,
              SpreadYds: row.SpreadYds,
              Unit: row.Unit,
              GrossKgs: row.GrossKgs,
              NetKgs: row.NetKgs,
              MackerNo: row.MackerNo,
              MackerLength: row.MackerLength,
              SendFactory: row.SendFactory,
              SendTxnDate: row.SendTxnDate ? new Date(row.SendTxnDate) : null,
              SendTxnNo: row.SendTxnNo,
              SendTotalQty: row.SendTotalQty,
              PlanLayer: row.PlanLayer,
              ActualLayer: row.ActualLayer,
              TotalPcs: row.TotalPcs,
              LotNos: row.LotNos
                ? row.LotNos.split(",").map((lot) => lot.trim())
                : [],
              TotalOrderQty: row.TotalOrderQty,
              TotalTTLRoll: row.TotalTTLRoll,
              TotalTTLQty: row.TotalTTLQty,
              TotalBiddingQty: row.TotalBiddingQty,
              TotalBiddingRollQty: row.TotalBiddingRollQty,
              TotalOrderQtyStyle: row.TotalOrderQtyStyle,
              MarkerRatio: Array.from({ length: 10 }, (_, k) => ({
                no: k + 1,
                size: row[`Size${k + 1}`],
                cuttingRatio: row[`CuttingRatio${k + 1}`],
                orderQty: row[`OrderQty${k + 1}`],
              })),
            },
          },
          upsert: true,
        },
      }));
      await CutPanelOrders.bulkWrite(bulkOps);
      console.log(
        `[CutPanelOrders] Successfully synced ${bulkOps.length} documents.`,
      );
    } else {
      console.log(
        "[CutPanelOrders] No new documents to sync in the last 3 days.",
      );
    }
  } catch (err) {
    console.error("Error during cutpanelorders sync:", err);
  } finally {
    isCutPanelSyncRunning = false;
  }
}

// Schedule the syncCutPanelOrders function to run every 30 minutes
cron.schedule("*/30 * * * *", syncCutPanelOrders);
console.log("Scheduled cutpanelorders sync with deadlock protection.");

// api/sync-cutpanel-orders
export const cutpanelOrdersSync = async (req, res) => {
  syncCutPanelOrders();
  res.status(202).json({
    message:
      "Cut panel orders sync initiated successfully. Check logs for progress.",
  });
};

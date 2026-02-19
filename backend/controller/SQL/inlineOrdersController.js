import cron from "node-cron";
import {
  poolYMCE,
  sqlConnectionStatus,
  ensurePoolConnected,
} from "./sqlConnectionManager.js";
import { InlineOrders } from "../MongoDB/dbConnectionController.js";

/* ------------------------------
   Drop Conflicting MongoDB Index
------------------------------ */

export async function dropConflictingIndex() {
  try {
    const indexes = await InlineOrders.collection.getIndexes();
    if (indexes["St_No_1"]) {
      await InlineOrders.collection.dropIndex("St_No_1");
      console.log("Dropped conflicting St_No_1 index.");
    } else {
      console.log("St_No_1 index not found, no need to drop.");
    }
  } catch (err) {
    console.error("Error dropping St_No_1 index:", err);
  }
}

/* ------------------------------
   Sync Inline Orders from YMCE_SYSTEM
------------------------------ */

export async function syncInlineOrders() {
  if (!sqlConnectionStatus.YMCE_SYSTEM) {
    console.warn(
      "Skipping syncInlineOrders: YMCE_SYSTEM database is not connected.",
    );
    return;
  }
  try {
    console.log("Starting inline_orders sync at", new Date().toISOString());
    await ensurePoolConnected(poolYMCE, "YMCE_SYSTEM");

    const request = poolYMCE.request();

    console.log(
      "Using connection to:",
      poolYMCE.config.server,
      "database:",
      poolYMCE.config.database,
    );

    // Paste the syncInlineOrders query from original (SELECT St_No, By_Style, Tg_No, ... WHERE Dept_Type = 'Sewing')
    const query = `
      SELECT
        St_No,
        By_Style,
        Tg_No,
        Tg_Code,
        Ma_Code,
        ch_name,
        kh_name,
        Dept_Type
      FROM
        dbo.ViewTg vt
      WHERE
        Dept_Type = 'Sewing';
    `;

    const result = await request.query(query);
    const data = result.recordset;

    if (data.length === 0) {
      console.log("No data to sync to inline_orders.");
      return;
    }

    // Group data by St_No, By_Style, and Dept_Type
    const groupedData = data.reduce((acc, row) => {
      const key = `${row.St_No}_${row.By_Style}_${row.Dept_Type}`;
      if (!acc[key]) {
        acc[key] = {
          St_No: row.St_No,
          By_Style: row.By_Style,
          Dept_Type: row.Dept_Type,
          orderData: [],
        };
      }
      acc[key].orderData.push({
        Tg_No: row.Tg_No,
        Tg_Code: row.Tg_Code,
        Ma_Code: row.Ma_Code,
        ch_name: row.ch_name,
        kh_name: row.kh_name,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return acc;
    }, {});

    const documents = Object.values(groupedData);

    const bulkOps = documents.map((doc) => ({
      updateOne: {
        filter: {
          St_No: doc.St_No,
          By_Style: doc.By_Style,
          Dept_Type: doc.Dept_Type,
        },
        update: {
          $set: {
            St_No: doc.St_No,
            By_Style: doc.By_Style,
            Dept_Type: doc.Dept_Type,
            orderData: doc.orderData,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        upsert: true,
      },
    }));

    await InlineOrders.bulkWrite(bulkOps);
    console.log(
      `Successfully synced ${documents.length} documents to inline_orders.`,
    );

    // Remove documents that no longer exist in the source data
    const existingKeys = documents.map(
      (doc) => `${doc.St_No}_${doc.By_Style}_${doc.Dept_Type}`,
    );
    await InlineOrders.deleteMany({
      $and: [
        { St_No: { $exists: true } },
        { By_Style: { $exists: true } },
        { Dept_Type: { $exists: true } },
        {
          $expr: {
            $not: {
              $in: [
                {
                  $concat: ["$St_No", "_", "$By_Style", "_", "$Dept_Type"],
                },
                existingKeys,
              ],
            },
          },
        },
      ],
    });
    console.log("Removed outdated documents from inline_orders.");
  } catch (err) {
    console.error("Error during inline_orders sync:", err);
    throw err;
  }
}

// API Endpoint to manually trigger the sync
// api/sync-inline-orders
export const getInlineOrdersSync = async (req, res) => {
  try {
    await syncInlineOrders();
    res
      .status(200)
      .json({ message: "Inline orders sync completed successfully." });
  } catch (err) {
    console.error("Error in /api/sync-inline-orders endpoint:", err);
    res.status(500).json({
      message: "Failed to sync inline orders",
      error: err.message,
    });
  }
};

// Schedule the sync to run every day at 11 AM
cron.schedule("0 11 * * *", async () => {
  console.log("Running scheduled inline_orders sync at 11 AM...");
  await syncInlineOrders();
});

/* ------------------------------
   YMCE System Data Endpoint
------------------------------ */

// api/ymce-system-data
export const getYMCESystemData = async (req, res) => {
  if (!sqlConnectionStatus.YMCE_SYSTEM) {
    return res.status(503).json({
      message:
        "Service Unavailable: The YMCE_SYSTEM database is not connected.",
      error: "Database connection failed",
    });
  }

  try {
    await ensurePoolConnected(poolYMCE, "YMCE_SYSTEM");
    const request = poolYMCE.request();

    // Paste the YMCE system data query from original getYMCESystemData (SELECT St_No, By_Style, ... GROUP BY ...)
    const query = `
      SELECT
        St_No,
        By_Style,
        Tg_No,
        Tg_Code,
        Ma_Code,
        ch_name,
        kh_name,
        Dept_Type,
        SUM(Tg_Pcs) AS PiecesQty,
        SUM(Tg_Price) AS OperationPrice,
        SUM(GST_SAM) AS GST
      FROM
        dbo.ViewTg vt
      WHERE
        Dept_Type = 'Sewing'
      GROUP BY
        St_No,
        By_Style,
        Tg_No,
        Tg_Code,
        Ma_Code,
        ch_name,
        kh_name,
        Dept_Type;
    `;

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching YMCE_SYSTEM data:", err);
    res.status(500).json({
      message: "Failed to fetch YMCE_SYSTEM data",
      error: err.message,
    });
  }
};

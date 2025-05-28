import cron from "node-cron";
import {
  syncQC1SunriseData,
  syncInlineOrders,
  syncCuttingOrders,
  syncCutPanelOrders,
} from "../Controller/SQL/sqlSyncController.js";
import { initializePools } from "../Config/sqldb.js";
import { InlineOrders } from "../Config/mongodb.js";

// Drop the conflicting St_No_1 index if it exists
async function dropConflictingIndex() {
  try {
    const indexes = await InlineOrders.collection.getIndexes();
    if (indexes["St_No_1"]) {
      await InlineOrders.collection.dropIndex("St_No_1");
      console.log("Dropped conflicting St_No_1 index from InlineOrders.");
    } else {
      console.log("St_No_1 index not found in InlineOrders, no need to drop.");
    }
  } catch (err) {
    console.error("Error dropping St_No_1 index from InlineOrders:", err);
  }
}

/* ------------------------------
   Initialize Pools and Run Initial Syncs
------------------------------ */
export async function initializeSchedulerAndSyncs() {
  try {
    await dropConflictingIndex();

    await initializePools();
    console.log("All SQL connection pools initialized successfully.");

    // Run initial synchronizations
    console.log("Running initial data synchronizations...");
    await Promise.all([
      syncInlineOrders().then(() => console.log("Initial inline_orders sync completed.")),
      syncCuttingOrders().then(() => console.log("Initial cuttingOrders sync completed.")),
      syncCutPanelOrders().then(() => console.log("Initial cutpanelorders sync completed.")),
      syncQC1SunriseData().then(() => console.log("Initial QC1 Sunrise sync completed.")),
    ]);
    console.log("All initial data synchronizations completed.");

    // Schedule cron jobs
    // Schedule daily QC1 Sunrise data sync at midnight
    cron.schedule("0 0 * * *", async () => {
      console.log("Running daily QC1 Sunrise data sync...");
      try {
        await syncQC1SunriseData();
        console.log("Daily QC1 Sunrise data sync completed.");
      } catch (err) {
        console.error("Error in daily QC1 Sunrise sync:", err);
      }
    });

    // Schedule inline_orders sync to run every day at 11 AM
    cron.schedule("0 11 * * *", async () => {
      console.log("Running scheduled inline_orders sync at 11 AM...");
      try {
        await syncInlineOrders();
        console.log("Scheduled inline_orders sync at 11 AM completed.");
      } catch (err) {
        console.error("Error in scheduled inline_orders sync at 11 AM:", err);
      }
    });

    // Schedule cuttingOrders sync to run every day at 7 AM
    cron.schedule("0 7 * * *", async () => {
      console.log("Running scheduled cuttingOrders sync at 7 AM...");
      try {
        await syncCuttingOrders();
        console.log("Scheduled cuttingOrders sync at 7 AM completed.");
      } catch (err) {
        console.error("Scheduled cuttingOrders sync at 7 AM failed:", err);
      }
    });

    console.log("Cron jobs for data synchronization have been scheduled.");

  } catch (err) {
    console.error(
      "Failed to initialize scheduler, SQL pools, or run initial syncs:",
      err
    );
    // Critical failure, exit the process
    process.exit(1);
  }
}
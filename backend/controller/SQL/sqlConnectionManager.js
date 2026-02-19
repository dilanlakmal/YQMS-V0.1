import sql from "mssql";
import {
  // sqlConfigYMDataStore,
  sqlConfigYMCE,
  sqlConfigFCSystem,
} from "../../Config/sqlConfig.js";

// Create connection pools
// export const poolYMDataStore = new sql.ConnectionPool(sqlConfigYMDataStore);
export const poolYMCE = new sql.ConnectionPool(sqlConfigYMCE);
export const poolFCSystem = new sql.ConnectionPool(sqlConfigFCSystem);

// SQL Connection Status Tracker
export const sqlConnectionStatus = {
  YMDataStore: false,
  YMCE_SYSTEM: false,
  FCSystem: false,
};

// Function to connect to a pool
async function connectPool(pool, poolName) {
  try {
    if (pool.connected || pool.connecting) {
      try {
        await pool.close();
      } catch (closeErr) {
        console.warn(
          `Warning closing existing ${poolName} connection:`,
          closeErr.message,
        );
      }
    }

    await pool.connect();
    console.log(
      `✅ Successfully connected to ${poolName} pool at ${pool.config.server}`,
    );
    sqlConnectionStatus[poolName] = true;

    pool.on("error", (err) => {
      console.error(`SQL Pool Error for ${poolName}:`, err);
      sqlConnectionStatus[poolName] = false;
    });
  } catch (err) {
    console.error(`❌ FAILED to connect to ${poolName} pool:`, err.message);
    sqlConnectionStatus[poolName] = false;
    throw new Error(`Failed to connect to ${poolName}`);
  }
}

// Function to ensure pool is connected with retry logic
export async function ensurePoolConnected(pool, poolName, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (pool.connected && sqlConnectionStatus[poolName]) {
        return;
      }

      console.log(
        `Attempt ${attempt}/${maxRetries}: Reconnecting to ${poolName}...`,
      );

      if (pool.connected || pool.connecting) {
        try {
          await pool.close();
        } catch (closeErr) {
          console.warn(
            `Warning during close for ${poolName}:`,
            closeErr.message,
          );
        }
      }

      if (attempt > 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
      }

      await connectPool(pool, poolName);
      return;
    } catch (reconnectErr) {
      console.error(
        `Attempt ${attempt}/${maxRetries} failed for ${poolName}:`,
        reconnectErr.message,
      );

      if (attempt === maxRetries) {
        sqlConnectionStatus[poolName] = false;
        throw new Error(
          `Failed to reconnect to ${poolName} after ${maxRetries} attempts: ${reconnectErr.message}`,
        );
      }
    }
  }
}

// Initialize all SQL pools
export async function initializeSQLPools() {
  console.log("Initializing SQL connection pools...");
  const connectionPromises = [
    // connectPool(poolYMDataStore, "YMDataStore"),
    connectPool(poolYMCE, "YMCE_SYSTEM"),
    connectPool(poolFCSystem, "FCSystem"),
  ];

  const results = await Promise.allSettled(connectionPromises);

  results.forEach((result) => {
    if (result.status === "rejected") {
      console.warn(
        `Initialization Warning: ${result.reason.message}. Dependent services will be unavailable.`,
      );
    }
  });

  console.log("Current SQL Connection Status:", sqlConnectionStatus);
  console.log(
    "SQL pool initialization complete. Server will continue regardless of failures.",
  );
}

// Close all SQL pools
export async function closeSQLPools() {
  try {
    await Promise.all([
      // poolYMDataStore.close(),
      poolYMCE.close(),
      poolFCSystem.close(),
    ]);
    console.log("SQL connection pools closed.");
  } catch (err) {
    console.error("Error closing SQL connection pools:", err);
    throw err;
  }
}

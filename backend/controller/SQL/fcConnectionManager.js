import sql from "mssql";
import { sqlConfigFCSystem } from "../../Config/sqlConfig.js";

// Independent FC System connection pool
const poolFC = new sql.ConnectionPool(sqlConfigFCSystem);

let isConnected = false;

// Connect to FC System
async function connectFC() {
  try {
    if (poolFC.connected || poolFC.connecting) {
      try {
        await poolFC.close();
      } catch (closeErr) {
        console.warn(
          "Warning closing existing FC connection:",
          closeErr.message,
        );
      }
    }

    await poolFC.connect();
    console.log(`✅ FC System connected at ${poolFC.config.server}`);
    isConnected = true;

    poolFC.on("error", (err) => {
      console.error("FC System Pool Error:", err);
      isConnected = false;
    });
  } catch (err) {
    console.error("❌ FC System connection failed:", err.message);
    isConnected = false;
    throw err;
  }
}

// Ensure connected with retry
export async function ensureFCConnected(maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (poolFC.connected && isConnected) {
        return;
      }

      console.log(
        `Attempt ${attempt}/${maxRetries}: Connecting to FC System...`,
      );

      if (poolFC.connected || poolFC.connecting) {
        try {
          await poolFC.close();
        } catch (closeErr) {
          console.warn("Warning during FC close:", closeErr.message);
        }
      }

      if (attempt > 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
      }

      await connectFC();
      return;
    } catch (reconnectErr) {
      console.error(
        `Attempt ${attempt}/${maxRetries} failed for FC System:`,
        reconnectErr.message,
      );

      if (attempt === maxRetries) {
        isConnected = false;
        throw new Error(
          `Failed to connect to FC System after ${maxRetries} attempts: ${reconnectErr.message}`,
        );
      }
    }
  }
}

// Get pool reference
export function getFCPool() {
  return poolFC;
}

// Get connection status
export function isFCConnected() {
  return isConnected;
}

// Close pool
export async function closeFCPool() {
  try {
    if (poolFC.connected) {
      await poolFC.close();
      console.log("FC System pool closed.");
    }
  } catch (err) {
    console.error("Error closing FC System pool:", err);
  }
}

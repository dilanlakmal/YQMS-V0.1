import sql from "mssql";
import { sqlConfigRealTimeSunrise } from "../../Config/sqlConfig.js";

// Independent RealTime Sunrise connection pool
const poolRealTimeSunrise = new sql.ConnectionPool(sqlConfigRealTimeSunrise);

let isConnected = false;

// Connect to RealTime Sunrise System (Gateway Server)
async function connectRealTimeSunrise() {
  try {
    if (poolRealTimeSunrise.connected) {
      return poolRealTimeSunrise;
    }

    if (poolRealTimeSunrise.connecting) {
      return poolRealTimeSunrise;
    }

    await poolRealTimeSunrise.connect();
    console.log(
      `✅ RealTime Sunrise connected to Gateway at ${poolRealTimeSunrise.config.server}`,
    );
    isConnected = true;

    poolRealTimeSunrise.on("error", (err) => {
      console.error("RealTime Sunrise Pool Error:", err);
      isConnected = false;
    });
  } catch (err) {
    console.error("❌ RealTime Sunrise connection failed:", err.message);
    isConnected = false;
    throw err;
  }
}

// Ensure connected with retry
export async function ensureRealTimeSunriseConnected(maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (poolRealTimeSunrise.connected && isConnected) {
        return;
      }

      if (attempt === 1) {
        console.log(`Connecting to RealTime Sunrise (Gateway)...`);
      }

      await connectRealTimeSunrise();
      return;
    } catch (reconnectErr) {
      console.error(
        `Attempt ${attempt}/${maxRetries} failed:`,
        reconnectErr.message,
      );

      if (attempt === maxRetries) {
        isConnected = false;
        throw new Error(
          `Failed to connect after ${maxRetries} attempts: ${reconnectErr.message}`,
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

export function getRealTimeSunrisePool() {
  return poolRealTimeSunrise;
}

export async function closeRealTimeSunrisePool() {
  try {
    if (poolRealTimeSunrise.connected) {
      await poolRealTimeSunrise.close();
      console.log("RealTime Sunrise System pool closed.");
    }
  } catch (err) {
    console.error("Error closing RealTime Sunrise System pool:", err);
  }
}

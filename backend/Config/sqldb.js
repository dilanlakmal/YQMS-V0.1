import sql from "mssql";

// SQL Server Configurations (Consider moving credentials to .env)
const sqlConfigYMDataStore = { 
  user: process.env.SQL_YMDS_USER || "ymdata", 
  password: process.env.SQL_YMDS_PASSWORD || "Kzw15947", 
  server: process.env.SQL_YMDS_SERVER || "192.167.1.13", 
  port: parseInt(process.env.SQL_YMDS_PORT) || 1433, 
  database: process.env.SQL_YMDS_DB || "YMDataStore", 
  options: { encrypt: false, trustServerCertificate: true }, 
  requestTimeout: 3000000, 
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 } 
};
const sqlConfigYMCE = { 
  user: process.env.SQL_YMCE_USER || "visitor", 
  password: process.env.SQL_YMCE_PASSWORD || "visitor", 
  server: process.env.SQL_YMCE_SERVER || "ymws-150", 
  database: process.env.SQL_YMCE_DB || "YMCE_SYSTEM", 
  options: { encrypt: false, trustServerCertificate: true }, 
  requestTimeout: 300000, 
  connectionTimeout: 300000, 
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 } 
};
const sqlConfigYMWHSYS2 = { 
  user: process.env.SQL_YMWH_USER || "user01", 
  password: process.env.SQL_YMWH_PASSWORD || "Ur@12323", 
  server: process.env.SQL_YMWH_SERVER || "YM-WHSYS", 
  database: process.env.SQL_YMWH_DB || "YMWHSYS2", 
  options: { encrypt: false, trustServerCertificate: true }, 
  requestTimeout: 300000, 
  connectionTimeout: 300000, 
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 } 
};

// SQL Server Connection Pools
export const poolYMDataStore = new sql.ConnectionPool(sqlConfigYMDataStore);
export const poolYMCE = new sql.ConnectionPool(sqlConfigYMCE);
export const poolYMWHSYS2 = new sql.ConnectionPool(sqlConfigYMWHSYS2);

export async function connectPool(pool, poolName) {
  let retries = 3;
  while (retries > 0) {
    try {
      await pool.connect();
      console.log(`Connected to ${poolName} pool at ${pool.config.server}`);
      return pool;
    } catch (err) {
      console.error(`Error connecting to ${poolName} pool:`, err);
      retries -= 1;
      if (retries === 0) throw new Error(`Failed to connect to ${poolName} after 3 attempts`);
      console.log(`Retrying ${poolName} connection (${retries} attempts left)...`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

export async function ensurePoolConnected(pool, poolName) {
  if (!pool.connected) {
    console.log(`${poolName} pool is not connected. Attempting to reconnect...`);
    await connectPool(pool, poolName);
  }
  return pool;
}

export async function initializePools() {
  try {
    await Promise.all([
      connectPool(poolYMDataStore, "YMDataStore"),
      connectPool(poolYMCE, "YMCE_SYSTEM"),
      connectPool(poolYMWHSYS2, "YMWHSYS2")
    ]);
    console.log("All SQL connection pools initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize SQL connection pools:", err);
    process.exit(1); // Exit if pools cannot be initialized during startup
  }
}

export async function closeSQLPools() {
    try {
        await Promise.all([
            poolYMDataStore.close(),
            poolYMCE.close(),
            poolYMWHSYS2.close()
        ]);
        console.log("SQL connection pools closed.");
    } catch (err) {
        console.error("Error closing SQL connection pools:", err);
        throw err; // Re-throw to allow calling function to handle
    }
}
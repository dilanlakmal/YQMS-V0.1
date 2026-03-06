import { app } from "./Config/appConfig.js";
/* -----------------------------
   SQL Query Import
------------------------------ */
import sqlQuery from "./routes/SQL/sqlQueryRoutes.js";
// import { closeSQLPools } from "./controller/SQL/sqlQueryController.js";
import { closeSQLPools } from "./controller/SQL/sqlConnectionManager.js";
// import FCSystemRoutes from "./routes/SQL/FCSystemRoutes.js";
// import { closeFCPool } from "./controller/SQL/fcConnectionManager.js";

// import RealTimeSunriseRoutes from "./routes/SQL/RealTimeSunriseRoutes.js";
// import { closeRealTimeSunrisePool } from "./controller/SQL/RealTimeSunriseConnectionManager.js";
/* ------------------------------
  SQL Query routs
------------------------------ */
app.use(sqlQuery);
// app.use(FCSystemRoutes);
// app.use(RealTimeSunriseRoutes);

/* ------------------------------
   FC System Graceful Shutdown
------------------------------ */
process.on("SIGINT", async () => {
  try {
    await closeSQLPools();
    // await closeFCPool();
    // await closeRealTimeSunrisePool();
  } catch (err) {
    console.error("Error closing FC pool:", err);
  } finally {
    process.exit(0);
  }
});

// process.on("SIGINT", async () => {
//   try {
//     await closeSQLPools();
//     console.log("SQL connection pools closed.");
//   } catch (err) {
//     console.error("Error closing SQL connection pools:", err);
//   } finally {
//     process.exit(0);
//   }
// });
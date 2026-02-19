import dotenv from "dotenv";
dotenv.config(); 

import { app } from "./Config/appConfig.js";
/* -----------------------------
   SQL Query Import
------------------------------ */
import sqlQuery from "./routes/SQL/sqlQueryRoutes.js";
// import { closeSQLPools } from "./controller/SQL/sqlQueryController.js";
import { closeSQLPools } from "./controller/SQL/sqlConnectionManager.js";
/* ------------------------------
  SQL Query routs
------------------------------ */
app.use(sqlQuery);


process.on("SIGINT", async () => {
  try {
    await closeSQLPools();
    console.log("SQL connection pools closed.");
  } catch (err) {
    console.error("Error closing SQL connection pools:", err);
  } finally {
    process.exit(0);
  }
});
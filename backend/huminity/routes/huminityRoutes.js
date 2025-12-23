import express from "express";
import { getHumidityData, getHumidityDataByMoNo, getHumiditySummaryByMoNo, getHumidityReports, exportHumidityReportsXlsx, createHumidityReport, exportHumidityReportsPaper } 
from "../controller/huminityController.js";

const router = express.Router();
router.get("/api/humidity-data", getHumidityData);
router.get("/api/humidity-data/:moNo", getHumidityDataByMoNo);
router.get("/api/humidity-data/:moNo/summary", getHumiditySummaryByMoNo);
router.post("/api/humidity-reports", createHumidityReport);
router.get("/api/humidity-reports", getHumidityReports);
router.get("/api/humidity-reports/export", exportHumidityReportsXlsx);
router.get("/api/humidity-reports/export-paper", exportHumidityReportsPaper);

export default router;



import express from "express";
import {
  getHumidityData,
  getHumidityDataByMoNo,
  getHumiditySummaryByMoNo,
  getHumidityReports,
  exportHumidityReportsXlsx,
  createHumidityReport,
  exportHumidityReportsPaper,
  approveHumidityReport,
  updateHumidityReport,
} from "../../controller/huminity/huminityController.js";
import { getReitmansHumidityByMoNo } from "../../controller/huminity/ReitmansController.js";

const router = express.Router();
router.get("/api/humidity-data", getHumidityData);
router.get("/api/humidity-data/:moNo", getHumidityDataByMoNo);
router.get("/api/humidity-data/:moNo/summary", getHumiditySummaryByMoNo);
router.get("/api/reitmans-humidity/:moNo", getReitmansHumidityByMoNo);
router.get("/api/reitmans-humidity", getReitmansHumidityByMoNo);
router.post("/api/humidity-reports", createHumidityReport);
router.get("/api/humidity-reports", getHumidityReports);
router.get("/api/humidity-reports/export", exportHumidityReportsXlsx);
router.get("/api/humidity-reports/export-paper", exportHumidityReportsPaper);
router.put("/api/humidity-reports/:id", updateHumidityReport);
router.post("/api/humidity-reports/:id/approve", approveHumidityReport);

export default router;

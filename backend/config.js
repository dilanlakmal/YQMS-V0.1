// config.js
import dotenv from "dotenv";
dotenv.config();

export const API_BASE_URL =
  process.env.API_BASE_URL || "https://192.167.14.32:5001";

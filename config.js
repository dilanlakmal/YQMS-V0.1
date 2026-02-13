// src/config.js
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Production server URL
export const PUBLIC_ASSET_URL = "https://yqms.yaikh.com";

// QR Code Base URL - Use network IP for QR codes so mobile devices can access
// Default: Use computer's IP with port 3001
export const QR_CODE_BASE_URL = import.meta.env.VITE_QR_CODE_BASE_URL || "https://192.167.7.200:3001";
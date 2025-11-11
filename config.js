let determinedApiBaseUrl;

if (typeof import.meta !== 'undefined' && typeof import.meta.env === 'object' && import.meta.env !== null) {
  determinedApiBaseUrl = import.meta.env.VITE_API_BASE_URL;
}
else if (typeof process !== 'undefined' && typeof process.env === 'object' && process.env !== null) {
  determinedApiBaseUrl = process.env.VITE_API_BASE_URL;
}

export const API_BASE_URL = determinedApiBaseUrl || "https://192.167.12.85:5000";
export const PUBLIC_ASSET_URL= "htttps://yqms.yaikh.com";

// src/config.js
// export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


// Smart API_BASE_URL detection: use network IP if accessing from network IP, otherwise use localhost
const getApiBaseUrl = () => {
    // Auto-detect based on current hostname
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
      
      if (isLocalhost) {
        // Accessing from localhost - use localhost for backend
        return "http://localhost:5001";
      } else {
        // Accessing from network IP - use same IP for backend
        return `http://${hostname}:5001`;
      }
    }
    
    // Fallback for SSR or if window is not available
    return import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";
  };
  
  export const API_BASE_URL = getApiBaseUrl();



// Production server URL
export const PUBLIC_ASSET_URL = "https://yqms.yaikh.com";

// QR Code Base URL - Use network IP for QR codes so mobile devices can access
// Set this to your computer's network IP address so phones can access it
// Computer IP: 192.167.7.200 (WiFi)
// Phone IP: 192.167.8.121
// Default: Use computer's IP with port 3001
export const QR_CODE_BASE_URL = import.meta.env.VITE_QR_CODE_BASE_URL || "http://192.167.7.200:3001";
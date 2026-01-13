// src/config.js
// export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const getApiBaseUrl = () => {
    //Auto-detect based on current hostname
    if(typeof window !== 'undefined'){
        const hostname = window.location.hostname;
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
        if(isLocalhost){
            //Accessing from localhost use localhost for backend
            return 'http://localhost:5001';
        }else{
            //Accessing from network Ip use hostname for backend
            return `http://${hostname}:5001`;
        }
    }
    // Fallback for SSR or if window is not available 
    return import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";
}

export const API_BASE_URL = getApiBaseUrl();

// Production server URL
export const PUBLIC_ASSET_URL = "http://yqms.yaikh.com";

// QR Code Base URL - Use network IP for QR codes so mobile devices can access
// Default: Use computer's IP with port 3001
export const QR_CODE_BASE_URL = import.meta.env.VITE_QR_CODE_BASE_URL || "http://192.167.7.200:3001";
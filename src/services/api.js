import axios from "axios";

/**
 * Singleton Axios instance for the entire application.
 * Automatically injects the Authorization token from storage.
 */
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL + "/api",
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request Interceptor: Inject Token
api.interceptors.request.use(
    (config) => {
        const token =
            localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Global Error Handling (Optional)
api.interceptors.response.use(
    (response) => response.data, // Return data directly to simplify usage
    (error) => {
        // Handle 401 Unauthorized globally if needed (e.g., redirect to login)
        if (error.response?.status === 401) {
            console.warn("Unauthorized access - redirecting to login...");
            // Logic to clear token or redirect could go here
        }
        return Promise.reject(error);
    }
);

export default api;

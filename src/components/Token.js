// Helper to get token
export const getToken = () =>
    localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
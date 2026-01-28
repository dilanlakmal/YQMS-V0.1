import api from "./api";

// Helper to get token (useful if needed elsewhere)
export const getToken = () =>
  localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

/**
 * Fetches the current user's profile.
 * @returns {Promise<Object>} The user profile data.
 */
export const fetchUserProfile = async () => {
  // api response interceptor already returns 'response.data', so we just return the result
  return api.get("/user-profile");
};

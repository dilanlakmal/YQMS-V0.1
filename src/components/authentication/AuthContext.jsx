import axios from "axios";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../../config";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      const storedUser =
        localStorage.getItem("user") || sessionStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Error parsing user data:", error);
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const updateUser = (userData) => {
    setUser(userData);
    // Store in both localStorage and sessionStorage to handle both remember me cases
    if (localStorage.getItem("accessToken")) {
      localStorage.setItem("user", JSON.stringify(userData));
    } else {
      sessionStorage.setItem("user", JSON.stringify(userData));
    }
  };

  const clearUser = () => {
    setUser(null);
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    sessionStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    sessionStorage.removeItem("refreshToken");
  };

  // Add token refresh logic
  const refreshTokenIfNeeded = async () => {
    try {
      const refreshToken =
        localStorage.getItem("refreshToken") ||
        sessionStorage.getItem("refreshToken");
      if (!refreshToken) return;

      const response = await axios.post(`${API_BASE_URL}/api/refresh-token`, {
        refreshToken,
      });

      if (response.status === 200) {
        const { accessToken } = response.data;
        if (localStorage.getItem("refreshToken")) {
          localStorage.setItem("accessToken", accessToken);
        } else {
          sessionStorage.setItem("accessToken", accessToken);
        }
        return true;
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
      clearUser();
      navigate("/");
      return false;
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token =
          localStorage.getItem("accessToken") ||
          sessionStorage.getItem("accessToken");
        if (!token) {
          setLoading(false);
          return;
        }

        // Try to refresh token first
        const refreshSuccess = await refreshTokenIfNeeded();
        if (!refreshSuccess) return;

        const response = await axios.get(`${API_BASE_URL}/api/user-profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 200) {
          updateUser(response.data);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        // Only clear user and redirect if it's an authentication error
        if (error.response && error.response.status === 401) {
          clearUser();
          navigate("/");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    // Set up periodic token refresh
    const refreshInterval = setInterval(refreshTokenIfNeeded, 15 * 60 * 1000); // Refresh every 15 minutes

    return () => clearInterval(refreshInterval);
  }, [navigate]);

  return (
    <AuthContext.Provider
      value={{ user, setUser, loading, updateUser, clearUser }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
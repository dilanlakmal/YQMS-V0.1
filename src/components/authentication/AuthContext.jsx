// import axios from "axios";
// import React, { createContext, useContext, useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { API_BASE_URL } from "../../../config";

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const navigate = useNavigate();
//   const [user, setUser] = useState(() => {
//     try {
//       // Always read from localStorage, as it's shared across tabs
//       const storedUser =
//         localStorage.getItem("user") || sessionStorage.getItem("user");
//       return storedUser ? JSON.parse(storedUser) : null;
//     } catch (error) {
//       console.error("Error parsing user data:", error);
//       return null;
//     }
//   });
//   const [loading, setLoading] = useState(true);

//   const updateUser = (userData) => {
//     // Store in both localStorage and sessionStorage to handle both remember me cases
//     setUser(userData);
//     if (localStorage.getItem("accessToken")) {
//       localStorage.setItem("user", JSON.stringify(userData));
//     }
//     if (sessionStorage.getItem("accessToken")) {
//       sessionStorage.setItem("user", JSON.stringify(userData));
//     }
//   };

//   const clearUser = () => {
//     setUser(null);
//     localStorage.removeItem("user");
//     sessionStorage.removeItem("user");
//     localStorage.removeItem("accessToken");
//     sessionStorage.removeItem("accessToken");
//     localStorage.removeItem("refreshToken");
//     sessionStorage.removeItem("refreshToken");
//   };

//   // Add token refresh logic
//   const refreshTokenIfNeeded = async () => {
//     try {
//       const refreshToken =
//         localStorage.getItem("refreshToken") ||
//         sessionStorage.getItem("refreshToken");
//       if (!refreshToken) return;

//       const response = await axios.post(`${API_BASE_URL}/api/refresh-token`, {
//         refreshToken
//       });

//       if (response.status === 200) {
//         const { accessToken } = response.data;
//         if (localStorage.getItem("refreshToken")) {
//           localStorage.setItem("accessToken", accessToken);
//         } else {
//           sessionStorage.setItem("accessToken", accessToken);
//         }
//         return true;
//       }
//     } catch (error) {
//       console.error("Error refreshing token:", error);
//       clearUser();
//       navigate("/");
//       return false;
//     }
//   };

//   // --- ADD STORAGE EVENT LISTENER ---
//   useEffect(() => {
//     const handleStorageChange = (event) => {
//       // This event fires in other tabs when localStorage changes
//       if (event.key === "accessToken" || event.key === "user") {
//         // A login or logout happened in another tab, reload the app state
//         // to reflect the change.
//         window.location.reload();
//       }
//     };

//     window.addEventListener("storage", handleStorageChange);

//     return () => {
//       window.removeEventListener("storage", handleStorageChange);
//     };
//   }, []);

//   useEffect(() => {
//     const fetchUser = async () => {
//       try {
//         const token =
//           localStorage.getItem("accessToken") ||
//           sessionStorage.getItem("accessToken");
//         if (!token) {
//           setLoading(false);
//           return;
//         }

//         // Try to refresh token first
//         const refreshSuccess = await refreshTokenIfNeeded();
//         if (!refreshSuccess) return;

//         const response = await axios.get(`${API_BASE_URL}/api/user-profile`, {
//           headers: { Authorization: `Bearer ${token}` }
//         });

//         if (response.status === 200) {
//           updateUser(response.data);
//         }
//       } catch (error) {
//         console.error("Error fetching user data:", error);
//         // Only clear user and redirect if it's an authentication error
//         if (error.response && error.response.status === 401) {
//           clearUser();
//           navigate("/");
//         }
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchUser();

//     // Set up periodic token refresh
//     const refreshInterval = setInterval(refreshTokenIfNeeded, 15 * 60 * 1000); // Refresh every 15 minutes

//     return () => clearInterval(refreshInterval);
//   }, [navigate]);

//   return (
//     <AuthContext.Provider
//       value={{ user, setUser, loading, updateUser, clearUser }}
//     >
//       {!loading && children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => useContext(AuthContext);

import axios from "axios";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../../config";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  // --- MODIFIED USER STATE ---
  const [user, setUser] = useState(() => {
    try {
      // Always read from localStorage.
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Error parsing user data:", error);
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  const updateUser = (userData) => {
    setUser(userData);
    // Always store in localStorage.
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const clearUser = () => {
    setUser(null);
    // Always clear from localStorage.
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    // Also clear session just in case
    sessionStorage.clear();
  };

  const refreshTokenIfNeeded = async () => {
    try {
      // Always get refresh token from localStorage
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) return;

      const response = await axios.post(`${API_BASE_URL}/api/refresh-token`, {
        refreshToken
      });

      if (response.status === 200) {
        const { accessToken } = response.data;
        // Always set the new access token in localStorage
        localStorage.setItem("accessToken", accessToken);
        return true;
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
      clearUser();
      navigate("/");
      return false;
    }
  };

  // --- MODIFIED STORAGE EVENT LISTENER ---
  useEffect(() => {
    const handleStorageChange = (event) => {
      // We now listen for our specific 'authEvent' key.
      // This will trigger on login/logout but NOT on token refresh.
      if (event.key === "authEvent") {
        // A login or logout happened in another tab. Reload to sync state.
        window.location.reload();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Always get token from localStorage
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setLoading(false);
          return;
        }

        const refreshSuccess = await refreshTokenIfNeeded();
        if (!refreshSuccess) return;

        // Use the newly refreshed token from localStorage
        const updatedToken = localStorage.getItem("accessToken");

        const response = await axios.get(`${API_BASE_URL}/api/user-profile`, {
          headers: { Authorization: `Bearer ${updatedToken}` }
        });

        if (response.status === 200) {
          updateUser(response.data);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        if (error.response && error.response.status === 401) {
          clearUser();
          navigate("/");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    const refreshInterval = setInterval(refreshTokenIfNeeded, 15 * 60 * 1000);

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

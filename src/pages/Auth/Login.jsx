import axios from "axios";
import { ClipboardList } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../../config";
import { useAuth } from "../../components/authentication/AuthContext";
import { useFormData } from "../../components/context/FormDataContext";
import AuthLayout from "../../components/layout/AuthLayout"; // Import the AuthLayout component

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { updateFormData } = useFormData();

  useEffect(() => {
    const token =
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("accessToken");
    if (token) {
      authenticateUser(token);
    }
  }, []);

  const authenticateUser = async (token) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/user-profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        onLogin(token);
        navigate("/home");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      // Only clear storage if it's an authentication error
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("accessToken");
        sessionStorage.removeItem("accessToken");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (username && password) {
      try {
        const response = await axios.post(`${API_BASE_URL}/api/login`, {
          username,
          password,
          rememberMe,
        });

        if (response.status === 200) {
          const { accessToken, refreshToken, user } = response.data;

          if (rememberMe) {
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", refreshToken);
            localStorage.setItem("user", JSON.stringify(user));
          } else {
            sessionStorage.setItem("accessToken", accessToken);
            sessionStorage.setItem("refreshToken", refreshToken);
            sessionStorage.setItem("user", JSON.stringify(user));
          }

          onLogin(accessToken);
          navigate("/home");
          setUser(user);
        }
      } catch (error) {
        setError("Invalid username or password");
      } finally {
        setLoading(false);
      }
    }
  };

  const refreshToken = async () => {
    const refreshToken =
      localStorage.getItem("refreshToken") ||
      sessionStorage.getItem("refreshToken");
    if (!refreshToken) {
      navigate("/login");
      return;
    }

    try {
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
        authenticateUser(accessToken);
      } else {
        navigate("/login");
      }
    } catch (error) {
      navigate("/login");
    }
  };

  useEffect(() => {
    const interval = setInterval(refreshToken, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AuthLayout title="Welcome Back!" subtitle="Please enter login details below">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="text-red-500 text-center mb-4">
            {error}
          </div>
        )}
        <div>
          <label
            htmlFor="username"
            className="block text-s font-medium text-gray-700 mb-1"
          >
            User Name
          </label>
          <input
            id="username"
            name="username"
            type="text"
            required
            className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your User Name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-s font-medium text-gray-700 mb-1"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter the Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="rememberMe"
              name="rememberMe"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label
              htmlFor="rememberMe"
              className="ml-2 block text-s text-gray-900"
            >
              Remember me
            </label>
          </div>
          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-s text-blue-600 hover:text-blue-600"
            >
              Forgot password?
            </Link>
          </div>
        </div>
        <center>
          <button
            type="submit"
            className="w-40 h-15 flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Log in
          </button>
        </center>
        <p className="text-center text-s text-gray-600">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Register
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default Login;

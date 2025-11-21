const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const getAccessToken = () => {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken")
  );
};

const buildRequestUrl = (path) => {
  if (!path.startsWith("/")) {
    return `${API_BASE_URL}/${path}`;
  }
  return `${API_BASE_URL}${path}`;
};

export const authFetch = async (path, options = {}) => {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Missing authentication token. Please login again.");
  }

  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`
  };

  const response = await fetch(buildRequestUrl(path), {
    ...options,
    headers
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const data = await response.json();
      if (data?.message) message = data.message;
    } catch {
      const text = await response.text();
      if (text) message = text;
    }
    throw new Error(message);
  }

  return response;
};

export const authJsonFetch = async (path, options = {}) => {
  const response = await authFetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  if (response.status === 204) {
    return null;
  }

  return response.json();
};


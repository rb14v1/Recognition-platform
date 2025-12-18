import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL; // http://127.0.0.1:8000/api/

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ================================
// REQUEST INTERCEPTOR
// ================================
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("access"); // ✅ CONSISTENT KEY
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ================================
// RESPONSE INTERCEPTOR (REFRESH)
// ================================
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refresh = localStorage.getItem("refresh"); // ✅ FIXED KEY
        if (!refresh) throw new Error("No refresh token");

        const res = await axios.post(`${BASE_URL}token/refresh/`, {
          refresh,
        });

        const newAccess = res.data.access;

        // Store new access token
        localStorage.setItem("access", newAccess);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);

      } catch (err) {
        // Logout on failure
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        window.location.href = "/";
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

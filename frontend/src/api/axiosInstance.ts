import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("access"); 
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

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
        const refresh = localStorage.getItem("refresh"); 
        if (!refresh) throw new Error("No refresh token");

        const res = await axios.post(`${BASE_URL}token/refresh/`, {
          refresh,
        });

        const newAccess = res.data.access;

        localStorage.setItem("access", newAccess);

        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);

      } catch (err) {
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

import axios from 'axios';

// Ensure the slash at the end if your auth endpoints are like "login/"
const BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 1. Request Interceptor: Attach Token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 2. Response Interceptor: Handle 401 Token Expiry
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't tried refreshing yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) {
                    throw new Error("No refresh token");
                }

                // Call refresh endpoint to get new access token
                const response = await axios.post(`${BASE_URL}token/refresh/`, {
                    refresh: refreshToken
                });

                const newAccessToken = response.data.access;
                
                // Update Storage
                localStorage.setItem('accessToken', newAccessToken);
                
                // Update Header for the failed request
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                
                // Retry the original request with new token
                return api(originalRequest);

            } catch (refreshError) {
                // Refresh failed (Session truly expired) -> Logout
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/'; 
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
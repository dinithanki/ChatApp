import axios from "axios";

const timeout = parseInt(import.meta.env.VITE_API_TIMEOUT || "30000");
const debugMode = import.meta.env.VITE_DEBUG_MODE === "true";

export const axiosInstance = axios.create({
  baseURL: "/api",
  withCredentials: true,
  timeout: timeout,
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    if (debugMode) {
      console.log("[API Request]", config.method.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    if (debugMode) {
      console.log("[API Response]", response.status, response.config.url);
    }
    return response;
  },
  (error) => {
    if (debugMode) {
      console.error(
        "[API Error]",
        error.response?.status || "Unknown",
        error.message,
      );
    }
    return Promise.reject(error);
  },
);

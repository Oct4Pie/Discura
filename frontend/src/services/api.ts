import axios, { AxiosError } from "axios";
import { useAuthStore } from "../stores/authStore";

/**
 * Set the authentication token for API requests
 * This updates both the axios instance and ensures the OpenAPI client
 * can access the token through the resolver function
 */
export const setAuthToken = (token: string | null) => {
  if (token) {
    // For axios requests
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    // For OpenAPI client, update the authStore which the resolver function uses
    // DO NOT directly set OpenAPI.TOKEN as it would override the resolver function
    const updateAuth = useAuthStore.setState;
    updateAuth({ token });

    console.log("API token set successfully");
  } else {
    // Clear token from axios
    delete axios.defaults.headers.common["Authorization"];
    delete api.defaults.headers.common["Authorization"];

    // Clear token from authStore
    const updateAuth = useAuthStore.setState;
    updateAuth({ token: null });

    console.log("API token cleared");
  }
};

/**
 * Get the authentication token directly from the auth store
 */
export const getAuthToken = (): string | null => {
  return useAuthStore.getState().token;
};

// Create a configured axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add authorization token to each request
api.interceptors.request.use(
  (config) => {
    // Get token directly from auth store
    const token = useAuthStore.getState().token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle auth errors in responses
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Use setAuthToken to clear token in all places
      setAuthToken(null);
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;

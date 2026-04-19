import axios from "axios";
import { getToken, clearToken } from "./auth";

export const api = axios.create({
  baseURL: "http://localhost:8080",
  headers: { "Content-Type": "application/json" },
  timeout: 12000,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (config.headers?.Authorization) {
    delete config.headers.Authorization;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearToken();
    }
    return Promise.reject(error);
  }
);

// Favorites API helpers
export const favoritesApi = {
  getAll: () => api.get("/api/favorites"),
  add: (articleId) => api.post(`/api/favorites/${articleId}`),
  remove: (articleId) => api.delete(`/api/favorites/${articleId}`),
  check: (articleId) => api.get(`/api/favorites/${articleId}/check`),
};
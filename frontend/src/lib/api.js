import axios from "axios";

const apiBase = import.meta.env.VITE_API_BASE || "/api";

export const api = axios.create({
  baseURL: apiBase,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("stf_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("stf_token");
      localStorage.removeItem("stf_user");
    }
    return Promise.reject(err);
  }
);

import axios from "axios";
import { AUTH_EVENTS, getAccessToken } from "../utils/storage";

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "/api",
  timeout: 20000,
  headers: {
    Accept: "application/json",
  },
});

http.interceptors.request.use((config) => {
  const nextConfig = { ...config };
  if (!nextConfig.skipAuth) {
    const token = getAccessToken();
    if (token) {
      nextConfig.headers = nextConfig.headers || {};
      nextConfig.headers.Authorization = `Bearer ${token}`;
    }
  }
  return nextConfig;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && !error.config?.skipAuth) {
      window.dispatchEvent(new CustomEvent(AUTH_EVENTS.UNAUTHORIZED));
    }
    return Promise.reject(error);
  },
);

export function unwrapResponse(payload) {
  if (!payload) return null;
  if (payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)) {
    return payload.data;
  }
  return payload;
}

export function unwrapCollection(payload) {
  const raw = unwrapResponse(payload);
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.results)) return raw.results;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.courses)) return raw.courses;
  return [];
}

export function getErrorMessage(error) {
  const payload = error?.response?.data;
  if (!payload) return error?.message || "Something went wrong.";
  if (typeof payload === "string") return payload;
  if (payload.message) return payload.message;
  if (payload.detail) return payload.detail;
  if (payload.error) return payload.error;

  const entries = Object.entries(payload).flatMap(([key, value]) => {
    if (Array.isArray(value)) return value.map((item) => `${key}: ${item}`);
    if (typeof value === "object" && value !== null) return [`${key}: ${JSON.stringify(value)}`];
    return [`${key}: ${value}`];
  });
  return entries.join(" | ") || "Something went wrong.";
}

export function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });
  const text = query.toString();
  return text ? `?${text}` : "";
}

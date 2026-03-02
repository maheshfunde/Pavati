import axios from "axios";

const TOKEN_KEY = "billing_token";
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;

function resolveApiBaseUrl(baseUrl?: string): string {
  if (!baseUrl || baseUrl.trim() === "") {
    return "/api";
  }

  const trimmed = baseUrl.trim();
  if (trimmed.startsWith("/") || /^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export const api = axios.create({
  baseURL: resolveApiBaseUrl(rawBaseUrl)
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function persistToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

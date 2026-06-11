import { PRODUCTION_API_URL } from "./constants";
import { parseApiError } from "./parseApiError";

function getApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (process.env.NODE_ENV === "production") return PRODUCTION_API_URL;
  if (typeof window !== "undefined") return ""; // same-origin /api rewrite in dev
  return process.env.API_URL || "http://localhost:4000";
}
function apiUrl(path: string): string {
  const base = getApiBase();
  if (!base) return `/api${path}`;
  return `${base}/v1${path}`;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

export function setToken(token: string) {
  localStorage.setItem("accessToken", token);
}

export function clearToken() {
  localStorage.removeItem("accessToken");
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const method = (options.method || "GET").toUpperCase();
  let body = options.body;
  if ((method === "POST" || method === "PUT" || method === "PATCH") && (body === undefined || body === null)) {
    body = "{}";
  }

  if (body !== undefined && !(body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  const res = await fetch(apiUrl(path), {
    ...options,
    body,
    headers,
    credentials: "include",
  });

  if (res.status === 401 && path !== "/auth/login") {
    try {
      const refresh = await fetch(apiUrl("/auth/refresh"), {
        method: "POST",
        credentials: "include",
      });
      if (refresh.ok) {
        const { accessToken } = await refresh.json();
        setToken(accessToken);
        headers.Authorization = `Bearer ${accessToken}`;
        const retry = await fetch(apiUrl(path), {
          ...options,
          body,
          headers,
          credentials: "include",
        });
        if (!retry.ok) {
          const err = await retry.json().catch(() => ({ error: "Request failed" }));
          throw new Error(parseApiError(err, "Request failed"));
        }
        const retryText = await retry.text();
        if (!retryText) return undefined as T;
        return JSON.parse(retryText) as T;
      }
    } catch {
      clearToken();
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(parseApiError(err, res.statusText || "Ошибка запроса"));
  }

  const text = await res.text();
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return undefined as T;
  }
}

export function getUploadUrl(path: string): string {
  const base = getApiBase();
  if (!base) return `/api${path}`;
  return `${base}/v1${path}`;
}

export { getApiBase as API_BASE };

function getApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined") return ""; // same-origin /api rewrite on Vercel
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
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  const res = await fetch(apiUrl(path), {
    ...options,
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
          headers,
          credentials: "include",
        });
        if (!retry.ok) throw new Error((await retry.json()).error || "Request failed");
        return retry.json();
      }
    } catch {
      clearToken();
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

export function getUploadUrl(path: string): string {
  const base = getApiBase();
  if (!base) return `/api${path}`;
  return `${base}/v1${path}`;
}

export { getApiBase as API_BASE };

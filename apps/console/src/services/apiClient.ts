const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const SCHEDULER_BASE = process.env.NEXT_PUBLIC_SCHEDULER_BASE_URL || "https://api.totembe.shop";

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

function authHeaders(): HeadersInit {
  const token = getAccessToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (errorData as { message?: string }).message ||
        `요청 실패 (${response.status})`
    );
  }
  return response.json() as Promise<T>;
}

// ---- Generic fetch helpers ----

export async function apiGet<T>(path: string, base = API_BASE): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    method: "GET",
    headers: authHeaders(),
  });
  return handleResponse<T>(res);
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  base = API_BASE
): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

export async function apiPut<T>(
  path: string,
  body: unknown,
  base = API_BASE
): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

export async function apiPatch<T>(
  path: string,
  body: unknown,
  base = API_BASE
): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

export async function apiDelete<T>(
  path: string,
  base = API_BASE
): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse<T>(res);
}

export { API_BASE, SCHEDULER_BASE };

/**
 * Thin fetch client for the standalone Express API in `backend/`.
 * Base URL comes from VITE_API_URL (defaults to the local Express port).
 */
import { installDemoFetch } from "@/demo/install";

const configuredApiUrl = import.meta.env.VITE_API_URL as string | undefined;

export const API_URL = (
  configuredApiUrl ||
  (import.meta.env.DEV ? "http://localhost:5000/api" : "")
).replace(/\/+$/, "");

if (!API_URL) {
  console.error("VITE_API_URL is missing. Configure your Render API URL in Vercel.");
}

installDemoFetch(API_URL);

const ACCESS_KEY = "meridian.accessToken";
const REFRESH_KEY = "meridian.refreshToken";

export const tokenStore = {
  get access() {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(REFRESH_KEY);
  },
  set(accessToken: string, refreshToken?: string) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ACCESS_KEY, accessToken);
    if (refreshToken) window.localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  },
};

export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
};

export class ApiRequestError extends Error {
  status: number;
  details: { field: string; message: string }[] | undefined;

  constructor(message: string, status: number, details?: { field: string; message: string }[]) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.details = details;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  auth?: boolean;
  signal?: AbortSignal;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = false, signal } = options;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth && tokenStore.access) headers["Authorization"] = `Bearer ${tokenStore.access}`;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      ...(signal ? { signal } : {}),
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new ApiRequestError(
      "Cannot reach the API. Start the Express server in `backend/` and set VITE_API_URL.",
      0
    );
  }

  let payload: ApiEnvelope<T> | null = null;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.success) {
    const message = payload?.message ?? `Request failed (${response.status})`;
    const details = (payload as unknown as { details?: { field: string; message: string }[] })
      ?.details;
    throw new ApiRequestError(message, response.status, details);
  }

  return payload.data;
}

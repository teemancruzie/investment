import type { ApiEnvelope } from "./api";

export type ListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function toQueryString(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "" || value === null) return;
    search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/** Reads the raw envelope so paginated `meta` survives alongside the items. */
export async function requestList<T>(path: string): Promise<{ items: T[]; meta: ListMeta }> {
  const { API_URL, ApiRequestError, tokenStore } = await import("./api");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (tokenStore.access) headers["Authorization"] = `Bearer ${tokenStore.access}`;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { headers });
  } catch {
    throw new ApiRequestError(
      "Cannot reach the API. Start the Express server in `backend/` and set VITE_API_URL.",
      0
    );
  }

  let payload: ApiEnvelope<T[]> | null = null;
  try {
    payload = (await response.json()) as ApiEnvelope<T[]>;
  } catch {
    payload = null;
  }
  if (!response.ok || !payload?.success) {
    throw new ApiRequestError(payload?.message ?? `Request failed (${response.status})`, response.status);
  }

  const meta = (payload.meta ?? {}) as Partial<ListMeta>;
  return {
    items: payload.data ?? [],
    meta: {
      page: meta.page ?? 1,
      limit: meta.limit ?? (payload.data?.length ?? 0),
      total: meta.total ?? (payload.data?.length ?? 0),
      totalPages: meta.totalPages ?? 1,
    },
  };
}

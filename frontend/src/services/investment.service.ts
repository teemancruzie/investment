import { apiRequest, type ApiEnvelope } from "./api";

export type RiskLevel = "low" | "medium" | "high";

export type Category = {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  investmentCount?: number;
};

export type Investment = {
  id: string;
  _id?: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  image: string;
  gallery?: string[];
  category: Category | string | null;
  expectedAnnualReturn: number;
  durationMonths: number;
  minimumInvestment: number;
  fundingGoal: number;
  fundedAmount: number;
  totalUnits: number;
  unitsSold: number;
  availableUnits: number;
  fundingProgress: number;
  riskLevel: RiskLevel;
  status: "draft" | "active" | "funded" | "closed" | "archived";
  isFeatured: boolean;
  location: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
};

export type UserInvestment = {
  id: string;
  _id?: string;
  investment: Partial<Investment> | string;
  amount: number;
  units: number;
  expectedReturn: number;
  earnedReturn?: number;
  status: string;
  maturityDate: string;
  createdAt: string;
};

export type ListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type InvestmentQuery = {
  search?: string;
  category?: string;
  riskLevel?: string;
  sort?: string;
  page?: number;
  limit?: number;
};

function toQueryString(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "" || value === null) return;
    search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/**
 * The list endpoint returns pagination in the envelope `meta`, so this helper
 * reads the raw envelope instead of going through `apiRequest`.
 */
async function requestList<T>(path: string): Promise<{ items: T[]; meta: ListMeta }> {
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

export const investmentService = {
  list(query: InvestmentQuery = {}) {
    return requestList<Investment>(`/investments${toQueryString(query)}`);
  },

  get(idOrSlug: string) {
    return apiRequest<Investment>(`/investments/${idOrSlug}`);
  },

  categories() {
    return apiRequest<Category[]>("/categories");
  },

  invest(id: string, amount: number) {
    return apiRequest<UserInvestment>(`/investments/${id}/invest`, {
      method: "POST",
      body: { amount },
      auth: true,
    });
  },

  mine(query: { page?: number; limit?: number; status?: string } = {}) {
    return requestList<UserInvestment>(`/investments/mine/list${toQueryString(query)}`);
  },
};

export const investmentKeys = {
  all: ["investments"] as const,
  list: (query: InvestmentQuery) => ["investments", "list", query] as const,
  detail: (idOrSlug: string) => ["investments", "detail", idOrSlug] as const,
  mine: () => ["investments", "mine"] as const,
  categories: () => ["categories"] as const,
};

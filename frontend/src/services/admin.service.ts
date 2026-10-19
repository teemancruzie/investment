import { apiRequest } from "./api";
import { requestList, toQueryString } from "./list";
import type { Transaction } from "./wallet.service";

export type RequestQuery = {
  type?: string;
  status?: string;
  asset?: string;
  page?: number;
  limit?: number;
};

export type RequestSummary = {
  deposits: number;
  depositValue: number;
  withdrawals: number;
  withdrawalValue: number;
};

export type AdminUser = {
  id: string;
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "user" | "admin";
  status: "active" | "disabled";
  isEmailVerified: boolean;
  createdAt: string;
};

export type AnalyticsOverview = {
  stats: {
    totalUsers: number;
    activeInvestors: number;
    totalInvestments: number;
    activeInvestments: number;
    totalInvested: number;
    totalReturns: number;
    revenue: number;
  };
  charts: {
    growth: { label: string; users: number }[];
    volume: { label: string; invested: number }[];
    byCategory: { label: string; count: number; funded: number }[];
  };
  recentUsers: { firstName: string; lastName: string; email: string; createdAt: string }[];
  recentInvestments: {
    amount: number;
    createdAt: string;
    user?: { firstName: string; lastName: string } | null;
    investment?: { title: string } | null;
  }[];
};

export type PayoutRun = {
  scanned: number;
  accrued: number;
  accruedValue: number;
  matured: number;
  principalReturned: number;
  dryRun: boolean;
  asOf: string;
  entries: { position: string; title: string; type: "return" | "principal"; amount: number }[];
};

export type WithdrawalRequest = Transaction & {
  walletBalance: number;
  pendingTotal: number;
  reviewedAt?: string;
  reviewedBy?: { firstName: string; lastName: string } | string | null;
};

export type DepositNetworkAdmin = {
  id: string;
  label: string;
  confirmations: number;
  address: string;
  enabled: boolean;
  updatedAt: string | null;
};
export type DepositAssetAdmin = { symbol: string; name: string; networks: DepositNetworkAdmin[] };

export type InvestorWallet = {
  user: { firstName: string; lastName: string; email: string };
  wallet: { balance: number; frozen?: boolean; frozenReason?: string };
  recent: Transaction[];
};

export const adminService = {
  userWallet(id: string) {
    return apiRequest<InvestorWallet>(`/admin/users/${id}/wallet`, { auth: true });
  },
  adjustWallet(id: string, body: { action: "credit" | "debit"; amount: number; note: string }) {
    return apiRequest(`/admin/users/${id}/wallet/adjust`, { method: "POST", body, auth: true });
  },
  setWalletHold(id: string, body: { frozen: boolean; reason?: string }) {
    return apiRequest(`/admin/users/${id}/wallet/hold`, { method: "PATCH", body, auth: true });
  },
  depositAddresses() {
    return apiRequest<DepositAssetAdmin[]>("/admin/deposit-addresses", { auth: true });
  },
  updateDepositAddress(body: { asset: string; network: string; address?: string; enabled?: boolean }) {
    return apiRequest("/admin/deposit-addresses", { method: "PUT", body, auth: true });
  },
  withdrawals(query: { status?: string; asset?: string; page?: number; limit?: number } = {}) {
    return requestList<WithdrawalRequest>(`/admin/withdrawals${toQueryString(query)}`);
  },
  reviewWithdrawal(id: string, body: { action: "approve" | "reject"; note?: string; payoutTxHash?: string }) {
    return apiRequest<Transaction>(`/admin/withdrawals/${id}/review`, { method: "PATCH", body, auth: true });
  },
  overview() {
    return apiRequest<AnalyticsOverview>("/analytics/overview", { auth: true });
  },
  requests(query: RequestQuery = {}) {
    return requestList<Transaction>(`/admin/requests${toQueryString(query)}`);
  },
  requestSummary() {
    return apiRequest<RequestSummary>("/admin/requests/summary", { auth: true });
  },
  review(id: string, body: { action: "approve" | "reject"; note?: string; amount?: number }) {
    return apiRequest<Transaction>(`/admin/requests/${id}/review`, {
      method: "PATCH",
      body,
      auth: true,
    });
  },
  payoutPreview() {
    return apiRequest<PayoutRun>("/admin/payouts/preview", { auth: true });
  },
  runPayouts() {
    return apiRequest<PayoutRun>("/admin/payouts/run", { method: "POST", auth: true });
  },
  users(query: { search?: string; page?: number; limit?: number } = {}) {
    return requestList<AdminUser>(`/users${toQueryString(query)}`);
  },
  setUserStatus(id: string, status: "active" | "disabled") {
    return apiRequest<AdminUser>(`/users/${id}/status`, { method: "PATCH", body: { status }, auth: true });
  },
  setUserRole(id: string, role: "user" | "admin") {
    return apiRequest<AdminUser>(`/users/${id}/role`, { method: "PATCH", body: { role }, auth: true });
  },
  updateInvestment(id: string, body: Record<string, unknown>) {
    return apiRequest(`/investments/${id}`, { method: "PATCH", body, auth: true });
  },
  createInvestment(body: Record<string, unknown>) {
    return apiRequest(`/investments`, { method: "POST", body, auth: true });
  },
  deleteInvestment(id: string) {
    return apiRequest(`/investments/${id}`, { method: "DELETE", auth: true });
  },
  archiveInvestment(id: string) {
    return apiRequest(`/investments/${id}/archive`, { method: "PATCH", auth: true });
  },
};

export const adminKeys = {
  overview: ["admin", "overview"] as const,
  requests: (query: RequestQuery) => ["admin", "requests", query] as const,
  summary: ["admin", "requests", "summary"] as const,
  withdrawals: (query: Record<string, unknown>) => ["admin", "withdrawals", query] as const,
  users: (query: Record<string, unknown>) => ["admin", "users", query] as const,
};

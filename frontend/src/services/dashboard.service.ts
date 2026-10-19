import { apiRequest } from "./api";

export type DashboardData = {
  stats: {
    portfolioValue: number;
    totalInvested: number;
    totalReturns: number;
    expectedReturns: number;
    activeInvestments: number;
    walletBalance: number;
    pendingTransactions: number;
    unreadNotifications: number;
  };
  charts: {
    monthly: { label: string; invested: number; returns: number }[];
    allocation: { label: string; value: number }[];
  };
  recentInvestments: {
    _id?: string;
    id?: string;
    amount: number;
    units: number;
    earnedReturn?: number;
    expectedReturn?: number;
    status: string;
    maturityDate?: string;
    createdAt: string;
    investment?: { title?: string; image?: string; expectedAnnualReturn?: number } | null;
  }[];
  recentTransactions: {
    _id?: string;
    id?: string;
    type: string;
    amount: number;
    status: string;
    description?: string;
    createdAt: string;
  }[];
};

export const dashboardService = {
  get() {
    return apiRequest<DashboardData>("/dashboard", { auth: true });
  },
};

export const dashboardKeys = { root: ["dashboard"] as const };

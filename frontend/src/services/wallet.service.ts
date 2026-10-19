import { apiRequest } from "./api";
import { requestList, toQueryString } from "./list";

export type Wallet = {
  id: string;
  balance: number;
  currency: string;
  lockedBalance?: number;
};

/** Ledger is USD-denominated; crypto is converted at deposit/withdrawal time. */
export type CryptoSymbol = "USDT" | "USDC" | "BTC" | "ETH" | "BNB" | "TRX" | "SOL";

export type CryptoNetwork = {
  id: string;
  label: string;
  confirmations: number;
  address: string;
};

export type CryptoAsset = {
  symbol: CryptoSymbol;
  name: string;
  stable: boolean;
  decimals: number;
  networks: CryptoNetwork[];
};

export type AssetCatalogue = {
  assets: CryptoAsset[];
  rates: Record<string, number>;
  quoteCurrency: string;
  updatedAt: string;
};

export type CryptoDepositPayload = {
  asset: string;
  network: string;
  cryptoAmount: number;
  txHash: string;
  proofUrl?: string;
};

export type CryptoWithdrawPayload = {
  amount: number;
  asset: string;
  network: string;
  address: string;
};

export const walletService = {
  get() {
    return apiRequest<Wallet>("/wallet", { auth: true });
  },
  assets() {
    return apiRequest<AssetCatalogue>("/wallet/assets");
  },
  createDeposit(payload: CryptoDepositPayload) {
    return apiRequest<Transaction>("/wallet/deposits/crypto", {
      method: "POST",
      body: payload,
      auth: true,
    });
  },
  deposits() {
    return requestList<Transaction>("/wallet/deposits?limit=10");
  },
  withdraw(payload: CryptoWithdrawPayload) {
    return apiRequest<Transaction>("/wallet/withdraw", {
      method: "POST",
      body: payload,
      auth: true,
    });
  },
};

export const walletKeys = {
  wallet: ["wallet"] as const,
  assets: ["wallet", "assets"] as const,
  deposits: ["wallet", "deposits"] as const,
};

export type TransactionType = "deposit" | "withdrawal" | "investment" | "return" | "fee" | "purchase" | "sale";

export type TransactionCrypto = {
  asset: CryptoSymbol;
  network: string;
  address?: string;
  txHash?: string;
  cryptoAmount: number;
  rateUsd: number;
  proofUrl?: string;
  confirmations?: number;
  requiredConfirmations?: number;
  confirmationStatus?: "awaiting" | "confirming" | "confirmed" | "failed";
};

export type Transaction = {
  id: string;
  _id?: string;
  type: TransactionType;
  method?: "crypto" | "manual" | "internal";
  amount: number;
  balanceAfter: number;
  status: "pending" | "completed" | "failed" | "rejected";
  crypto?: TransactionCrypto;
  reference?: string;
  description?: string;
  adminNote?: string;
  investment?: string | null;
  user?: { id?: string; _id?: string; firstName: string; lastName: string; email: string } | string;
  createdAt: string;
};

export type TransactionQuery = {
  type?: string;
  status?: string;
  method?: string;
  asset?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

export const transactionService = {
  list(query: TransactionQuery = {}) {
    return requestList<Transaction>(`/transactions${toQueryString(query)}`);
  },
};

export const transactionKeys = {
  all: ["transactions"] as const,
  list: (query: TransactionQuery) => ["transactions", "list", query] as const,
};

/** Formats a crypto amount without trailing zeros. */
export function formatCryptoAmount(value: number | undefined | null, symbol: string, decimals = 8) {
  const amount = Number(value ?? 0)
    .toFixed(decimals)
    .replace(/0+$/, "")
    .replace(/\.$/, "");
  return `${amount || "0"} ${symbol}`;
}

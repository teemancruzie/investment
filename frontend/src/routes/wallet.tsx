import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  formatCryptoAmount,
  transactionKeys,
  transactionService,
  walletKeys,
  walletService,
  type CryptoAsset,
} from "@/services/wallet.service";

const title = "Crypto Wallet — Meridian Capital";
const description =
  "Fund your Meridian account with USDT, USDC, Bitcoin, Ethereum, BNB, TRX or SOL and withdraw returns back on-chain.";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WalletPage,
});

const STATUS_STYLES: Record<string, string> = {
  pending: "border-gold/40 text-gold",
  completed: "border-emerald-400/40 text-emerald-400",
  rejected: "border-destructive/40 text-destructive",
  failed: "border-destructive/40 text-destructive",
};

function WalletPage() {
  const { isAuthenticated, isLoading } = useAuth();

  const walletQuery = useQuery({
    queryKey: walletKeys.wallet,
    queryFn: () => walletService.get(),
    enabled: isAuthenticated,
    retry: false,
  });

  const assetsQuery = useQuery({
    queryKey: walletKeys.assets,
    queryFn: () => walletService.assets(),
    retry: false,
    staleTime: 60_000,
  });

  const requestsQuery = useQuery({
    queryKey: transactionKeys.list({ type: "", method: "crypto", limit: 8 }),
    queryFn: () => transactionService.list({ method: "crypto", limit: 8 }),
    enabled: isAuthenticated,
    retry: false,
  });

  if (!isLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-5 pb-24 pt-40 text-center">
          <h1 className="font-display text-4xl">Your crypto wallet</h1>
          <p className="text-muted-foreground">
            Sign in to view balances, deposit stablecoins or crypto, and request payouts.
          </p>
          <Button asChild size="lg">
            <Link to="/login">Sign in</Link>
          </Button>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const balance = walletQuery.data?.balance ?? 0;
  const requests = requestsQuery.data?.items ?? [];
  const pendingWithdrawals = requests
    .filter((tx) => tx.type === "withdrawal" && tx.status === "pending")
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 pb-24 pt-32 lg:px-8">
        <header className="mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Treasury</p>
          <h1 className="mt-3 font-display text-4xl md:text-5xl">Crypto wallet</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Balances are held in USD. Deposits in USDT, USDC, BTC, ETH, BNB, TRX and SOL are converted at the
            rate confirmed when your transfer is verified on-chain.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Available balance" value={formatCurrency(balance - pendingWithdrawals, 2)} accent />
          <StatCard label="Total balance" value={formatCurrency(balance, 2)} />
          <StatCard label="Reserved for payouts" value={formatCurrency(pendingWithdrawals, 2)} />
        </div>

        {walletQuery.isError ? (
          <p className="mt-6 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {(walletQuery.error as Error).message}
          </p>
        ) : null}

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.15fr_1fr]">
          <Tabs defaultValue="deposit" className="rounded-lg border border-border/70 bg-card/40 p-6">
            <TabsList className="mb-6">
              <TabsTrigger value="deposit">Deposit crypto</TabsTrigger>
              <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
            </TabsList>
            <TabsContent value="deposit">
              <DepositForm assets={assetsQuery.data?.assets ?? []} rates={assetsQuery.data?.rates ?? {}} />
            </TabsContent>
            <TabsContent value="withdraw">
              <WithdrawForm
                assets={assetsQuery.data?.assets ?? []}
                rates={assetsQuery.data?.rates ?? {}}
                available={balance - pendingWithdrawals}
              />
            </TabsContent>
          </Tabs>

          <div className="space-y-8">
          <DepositTracker />
          <section className="rounded-lg border border-border/70 bg-card/40 p-6">
            <h2 className="font-display text-2xl">Recent crypto activity</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Deposits are credited once an operator confirms the transaction hash.
            </p>

            <div className="mt-6 space-y-3">
              {requestsQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : requests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No crypto transfers yet.</p>
              ) : (
                requests.map((tx) => (
                  <div
                    key={tx.id ?? tx._id}
                    className="rounded-md border border-border/60 bg-background/40 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm capitalize">{tx.type}</span>
                      <Badge variant="outline" className={STATUS_STYLES[tx.status] ?? ""}>
                        {tx.status}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {tx.crypto ? formatCryptoAmount(tx.crypto.cryptoAmount, tx.crypto.asset) : "—"}
                      </span>
                      <span>{formatCurrency(tx.amount, 2)}</span>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {formatDate(tx.createdAt)} · {tx.crypto?.txHash || tx.crypto?.address || tx.reference}
                    </p>
                    {tx.adminNote ? (
                      <p className="mt-1 text-xs text-gold">Operator note: {tx.adminNote}</p>
                    ) : null}
                  </div>
                ))
              )}
            </div>

            <Button asChild variant="ghost" className="mt-6 w-full">
              <Link to="/transactions">View full ledger</Link>
            </Button>
          </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

const CONF_LABEL: Record<string, string> = {
  awaiting: "Waiting for network",
  confirming: "Confirming",
  confirmed: "Confirmed — awaiting credit",
  failed: "Failed on-chain",
};

function DepositTracker() {
  const query = useQuery({
    queryKey: walletKeys.deposits,
    queryFn: () => walletService.deposits(),
    refetchInterval: 30_000,
    retry: false,
  });
  const deposits = (query.data?.items ?? []).filter((d) => d.status === "pending");
  return (
    <section className="rounded-lg border border-border/70 bg-card/40 p-6">
      <h2 className="font-display text-2xl">Deposit tracker</h2>
      <p className="mt-1 text-sm text-muted-foreground">Live confirmation status, refreshed every 30 seconds.</p>
      <div className="mt-5 space-y-4">
        {deposits.length === 0 ? (
          <p className="text-sm text-muted-foreground">No deposits in progress.</p>
        ) : (
          deposits.map((d) => {
            const c = d.crypto;
            const need = c?.requiredConfirmations || 1;
            const have = Math.min(c?.confirmations ?? 0, need);
            const status = c?.confirmationStatus ?? "awaiting";
            return (
              <div key={d.id ?? d._id} className="rounded-md border border-border/60 bg-background/40 px-4 py-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span>{c ? formatCryptoAmount(c.cryptoAmount, c.asset) : "Deposit"}</span>
                  <Badge variant="outline" className={status === "failed" ? "text-destructive" : "text-gold"}>
                    {CONF_LABEL[status]}
                  </Badge>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-gold transition-all" style={{ width: `${(have / need) * 100}%` }} />
                </div>
                <p className="mt-2 truncate text-xs text-muted-foreground">
                  {have}/{need} confirmations · {c?.network} · {c?.txHash}
                </p>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-border/70 bg-card/40 px-5 py-6">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className={`mt-3 font-display text-3xl ${accent ? "text-gold" : ""}`}>{value}</p>
    </div>
  );
}

function DepositForm({ assets, rates }: { assets: CryptoAsset[]; rates: Record<string, number> }) {
  const queryClient = useQueryClient();
  const [symbol, setSymbol] = useState("USDT");
  const [networkId, setNetworkId] = useState("");
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState<string | null>(null);

  const asset = useMemo(() => assets.find((a) => a.symbol === symbol) ?? assets[0], [assets, symbol]);
  const network = useMemo(
    () => asset?.networks.find((n) => n.id === networkId) ?? asset?.networks[0],
    [asset, networkId]
  );
  const rate = rates[asset?.symbol ?? ""] ?? 0;
  const usdValue = (Number(amount) || 0) * rate;

  const mutation = useMutation({
    mutationFn: () =>
      walletService.createDeposit({
        asset: asset!.symbol,
        network: network!.id,
        cryptoAmount: Number(amount),
        txHash: txHash.trim(),
      }),
    onSuccess: () => {
      toast.success("Deposit submitted", {
        description: "We'll credit your wallet once the transfer is confirmed on-chain.",
      });
      setAmount("");
      setTxHash("");
      void queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      void queryClient.invalidateQueries({ queryKey: walletKeys.wallet });
    },
    onError: (err: Error) => setError(err.message),
  });

  function submit() {
    setError(null);
    if (!asset || !network) return setError("Select an asset and network.");
    if (!(Number(amount) > 0)) return setError("Enter the amount you sent.");
    if (txHash.trim().length < 8) return setError("Enter the on-chain transaction hash.");
    mutation.mutate();
  }

  if (assets.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Asset catalogue unavailable — start the Express API in <code>backend/</code> to load deposit addresses.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm text-muted-foreground">Asset</p>
        <div className="flex flex-wrap gap-2">
          {assets.map((item) => (
            <button
              key={item.symbol}
              type="button"
              onClick={() => {
                setSymbol(item.symbol);
                setNetworkId("");
              }}
              className={`rounded-sm border px-3 py-2 text-sm transition-colors ${
                item.symbol === asset?.symbol
                  ? "border-gold text-gold"
                  : "border-border/70 text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.symbol}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm text-muted-foreground">Network</p>
        <div className="flex flex-wrap gap-2">
          {asset?.networks.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setNetworkId(item.id)}
              className={`rounded-sm border px-3 py-2 text-sm transition-colors ${
                item.id === network?.id
                  ? "border-gold text-gold"
                  : "border-border/70 text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <DepositAddress address={network?.address ?? ""} symbol={asset?.symbol ?? ""} label={network?.label ?? ""} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="deposit-amount" className="text-sm text-muted-foreground">
            Amount sent ({asset?.symbol})
          </label>
          <Input
            id="deposit-amount"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0.00"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="deposit-hash" className="text-sm text-muted-foreground">
            Transaction hash
          </label>
          <Input
            id="deposit-hash"
            value={txHash}
            onChange={(event) => setTxHash(event.target.value)}
            placeholder="0x… or tx id"
          />
        </div>
      </div>

      <div className="rounded-md border border-border/70 bg-background/40 px-4 py-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Rate</span>
          <span>
            1 {asset?.symbol} ≈ {formatCurrency(rate, 2)}
          </span>
        </div>
        <div className="mt-2 flex justify-between">
          <span className="text-muted-foreground">Estimated credit</span>
          <span className="text-gold">{formatCurrency(usdValue, 2)}</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Final credit uses the rate confirmed at verification. Requires {network?.confirmations ?? 0} network
          confirmations.
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button className="w-full" onClick={submit} disabled={mutation.isPending}>
        {mutation.isPending ? "Submitting…" : "I have sent the transfer"}
      </Button>
    </div>
  );
}

function DepositAddress({ address, symbol, label }: { address: string; symbol: string; label: string }) {
  const [copied, setCopied] = useState(false);

  if (!address) {
    return (
      <div className="rounded-md border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-muted-foreground">
        {symbol} deposits on {label} are temporarily unavailable. Please choose another coin or network.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-md border border-border/70 bg-background/40 p-4 sm:flex-row sm:items-center">
      <img
        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(address)}`}
        alt={`QR code for the ${symbol} deposit address on ${label}`}
        width={120}
        height={120}
        loading="lazy"
        className="size-30 shrink-0 rounded-sm bg-white p-2"
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {symbol} · {label}
        </p>
        <p className="mt-2 break-all font-mono text-sm">{address}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={async () => {
            await navigator.clipboard.writeText(address);
            setCopied(true);
            toast.success("Address copied");
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? "Copied" : "Copy address"}
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          Send only {symbol} over {label}. Transfers on any other network are unrecoverable.
        </p>
      </div>
    </div>
  );
}

function WithdrawForm({
  assets,
  rates,
  available,
}: {
  assets: CryptoAsset[];
  rates: Record<string, number>;
  available: number;
}) {
  const queryClient = useQueryClient();
  const [symbol, setSymbol] = useState("USDT");
  const [networkId, setNetworkId] = useState("");
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);

  const asset = useMemo(() => assets.find((a) => a.symbol === symbol) ?? assets[0], [assets, symbol]);
  const network = useMemo(
    () => asset?.networks.find((n) => n.id === networkId) ?? asset?.networks[0],
    [asset, networkId]
  );
  const rate = rates[asset?.symbol ?? ""] ?? 0;
  const cryptoOut = rate ? (Number(amount) || 0) / rate : 0;

  const mutation = useMutation({
    mutationFn: () =>
      walletService.withdraw({
        amount: Number(amount),
        asset: asset!.symbol,
        network: network!.id,
        address: address.trim(),
      }),
    onSuccess: () => {
      toast.success("Withdrawal requested", { description: "An operator will review and settle the payout." });
      setAmount("");
      setAddress("");
      void queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      void queryClient.invalidateQueries({ queryKey: walletKeys.wallet });
    },
    onError: (err: Error) => setError(err.message),
  });

  function submit() {
    setError(null);
    if (!asset || !network) return setError("Select an asset and network.");
    const value = Number(amount);
    if (!(value > 0)) return setError("Enter an amount.");
    if (value > available) return setError("Amount exceeds your available balance.");
    if (address.trim().length < 16) return setError("Enter a valid payout address.");
    mutation.mutate();
  }

  if (assets.length === 0) {
    return <p className="text-sm text-muted-foreground">Asset catalogue unavailable.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm text-muted-foreground">Payout asset</p>
        <div className="flex flex-wrap gap-2">
          {assets.map((item) => (
            <button
              key={item.symbol}
              type="button"
              onClick={() => {
                setSymbol(item.symbol);
                setNetworkId("");
              }}
              className={`rounded-sm border px-3 py-2 text-sm transition-colors ${
                item.symbol === asset?.symbol
                  ? "border-gold text-gold"
                  : "border-border/70 text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.symbol}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm text-muted-foreground">Network</p>
        <div className="flex flex-wrap gap-2">
          {asset?.networks.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setNetworkId(item.id)}
              className={`rounded-sm border px-3 py-2 text-sm transition-colors ${
                item.id === network?.id
                  ? "border-gold text-gold"
                  : "border-border/70 text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="withdraw-amount" className="text-sm text-muted-foreground">
          Amount in USD (available {formatCurrency(available, 2)})
        </label>
        <Input
          id="withdraw-amount"
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="0.00"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="withdraw-address" className="text-sm text-muted-foreground">
          {asset?.symbol} address ({network?.label})
        </label>
        <Input
          id="withdraw-address"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="Destination wallet address"
        />
      </div>

      <div className="rounded-md border border-border/70 bg-background/40 px-4 py-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">You receive approximately</span>
          <span className="text-gold">{formatCryptoAmount(cryptoOut, asset?.symbol ?? "")}</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Payouts are reviewed manually and settled at the rate at time of release.
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button className="w-full" onClick={submit} disabled={mutation.isPending}>
        {mutation.isPending ? "Requesting…" : "Request withdrawal"}
      </Button>
    </div>
  );
}

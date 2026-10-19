import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { adminKeys, adminService, type WithdrawalRequest } from "@/services/admin.service";
import { formatCryptoAmount } from "@/services/wallet.service";
import { formatCurrency, formatDate } from "@/lib/format";

const searchSchema = z.object({
  status: fallback(z.enum(["pending", "completed", "rejected"]), "pending").default("pending"),
  page: fallback(z.number().int(), 1).default(1),
});

export const Route = createFileRoute("/admin/withdrawals")({
  validateSearch: zodValidator(searchSchema),
  component: Withdrawals,
});

const STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Approved" },
  { value: "rejected", label: "Declined" },
] as const;

function Withdrawals() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: adminKeys.withdrawals(search),
    queryFn: () => adminService.withdrawals(search),
    placeholderData: keepPreviousData,
    retry: false,
  });

  const review = useMutation({
    mutationFn: (v: { id: string; action: "approve" | "reject"; note: string; payoutTxHash: string }) =>
      adminService.reviewWithdrawal(v.id, {
        action: v.action,
        ...(v.note.trim() ? { note: v.note.trim() } : {}),
        ...(v.payoutTxHash.trim() ? { payoutTxHash: v.payoutTxHash.trim() } : {}),
      }),
    onSuccess: (_d, v) => {
      toast.success(v.action === "approve" ? "Withdrawal approved" : "Withdrawal declined");
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const items = query.data?.items ?? [];
  const meta = query.data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => navigate({ search: { status: s.value, page: 1 } })}
            className={`rounded-sm border px-3 py-1.5 text-sm transition-colors ${
              search.status === s.value ? "border-gold text-gold" : "border-border/70 text-muted-foreground hover:text-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {query.isError ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {(query.error as Error).message}
        </p>
      ) : null}

      {query.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading withdrawals…</p>
      ) : items.length === 0 ? (
        <p className="rounded-lg border border-border/70 bg-card/40 px-5 py-10 text-center text-sm text-muted-foreground">
          No withdrawals in this queue.
        </p>
      ) : (
        <div className="space-y-4">
          {items.map((tx) => {
            const id = tx.id ?? tx._id ?? "";
            return (
              <WithdrawalCard
                key={id}
                tx={tx}
                busy={review.isPending && review.variables?.id === id}
                onReview={(action, note, payoutTxHash) => review.mutate({ id, action, note, payoutTxHash })}
              />
            );
          })}
        </div>
      )}

      {meta && meta.totalPages > 1 ? (
        <div className="flex items-center justify-between border-t border-border/60 pt-4 text-sm">
          <span className="text-muted-foreground">
            Page {meta.page} of {meta.totalPages} · {meta.total} withdrawals
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => navigate({ search: { ...search, page: meta.page - 1 } })}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => navigate({ search: { ...search, page: meta.page + 1 } })}>
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function WithdrawalCard({
  tx,
  busy,
  onReview,
}: {
  tx: WithdrawalRequest;
  busy: boolean;
  onReview: (action: "approve" | "reject", note: string, payoutTxHash: string) => void;
}) {
  const [note, setNote] = useState("");
  const [payoutTxHash, setPayoutTxHash] = useState("");
  const investor = typeof tx.user === "object" && tx.user ? tx.user : null;
  const reviewer = typeof tx.reviewedBy === "object" && tx.reviewedBy ? tx.reviewedBy : null;
  const shortfall = tx.status === "pending" && tx.walletBalance < tx.amount;
  const payoutHash = (tx.crypto as { payoutTxHash?: string } | undefined)?.payoutTxHash;

  const decline = () => {
    if (note.trim().length < 3) {
      toast.error("Add a reviewer note explaining why this withdrawal is declined.");
      return;
    }
    onReview("reject", note, "");
  };

  return (
    <article className="rounded-lg border border-border/70 bg-card/40 p-5">
      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,22rem)]">
        <div className="min-w-0 space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-gold/40 text-gold">Withdrawal</Badge>
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{tx.status}</span>
            {shortfall ? <Badge variant="destructive">Insufficient balance</Badge> : null}
          </div>
          <p className="font-display text-2xl">
            {formatCurrency(tx.amount, 2)}
            {tx.crypto ? (
              <span className="ml-2 text-base text-muted-foreground">
                ≈ {formatCryptoAmount(tx.crypto.cryptoAmount, tx.crypto.asset)} · {tx.crypto.network.toUpperCase()}
              </span>
            ) : null}
          </p>
          <p className="text-sm text-muted-foreground">
            {investor ? `${investor.firstName} ${investor.lastName} · ${investor.email}` : "Investor"} · requested {formatDate(tx.createdAt)}
          </p>
          <dl className="grid grid-cols-2 gap-3 text-sm sm:max-w-md">
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">Wallet balance</dt>
              <dd>{formatCurrency(tx.walletBalance, 2)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">All pending</dt>
              <dd>{formatCurrency(tx.pendingTotal, 2)}</dd>
            </div>
          </dl>
          {tx.crypto?.address ? (
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Payout address</p>
              <p className="mt-1 break-all font-mono text-xs">{tx.crypto.address}</p>
            </div>
          ) : null}
          {payoutHash ? (
            <p className="break-all font-mono text-xs text-muted-foreground">Payout tx: {payoutHash}</p>
          ) : null}
        </div>

        {tx.status === "pending" ? (
          <div className="flex flex-col gap-2">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reviewer note (required to decline)" rows={3} maxLength={500} />
            <Input value={payoutTxHash} onChange={(e) => setPayoutTxHash(e.target.value)} placeholder="Payout transaction hash (optional)" />
            <div className="flex gap-2">
              <Button className="flex-1" disabled={busy || shortfall} onClick={() => onReview("approve", note, payoutTxHash)}>
                Approve
              </Button>
              <Button variant="outline" className="flex-1" disabled={busy} onClick={decline}>
                Decline
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-1 text-sm text-muted-foreground">
            {tx.reviewedAt ? (
              <p>
                Reviewed {formatDate(tx.reviewedAt)}
                {reviewer ? ` by ${reviewer.firstName} ${reviewer.lastName}` : ""}
              </p>
            ) : null}
            {tx.adminNote ? <p>Note: {tx.adminNote}</p> : null}
          </div>
        )}
      </div>
    </article>
  );
}

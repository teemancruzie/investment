import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminKeys, adminService } from "@/services/admin.service";
import { formatCryptoAmount, type Transaction } from "@/services/wallet.service";
import { formatCurrency, formatDate } from "@/lib/format";

const searchSchema = z.object({
  type: fallback(z.string(), "").default(""),
  status: fallback(z.string(), "pending").default("pending"),
  page: fallback(z.number().int(), 1).default(1),
});

export const Route = createFileRoute("/admin/approvals")({
  validateSearch: zodValidator(searchSchema),
  component: Approvals,
});

const TYPES = [
  { value: "", label: "All requests" },
  { value: "deposit", label: "Deposits" },
  { value: "withdrawal", label: "Withdrawals" },
];

const STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Approved" },
  { value: "rejected", label: "Declined" },
];

function Approvals() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const queryClient = useQueryClient();
  const [note, setNote] = useState<Record<string, string>>({});

  const query = useQuery({
    queryKey: adminKeys.requests(search),
    queryFn: () => adminService.requests(search),
    placeholderData: keepPreviousData,
    retry: false,
  });

  const review = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "approve" | "reject" }) =>
      adminService.review(id, { action, ...(note[id] ? { note: note[id] } : {}) }),
    onSuccess: (_data, variables) => {
      toast.success(variables.action === "approve" ? "Request approved" : "Request declined");
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const items = query.data?.items ?? [];
  const meta = query.data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {TYPES.map((option) => (
          <FilterChip
            key={option.value || "all"}
            active={search.type === option.value}
            label={option.label}
            onClick={() => navigate({ search: { ...search, type: option.value, page: 1 } })}
          />
        ))}
        <span className="mx-2 hidden h-5 w-px bg-border/60 sm:block" />
        {STATUSES.map((option) => (
          <FilterChip
            key={option.value}
            active={search.status === option.value}
            label={option.label}
            onClick={() => navigate({ search: { ...search, status: option.value, page: 1 } })}
          />
        ))}
      </div>

      {query.isError ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {(query.error as Error).message}
        </p>
      ) : null}

      {query.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading requests…</p>
      ) : items.length === 0 ? (
        <p className="rounded-lg border border-border/70 bg-card/40 px-5 py-10 text-center text-sm text-muted-foreground">
          Nothing in this queue.
        </p>
      ) : (
        <div className="space-y-4">
          {items.map((tx) => (
            <RequestCard
              key={tx.id ?? tx._id}
              tx={tx}
              note={note[tx.id ?? tx._id ?? ""] ?? ""}
              onNote={(value) => setNote((prev) => ({ ...prev, [tx.id ?? tx._id ?? ""]: value }))}
              onReview={(action) => review.mutate({ id: tx.id ?? tx._id ?? "", action })}
              busy={review.isPending}
            />
          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 ? (
        <div className="flex items-center justify-between border-t border-border/60 pt-4 text-sm">
          <span className="text-muted-foreground">
            Page {meta.page} of {meta.totalPages} · {meta.total} requests
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => navigate({ search: { ...search, page: meta.page - 1 } })}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page >= meta.totalPages}
              onClick={() => navigate({ search: { ...search, page: meta.page + 1 } })}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-sm border px-3 py-1.5 text-sm transition-colors ${
        active ? "border-gold text-gold" : "border-border/70 text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function RequestCard({
  tx,
  note,
  onNote,
  onReview,
  busy,
}: {
  tx: Transaction;
  note: string;
  onNote: (value: string) => void;
  onReview: (action: "approve" | "reject") => void;
  busy: boolean;
}) {
  const investor = typeof tx.user === "object" && tx.user ? tx.user : null;
  const isDeposit = tx.type === "deposit";
  const explorerRef = tx.crypto?.txHash || tx.crypto?.address;

  return (
    <article className="rounded-lg border border-border/70 bg-card/40 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={isDeposit ? "border-emerald-400/40 text-emerald-400" : "border-gold/40 text-gold"}>
              {isDeposit ? "Deposit" : "Withdrawal"}
            </Badge>
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{tx.status}</span>
          </div>
          <p className="mt-3 font-display text-2xl">
            {formatCurrency(tx.amount, 2)}
            {tx.crypto ? (
              <span className="ml-2 text-base text-muted-foreground">
                ({formatCryptoAmount(tx.crypto.cryptoAmount, tx.crypto.asset)} · {tx.crypto.network.toUpperCase()})
              </span>
            ) : null}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {investor ? `${investor.firstName} ${investor.lastName} · ${investor.email}` : "Investor"} ·{" "}
            {formatDate(tx.createdAt)}
          </p>
          {explorerRef ? (
            <p className="mt-2 break-all font-mono text-xs text-muted-foreground">{explorerRef}</p>
          ) : null}
          {tx.crypto?.proofUrl ? (
            <a
              href={tx.crypto.proofUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-xs text-gold underline"
            >
              View payment proof
            </a>
          ) : null}
        </div>

        {tx.status === "pending" ? (
          <div className="flex w-full max-w-sm flex-col gap-2">
            <Input value={note} onChange={(event) => onNote(event.target.value)} placeholder="Reviewer note (optional)" />
            <div className="flex gap-2">
              <Button className="flex-1" disabled={busy} onClick={() => onReview("approve")}>
                Approve
              </Button>
              <Button variant="outline" className="flex-1" disabled={busy} onClick={() => onReview("reject")}>
                Decline
              </Button>
            </div>
          </div>
        ) : tx.adminNote ? (
          <p className="max-w-sm text-sm text-muted-foreground">Note: {tx.adminNote}</p>
        ) : null}
      </div>
    </article>
  );
}

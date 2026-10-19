import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency, formatPercent } from "@/lib/format";
import { investmentKeys, investmentService, type Investment } from "@/services/investment.service";
import { walletKeys, walletService } from "@/services/wallet.service";

export function InvestDialog({ investment }: { investment: Investment }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(investment.minimumInvestment ?? 0));
  const [error, setError] = useState<string | null>(null);

  const walletQuery = useQuery({
    queryKey: walletKeys.wallet,
    queryFn: () => walletService.get(),
    enabled: isAuthenticated && open,
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: (value: number) => investmentService.invest(investment.id ?? investment._id ?? "", value),
    onSuccess: () => {
      toast.success("Investment confirmed", {
        description: `${formatCurrency(Number(amount))} allocated to ${investment.title}.`,
      });
      void queryClient.invalidateQueries({ queryKey: investmentKeys.all });
      void queryClient.invalidateQueries({ queryKey: walletKeys.wallet });
      setOpen(false);
    },
    onError: (err: Error) => setError(err.message),
  });

  const isClosed = investment.status !== "active";
  const projected =
    (Number(amount) || 0) *
    (investment.expectedAnnualReturn / 100) *
    (investment.durationMonths / 12);

  function submit() {
    const value = Number(amount);
    setError(null);
    if (!Number.isFinite(value) || value <= 0) return setError("Enter a valid amount.");
    if (value < investment.minimumInvestment) {
      return setError(`Minimum investment is ${formatCurrency(investment.minimumInvestment)}.`);
    }
    mutation.mutate(value);
  }

  if (!isAuthenticated) {
    return (
      <Button
        size="lg"
        className="w-full"
        onClick={() => navigate({ to: "/login" })}
      >
        Sign in to invest
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full" disabled={isClosed}>
          {isClosed ? "Fully funded" : "Invest now"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invest in {investment.title}</DialogTitle>
          <DialogDescription>
            Funds are drawn from your Meridian wallet and allocated in whole units.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-md border border-border/70 bg-card/60 px-4 py-3 text-sm">
            <span className="text-muted-foreground">Wallet balance</span>
            <span>
              {walletQuery.isLoading
                ? "Loading…"
                : walletQuery.isError
                  ? "Unavailable"
                  : formatCurrency(walletQuery.data?.balance ?? 0)}
            </span>
          </div>

          <div className="space-y-2">
            <label htmlFor="invest-amount" className="text-sm text-muted-foreground">
              Amount (minimum {formatCurrency(investment.minimumInvestment)})
            </label>
            <Input
              id="invest-amount"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>

          <div className="rounded-md border border-border/70 bg-card/60 px-4 py-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Target annual return</span>
              <span className="text-gold">{formatPercent(investment.expectedAnnualReturn)}</span>
            </div>
            <div className="mt-2 flex justify-between">
              <span className="text-muted-foreground">Projected return over term</span>
              <span>{formatCurrency(projected)}</span>
            </div>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={mutation.isPending}>
            {mutation.isPending ? "Confirming…" : "Confirm investment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

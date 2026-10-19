import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { adminService } from "@/services/admin.service";
import { formatCurrency, formatDate } from "@/lib/format";

/** Admin: add/withdraw funds and put an investor's wallet on hold. */
export function FundsDialog({ userId, name }: { userId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const queryClient = useQueryClient();
  const key = ["admin", "user-wallet", userId];

  const query = useQuery({
    queryKey: key,
    queryFn: () => adminService.userWallet(userId),
    enabled: open,
    retry: false,
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: key });
    void queryClient.invalidateQueries({ queryKey: ["admin"] });
  };

  const adjust = useMutation({
    mutationFn: (action: "credit" | "debit") =>
      adminService.adjustWallet(userId, { action, amount: Number(amount), note: note.trim() }),
    onSuccess: (_d, action) => {
      toast.success(action === "credit" ? "Funds added" : "Funds withdrawn");
      setAmount("");
      setNote("");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const hold = useMutation({
    mutationFn: (frozen: boolean) => adminService.setWalletHold(userId, { frozen, reason: note.trim() }),
    onSuccess: (_d, frozen) => {
      toast.success(frozen ? "Funds protected" : "Funds released");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const wallet = query.data?.wallet;
  const valid = Number(amount) > 0 && note.trim().length >= 3;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Funds</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{name}</DialogTitle>
          <DialogDescription>Add, withdraw or protect this investor's funds.</DialogDescription>
        </DialogHeader>

        {query.isError ? (
          <p className="text-sm text-destructive">{(query.error as Error).message}</p>
        ) : !wallet ? (
          <p className="text-sm text-muted-foreground">Loading wallet…</p>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between rounded-md border border-border/70 p-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Wallet balance</p>
                <p className="mt-1 font-display text-3xl">{formatCurrency(wallet.balance)}</p>
              </div>
              {wallet.frozen ? (
                <Badge variant="outline" className="border-destructive/40 text-destructive">On hold</Badge>
              ) : (
                <Badge variant="outline" className="border-gold/40 text-gold">Active</Badge>
              )}
            </div>
            {wallet.frozen && wallet.frozenReason ? (
              <p className="text-xs text-muted-foreground">Hold reason: {wallet.frozenReason}</p>
            ) : null}

            <div className="space-y-3">
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount (USD)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <Textarea
                placeholder="Reason (shown to the investor)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
              />
              <div className="grid grid-cols-2 gap-2">
                <Button disabled={!valid || adjust.isPending} onClick={() => adjust.mutate("credit")}>
                  Add funds
                </Button>
                <Button
                  variant="outline"
                  disabled={!valid || adjust.isPending || Number(amount) > wallet.balance}
                  onClick={() => adjust.mutate("debit")}
                >
                  Withdraw funds
                </Button>
              </div>
              <Button
                variant={wallet.frozen ? "secondary" : "destructive"}
                className="w-full"
                disabled={hold.isPending}
                onClick={() => hold.mutate(!wallet.frozen)}
              >
                {wallet.frozen ? "Release funds" : "Protect funds (put on hold)"}
              </Button>
              <p className="text-xs text-muted-foreground">
                While on hold, the investor can't withdraw, invest or trade. Deposits still arrive.
              </p>
            </div>

            {(query.data?.recent ?? []).length ? (
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Recent activity</p>
                <ul className="max-h-40 space-y-1 overflow-y-auto text-sm">
                  {(query.data?.recent ?? []).map((t) => (
                    <li key={t.id ?? t._id} className="flex justify-between gap-3 border-b border-border/40 py-1">
                      <span className="truncate text-muted-foreground">
                        {formatDate(t.createdAt)} · {t.description || t.type}
                      </span>
                      <span>{formatCurrency(t.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

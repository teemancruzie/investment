import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { adminService, type DepositNetworkAdmin } from "@/services/admin.service";

export const Route = createFileRoute("/admin/deposit-wallets")({
  component: DepositWallets,
});

function DepositWallets() {
  const query = useQuery({
    queryKey: ["admin", "deposit-addresses"],
    queryFn: () => adminService.depositAddresses(),
    retry: false,
  });

  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-sm text-muted-foreground">
        Change the wallet investors send deposits to, or switch a network off when it's unavailable. Changes apply
        to investors immediately.
      </p>
      {query.isError ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {(query.error as Error).message}
        </p>
      ) : null}
      {query.data?.map((asset) => (
        <section key={asset.symbol} className="rounded-lg border border-border/70 bg-card/40 p-5">
          <h2 className="font-display text-2xl">
            {asset.name} <span className="text-gold">{asset.symbol}</span>
          </h2>
          <div className="mt-4 space-y-4">
            {asset.networks.map((n) => (
              <NetworkRow key={n.id} symbol={asset.symbol} network={n} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function NetworkRow({ symbol, network }: { symbol: string; network: DepositNetworkAdmin }) {
  const [address, setAddress] = useState(network.address);
  const queryClient = useQueryClient();
  const save = useMutation({
    mutationFn: (body: { address?: string; enabled?: boolean }) =>
      adminService.updateDepositAddress({ asset: symbol, network: network.id, ...body }),
    onSuccess: () => {
      toast.success("Deposit wallet updated");
      void queryClient.invalidateQueries({ queryKey: ["admin", "deposit-addresses"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="grid gap-3 border-t border-border/40 pt-4 md:grid-cols-[180px_1fr_auto_auto] md:items-center">
      <div>
        <p className="text-sm">{network.label}</p>
        <p className="text-xs text-muted-foreground">{network.enabled ? "Accepting deposits" : "Unavailable"}</p>
      </div>
      <Input
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Wallet address"
        className="font-mono text-xs"
      />
      <Button
        size="sm"
        disabled={save.isPending || address.trim() === network.address}
        onClick={() => save.mutate({ address: address.trim() })}
      >
        Save
      </Button>
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <Switch checked={network.enabled} onCheckedChange={(enabled) => save.mutate({ enabled })} />
        On
      </label>
    </div>
  );
}

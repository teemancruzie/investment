import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminService } from "@/services/admin.service";
import { investmentService } from "@/services/investment.service";
import { formatCurrency, formatPercent } from "@/lib/format";

export const Route = createFileRoute("/admin/investments")({
  component: AdminInvestments,
});

function AdminInvestments() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["admin", "investments"],
    queryFn: () => investmentService.list({ limit: 50 }),
    placeholderData: keepPreviousData,
    retry: false,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminService.updateInvestment(id, { status }),
    onSuccess: () => {
      toast.success("Deal updated");
      void queryClient.invalidateQueries({ queryKey: ["admin", "investments"] });
      void queryClient.invalidateQueries({ queryKey: ["investments"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const items = query.data?.items ?? [];

  return (
    <div className="space-y-6">
      {query.isError ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {(query.error as Error).message}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-border/70 bg-card/40">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-border/60 text-left text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <tr>
              <th className="px-5 py-4">Deal</th>
              <th className="px-5 py-4">Target</th>
              <th className="px-5 py-4">Funding</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((deal) => {
              const id = deal.id ?? deal._id ?? "";
              return (
                <tr key={id} className="border-b border-border/40 last:border-0">
                  <td className="px-5 py-4">
                    <p className="max-w-xs truncate">{deal.title}</p>
                    <p className="text-xs text-muted-foreground">{deal.location || "—"}</p>
                  </td>
                  <td className="px-5 py-4 text-gold">{formatPercent(deal.expectedAnnualReturn)}</td>
                  <td className="px-5 py-4">
                    {formatCurrency(deal.fundedAmount)} / {formatCurrency(deal.fundingGoal)}
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant="outline" className="border-border/70 capitalize">
                      {deal.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          statusMutation.mutate({ id, status: deal.status === "active" ? "closed" : "active" })
                        }
                      >
                        {deal.status === "active" ? "Close" : "Publish"}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!query.isLoading && items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                  No deals yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

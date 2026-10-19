import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminKeys, adminService } from "@/services/admin.service";
import { formatDate } from "@/lib/format";
import { FundsDialog } from "@/components/admin/FundsDialog";

const searchSchema = z.object({
  search: fallback(z.string(), "").default(""),
  page: fallback(z.number().int(), 1).default(1),
});

export const Route = createFileRoute("/admin/users")({
  validateSearch: zodValidator(searchSchema),
  component: AdminUsers,
});

function AdminUsers() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: adminKeys.users(search),
    queryFn: () => adminService.users(search),
    placeholderData: keepPreviousData,
    retry: false,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "disabled" }) =>
      adminService.setUserStatus(id, status),
    onSuccess: () => {
      toast.success("Investor updated");
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: "user" | "admin" }) => adminService.setUserRole(id, role),
    onSuccess: () => {
      toast.success("Role updated");
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const items = query.data?.items ?? [];
  const meta = query.data?.meta;

  return (
    <div className="space-y-6">
      <Input
        value={search.search}
        onChange={(event) => navigate({ search: { ...search, search: event.target.value, page: 1 } })}
        placeholder="Search by name or email"
        className="max-w-sm"
      />

      {query.isError ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {(query.error as Error).message}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-border/70 bg-card/40">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-border/60 text-left text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <tr>
              <th className="px-5 py-4">Investor</th>
              <th className="px-5 py-4">Joined</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((user) => {
              const id = user.id ?? user._id ?? "";
              return (
                <tr key={id} className="border-b border-border/40 last:border-0">
                  <td className="px-5 py-4">
                    <p>
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{formatDate(user.createdAt)}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="outline"
                        className={user.status === "active" ? "border-emerald-400/40 text-emerald-400" : "border-destructive/40 text-destructive"}
                      >
                        {user.status}
                      </Badge>
                      {user.role === "admin" ? (
                        <Badge variant="outline" className="border-gold/40 text-gold">
                          admin
                        </Badge>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <FundsDialog userId={id} name={`${user.firstName} ${user.lastName}`} />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          statusMutation.mutate({ id, status: user.status === "active" ? "disabled" : "active" })
                        }
                      >
                        {user.status === "active" ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => roleMutation.mutate({ id, role: user.role === "admin" ? "user" : "admin" })}
                      >
                        {user.role === "admin" ? "Revoke admin" : "Make admin"}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!query.isLoading && items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">
                  No investors found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {meta && meta.totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {meta.page} of {meta.totalPages} · {meta.total} investors
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

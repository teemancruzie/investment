import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const title = "Operations Console — Meridian Capital";
const description = "Internal console for approving crypto funding, managing investors and curating deals.";

const ADMIN_NAV = [
  { to: "/admin", label: "Overview", exact: true },
  { to: "/admin/approvals", label: "Funding approvals" },
  { to: "/admin/withdrawals", label: "Withdrawals" },
  { to: "/admin/users", label: "Investors & funds" },
  { to: "/admin/deposit-wallets", label: "Deposit wallets" },
  { to: "/admin/investments", label: "Deals" },
  { to: "/admin/new-deal", label: "New deal" },
  { to: "/admin/content", label: "Content" },
  { to: "/admin/analytics", label: "Analytics" },
] as const;

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-5 pb-24 pt-32 lg:px-8">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Checking your access…</p>
        ) : !isAuthenticated || !isAdmin ? (
          <div className="mx-auto max-w-lg rounded-lg border border-border/70 bg-card/40 p-8 text-center">
            <h1 className="font-display text-3xl">Restricted area</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              The operations console is limited to Meridian administrators.
            </p>
            <Button asChild className="mt-6">
              <Link to={isAuthenticated ? "/dashboard" : "/login"}>
                {isAuthenticated ? "Back to dashboard" : "Sign in"}
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <header className="mb-8">
              <p className="text-xs uppercase tracking-[0.3em] text-gold">Operations</p>
              <h1 className="mt-3 font-display text-4xl md:text-5xl">Console</h1>
            </header>

            <nav className="mb-10 flex flex-wrap gap-2 border-b border-border/60 pb-4">
              {ADMIN_NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  activeOptions={{ exact: Boolean((item as { exact?: boolean }).exact) }}
                  className="rounded-sm border border-border/70 px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  activeProps={{ className: "border-gold text-gold" }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <Outlet />
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

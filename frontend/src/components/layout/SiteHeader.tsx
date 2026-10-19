import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/investments", label: "Browse deals" },
  { to: "/about", label: "About" },
  { to: "/faq", label: "FAQ" },
] as const;

const AUTH_NAV = [
  { to: "/portfolio", label: "Portfolio" },
  { to: "/insights", label: "Insights" },
  { to: "/wallet", label: "Wallet" },
  { to: "/transactions", label: "Transactions" },
  { to: "/settings", label: "Settings" },
] as const;

const ADMIN_NAV = [{ to: "/admin", label: "Console" }] as const;

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const navItems = isAuthenticated
    ? [...NAV, ...AUTH_NAV, ...(user?.role === "admin" ? ADMIN_NAV : [])]
    : [...NAV];

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    setOpen(false);
    void navigate({ to: "/login", replace: true });
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-ink/95 backdrop-blur-md shadow-lift" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-sm bg-gold font-display text-lg text-ink">M</span>
          <span className="font-display text-xl tracking-tight text-ink-foreground">Meridian Capital</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-sm text-ink-foreground/70 transition-colors hover:text-gold"
              activeProps={{ className: "text-gold" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-sm px-4 py-2 text-sm text-ink-foreground/80 transition-colors hover:text-gold"
              >
                Sign out
              </button>
              <Link
                to="/dashboard"
                className="rounded-sm bg-gold px-5 py-2.5 text-sm font-medium text-ink transition-transform hover:scale-[1.03] shadow-gold"
              >
                {user?.firstName ? `${user.firstName}'s dashboard` : "Dashboard"}
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-sm px-4 py-2 text-sm text-ink-foreground/80 transition-colors hover:text-gold"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="rounded-sm bg-gold px-5 py-2.5 text-sm font-medium text-ink transition-transform hover:scale-[1.03] shadow-gold"
              >
                Open account
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="grid size-10 place-items-center rounded-sm hairline text-ink-foreground md:hidden"
        >
          <span className="sr-only">Menu</span>
          <div className="space-y-1.5">
            <span className="block h-px w-5 bg-gold" />
            <span className="block h-px w-5 bg-gold" />
            <span className="block h-px w-5 bg-gold" />
          </div>
        </button>
      </div>

      {open && (
        <div className="border-t border-border/20 bg-ink px-5 pb-6 pt-2 md:hidden">
          <nav className="flex flex-col">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="border-b border-border/10 py-3 text-sm text-ink-foreground/80"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-5 flex gap-3">
            {isAuthenticated ? (
              <>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex-1 rounded-sm hairline py-2.5 text-center text-sm text-ink-foreground"
                >
                  Sign out
                </button>
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-sm bg-gold py-2.5 text-center text-sm font-medium text-ink"
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-sm hairline py-2.5 text-center text-sm text-ink-foreground"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-sm bg-gold py-2.5 text-center text-sm font-medium text-ink"
                >
                  Open account
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

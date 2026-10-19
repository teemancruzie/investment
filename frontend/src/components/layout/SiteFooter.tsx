import { Link } from "@tanstack/react-router";

const COLUMNS = [
  {
    title: "Invest",
    links: [
      { label: "Opportunities", to: "/investments" as const },
      { label: "How it works", to: "/how-it-works" as const },
      { label: "FAQ", to: "/faq" as const },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About us", to: "/about" as const },
      { label: "Contact", to: "/contact" as const },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", to: "/login" as const },
      { label: "Open account", to: "/register" as const },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="surface-ink">
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-sm bg-gold font-display text-lg text-ink">M</span>
              <span className="font-display text-xl text-ink-foreground">Meridian Capital</span>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-ink-foreground/60">
              Institutional-grade private market investments, opened to serious individual investors
              with full transparency on risk, fees and performance.
            </p>
            <div className="mt-6 gold-rule w-24" />
            <p className="mt-6 text-xs leading-relaxed text-ink-foreground/45">
              Capital at risk. Past performance is not a reliable indicator of future results.
              Investments in private markets are illiquid and may lose value.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-gold">{col.title}</h3>
              <ul className="mt-5 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-ink-foreground/65 transition-colors hover:text-gold"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-ink-foreground/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-foreground/45">
            © {new Date().getFullYear()} Meridian Capital. All rights reserved.
          </p>
          <p className="text-xs text-ink-foreground/45">Registered investment platform · ISO 27001 certified</p>
        </div>
      </div>
    </footer>
  );
}

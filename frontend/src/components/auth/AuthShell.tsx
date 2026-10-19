import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const MARKS = [
  "Bank-grade custody & segregated client accounts",
  "Every opportunity screened by our investment committee",
  "Transparent fees — no hidden performance drag",
];

/** Split-screen shell used by every authentication page. */
export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden flex-col justify-between surface-ink px-12 py-14 lg:flex">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-sm bg-gold font-display text-lg text-ink">
            M
          </span>
          <span className="font-display text-xl tracking-tight text-ink-foreground">
            Meridian Capital
          </span>
        </Link>

        <div className="max-w-md">
          <div className="gold-rule w-16" />
          <p className="mt-8 font-display text-4xl leading-tight text-ink-foreground">
            Private markets, opened to the disciplined investor.
          </p>
          <ul className="mt-10 space-y-4">
            {MARKS.map((mark) => (
              <li key={mark} className="flex gap-3 text-sm text-ink-foreground/70">
                <span className="mt-2 block size-1.5 shrink-0 rounded-full bg-gold" />
                {mark}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs uppercase tracking-[0.2em] text-ink-foreground/40">
          Capital at risk · Regulated partners
        </p>
      </aside>

      <main className="flex flex-col justify-center px-5 py-14 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <Link to="/" className="mb-10 flex items-center gap-2.5 lg:hidden">
            <span className="grid size-8 place-items-center rounded-sm bg-gold font-display text-base text-ink">
              M
            </span>
            <span className="font-display text-lg tracking-tight">Meridian Capital</span>
          </Link>

          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</p>
          <h1 className="mt-3 text-3xl leading-tight lg:text-4xl">{title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>

          <div className="mt-9">{children}</div>

          {footer ? <div className="mt-8 text-sm text-muted-foreground">{footer}</div> : null}
        </div>
      </main>
    </div>
  );
}

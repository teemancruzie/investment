import { Link } from "@tanstack/react-router";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

/** Shared shell for public pages still being built out. */
export function ComingSoonPage({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center px-5 py-40 lg:px-8">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</p>
        <h1 className="mt-4 text-4xl leading-tight lg:text-5xl">{title}</h1>
        <p className="mt-6 text-base leading-relaxed text-muted-foreground">{description}</p>
        <div className="mt-10 gold-rule w-24" />
        <Link to="/" className="mt-10 w-fit text-sm font-medium text-foreground hover:text-gold">
          ← Back home
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}

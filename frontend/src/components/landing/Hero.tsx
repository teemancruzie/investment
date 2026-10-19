import { Link } from "@tanstack/react-router";
import heroImage from "@/assets/hero-investment.jpg";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-ink">
      <img
        src={heroImage}
        alt="Abstract gold market curves rising over a dark navy landscape"
        width={1920}
        height={1280}
        className="absolute inset-0 size-full object-cover opacity-70"
      />
      <div
        className="absolute inset-0"
        style={{ backgroundImage: "var(--gradient-veil)" }}
        aria-hidden="true"
      />

      <div className="relative mx-auto flex min-h-[92vh] max-w-7xl flex-col justify-center px-5 pb-24 pt-36 lg:px-8">
        <p className="reveal inline-flex w-fit items-center gap-2 rounded-full hairline px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-gold">
          <span className="size-1.5 rounded-full bg-gold" />
          Private markets, opened
        </p>

        <h1 className="reveal reveal-delay-1 mt-8 max-w-3xl text-5xl leading-[1.05] text-ink-foreground sm:text-6xl lg:text-7xl">
          Own a share of the assets that <span className="text-gradient-gold">compound quietly</span>.
        </h1>

        <p className="reveal reveal-delay-2 mt-7 max-w-xl text-base leading-relaxed text-ink-foreground/70 sm:text-lg">
          Real estate, private credit, renewable infrastructure and growth equity — underwritten by an
          institutional team, priced transparently, and tracked in one portfolio.
        </p>

        <div className="reveal reveal-delay-3 mt-10 flex flex-wrap gap-4">
          <Link
            to="/register"
            className="rounded-sm bg-gold px-7 py-3.5 text-sm font-medium text-ink shadow-gold transition-transform hover:scale-[1.03]"
          >
            Start investing
          </Link>
          <Link
            to="/investments"
            className="rounded-sm hairline px-7 py-3.5 text-sm font-medium text-ink-foreground transition-colors hover:bg-ink-foreground/5"
          >
            Browse opportunities
          </Link>
        </div>

        <dl className="reveal reveal-delay-4 mt-16 grid max-w-2xl grid-cols-2 gap-8 border-t border-ink-foreground/10 pt-8 sm:grid-cols-4">
          {[
            ["9.2–14.6%", "Target annual return"],
            ["$1,000", "Minimum entry"],
            ["4", "Asset classes"],
            ["0.9%", "Flat platform fee"],
          ].map(([value, label]) => (
            <div key={label}>
              <dt className="font-display text-2xl text-gold">{value}</dt>
              <dd className="mt-1 text-xs uppercase tracking-[0.14em] text-ink-foreground/50">{label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

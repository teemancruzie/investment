import { Link } from "@tanstack/react-router";

const CATEGORIES = [
  {
    name: "Real Estate",
    range: "8 – 12% target",
    copy: "Income-producing residential and logistics assets in supply-constrained markets.",
    risk: "Lower risk",
  },
  {
    name: "Private Credit",
    range: "9 – 11% target",
    copy: "Senior secured loans to profitable mid-market operators, quarterly distributions.",
    risk: "Moderate risk",
  },
  {
    name: "Renewable Energy",
    range: "12 – 15% target",
    copy: "Solar, wind and grid storage infrastructure with contracted revenue floors.",
    risk: "Higher risk",
  },
  {
    name: "Venture Growth",
    range: "18%+ target",
    copy: "Late-stage technology companies with proven revenue and a clear path to liquidity.",
    risk: "Highest risk",
  },
];

export function Categories() {
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Where your capital goes</p>
          <h2 className="mt-4 text-4xl leading-tight lg:text-5xl">Four asset classes, one account</h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            Diversify across uncorrelated private markets without four separate managers, four sets of
            paperwork, or four reporting formats.
          </p>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-md bg-border sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              to="/investments"
              className="group flex flex-col bg-card p-8 transition-colors hover:bg-surface"
            >
              <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{cat.risk}</span>
              <h3 className="mt-4 text-2xl">{cat.name}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{cat.copy}</p>
              <span className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-foreground">
                {cat.range}
                <span className="text-gold transition-transform group-hover:translate-x-1">→</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    step: "01",
    title: "Open your account",
    copy: "Register in two minutes, verify your identity, and fund your wallet by transfer.",
  },
  {
    step: "02",
    title: "Review the diligence",
    copy: "Every opportunity ships with underwriting notes, downside cases and fee disclosure.",
  },
  {
    step: "03",
    title: "Allocate in units",
    copy: "Commit from $1,000 and hold fractional units across as many deals as you like.",
  },
  {
    step: "04",
    title: "Track and reinvest",
    copy: "Distributions land in your wallet. Withdraw, or roll them into the next allocation.",
  },
];

export function HowItWorks() {
  return (
    <section className="surface-ink py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.2em] text-gold">How it works</p>
            <h2 className="mt-4 text-4xl leading-tight text-ink-foreground lg:text-5xl">
              From signup to first distribution
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-ink-foreground/60">
            No brokers, no minimum lock-in negotiations, no paper subscription documents.
          </p>
        </div>

        <ol className="mt-16 grid gap-px overflow-hidden rounded-md bg-ink-foreground/10 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((item) => (
            <li key={item.step} className="bg-ink p-8">
              <span className="font-display text-5xl text-gold/35">{item.step}</span>
              <h3 className="mt-6 text-xl text-ink-foreground">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-foreground/60">{item.copy}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

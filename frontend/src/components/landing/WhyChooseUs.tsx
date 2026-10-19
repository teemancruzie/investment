const REASONS = [
  {
    title: "Institutional underwriting",
    copy: "Every deal passes a three-stage credit and asset committee before it reaches the platform. Roughly 4% of submissions are listed.",
  },
  {
    title: "One flat fee",
    copy: "0.9% annually on invested capital. No entry fee, no exit fee, no performance carry hidden in the waterfall.",
  },
  {
    title: "Segregated custody",
    copy: "Client funds sit with a regulated custodian, separated from platform balance sheet at all times.",
  },
  {
    title: "Reporting you can audit",
    copy: "Position-level statements, cash-flow schedules and downloadable tax summaries, updated as events happen.",
  },
];

export function WhyChooseUs() {
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto grid max-w-7xl gap-16 px-5 lg:grid-cols-2 lg:px-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Why Meridian</p>
          <h2 className="mt-4 text-4xl leading-tight lg:text-5xl">
            Built by people who ran the deals, not just the app
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
            Our investment team spent two decades allocating institutional capital. The platform exists
            to give that discipline to individual investors without diluting it.
          </p>
          <div className="mt-10 gold-rule w-32" />
          <dl className="mt-10 grid grid-cols-2 gap-8">
            <div>
              <dt className="font-display text-3xl">18 yrs</dt>
              <dd className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">Average team tenure</dd>
            </div>
            <div>
              <dt className="font-display text-3xl">0 losses</dt>
              <dd className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">On senior credit to date</dd>
            </div>
          </dl>
        </div>

        <ul className="grid gap-px self-start overflow-hidden rounded-md bg-border">
          {REASONS.map((reason) => (
            <li key={reason.title} className="bg-card p-8">
              <h3 className="text-xl">{reason.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{reason.copy}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

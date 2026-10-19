const TESTIMONIALS = [
  {
    quote:
      "The reporting is the clearest I have seen from any platform. I can reconcile every distribution to the underlying asset in about a minute.",
    name: "linda McCarthy",
    role: "Private investor, Texas",
  },
  {
    quote:
      "Diligence packs are institutional grade and genuinely readable. That combination basically does not exist elsewhere at this ticket size.",
    name: "Daniel Reyes",
    role: "Family office analyst, Madrid",
  },
  {
    quote:
      "Allocating across four asset classes used to take weeks of paperwork. It now takes an afternoon and one account.",
    name: "Helena Brandt",
    role: "Founder, Washington, D.C.",
  },
  {
    quote:
      "I can see exactly how my money is performing and where it is allocated. I have a lot more confidence in my investments now.",
    name: "Markus Lindberg",
    role: "Private investor, california",
  },
  {
    quote:
      "Thanks to the platform, I can now invest in opportunities that were previously only available to institutional investors.",
    name: "John Williams",
    role: "Private investor, West Virginia",
  },
  {
    quote:
      "The platform has made it easy for me to diversify my portfolio and access high-quality investment opportunities that I wouldn't have been able to find on my own.",
    name: "Paul Brown",
    role: "Private investor, wisconsin",
  },
  {
    quote:
      "I appreciate the transparency and communication from the platform. I always know where my money is and how it's performing.",
    name: "Fiona Chen",
    role: "Private investor, china",
  },
];

export function Testimonials() {
  return (
    <section className="bg-surface py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Investor voices</p>
          <h2 className="mt-4 text-4xl leading-tight lg:text-5xl">What allocators tell us</h2>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {TESTIMONIALS.map((item) => (
            <figure key={item.name} className="flex flex-col rounded-md bg-card p-8 shadow-soft">
              <div className="flex gap-1 text-gold" aria-label="5 out of 5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} aria-hidden="true">
                    ★
                  </span>
                ))}
              </div>
              <blockquote className="mt-6 flex-1 font-display text-lg leading-relaxed text-foreground">
                “{item.quote}”
              </blockquote>
              <figcaption className="mt-8 border-t border-border pt-5">
                <span className="block text-sm font-medium text-foreground">{item.name}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{item.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

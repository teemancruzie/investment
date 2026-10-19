import { useState } from "react";

const FAQS = [
  {
    q: "What is the minimum investment?",
    a: "Minimums are set per opportunity and start at $1,000. Most real estate and credit deals sit between $1,000 and $5,000.",
  },
  {
    q: "How and when are returns paid?",
    a: "Distributions are credited to your platform wallet on each deal's schedule — monthly, quarterly or at maturity. You can withdraw or reinvest immediately.",
  },
  {
    q: "Can I exit an investment early?",
    a: "Positions are held to maturity because the underlying assets are illiquid. Uninvested wallet balances can be withdrawn at any time.",
  },
  {
    q: "What fees do you charge?",
    a: "A single 0.9% annual platform fee on invested capital. There is no entry fee, exit fee or performance carry.",
  },
  {
    q: "How is my money protected?",
    a: "Client funds are held by a regulated custodian and segregated from Meridian's own balance sheet. Assets are held in ring-fenced special purpose vehicles.",
  },
  {
    q: "Who can invest?",
    a: "Anyone over 18 who passes identity and source-of-funds checks in a supported jurisdiction. Some deals are restricted to qualified investors.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto grid max-w-7xl gap-14 px-5 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Questions</p>
          <h2 className="mt-4 text-4xl leading-tight lg:text-5xl">Before you commit capital</h2>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
            Everything else is covered in each opportunity's diligence pack, or by our investor relations
            team within one business day.
          </p>
        </div>

        <div className="divide-y divide-border border-y border-border">
          {FAQS.map((item, index) => {
            const isOpen = open === index;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-6 py-6 text-left"
                >
                  <span className="font-display text-lg text-foreground">{item.q}</span>
                  <span
                    className={`shrink-0 text-gold transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}
                    aria-hidden="true"
                  >
                    +
                  </span>
                </button>
                <div
                  className={`grid transition-all duration-300 ${isOpen ? "grid-rows-[1fr] pb-6" : "grid-rows-[0fr]"}`}
                >
                  <p className="overflow-hidden text-sm leading-relaxed text-muted-foreground">{item.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

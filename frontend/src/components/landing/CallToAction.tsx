import { Link } from "@tanstack/react-router";

export function CallToAction() {
  return (
    <section className="px-5 pb-24 lg:px-8 lg:pb-32">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-lg surface-ink px-8 py-16 shadow-lift lg:px-16 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
          <div>
            <h2 className="max-w-xl text-4xl leading-tight text-ink-foreground lg:text-5xl">
              Your next allocation is <span className="text-gradient-gold">two minutes away</span>
            </h2>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-ink-foreground/65">
              Open an account, review the current opportunities, and commit only when the numbers
              convince you. No fees until capital is deployed.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link
              to="/register"
              className="rounded-sm bg-gold px-7 py-3.5 text-center text-sm font-medium text-ink shadow-gold transition-transform hover:scale-[1.03]"
            >
              Open your account
            </Link>
            <Link
              to="/contact"
              className="rounded-sm hairline px-7 py-3.5 text-center text-sm font-medium text-ink-foreground transition-colors hover:bg-ink-foreground/5"
            >
              Talk to our team
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

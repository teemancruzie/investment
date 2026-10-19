import { DEMO_MODE } from "./install";

/** Thin notice so nobody mistakes the demo data for real money. */
export function DemoBanner() {
  if (!DEMO_MODE) return null;
  const reset = async () => {
    const { resetDemoData } = await import("./mockApi");
    resetDemoData();
    window.localStorage.removeItem("meridian.accessToken");
    window.localStorage.removeItem("meridian.refreshToken");
    window.location.href = "/login";
  };
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gold/40 bg-card/95 px-4 py-1.5 backdrop-blur text-center text-xs text-foreground">
      Demo mode — sample data saved in this browser only. Investor: demo@meridian.local / Demo12345 · Admin:
      admin@investment.local / Admin1234 ·{" "}
      <button type="button" onClick={reset} className="font-medium text-gold underline underline-offset-2">
        Reset demo data
      </button>
    </div>
  );
}

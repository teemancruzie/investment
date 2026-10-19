import { createFileRoute } from "@tanstack/react-router";
import { fetchChart, fetchQuotes, searchSymbols } from "@/lib/market/yahoo.server";

const SYMBOL = /^[A-Za-z0-9.\-=^]{1,15}$/;

/** Live market data: ?symbols=A,B | ?chart=SYM&range=1mo | ?search=apple */
export const Route = createFileRoute("/api/market")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const headers = { "Cache-Control": "public, max-age=15" };
        try {
          const search = url.searchParams.get("search");
          if (search !== null) {
            const q = search.trim().slice(0, 40);
            return Response.json({ results: q ? await searchSymbols(q) : [] }, { headers });
          }
          const chart = url.searchParams.get("chart");
          if (chart !== null) {
            if (!SYMBOL.test(chart)) return Response.json({ error: "Invalid symbol" }, { status: 400 });
            const data = await fetchChart(chart, url.searchParams.get("range") ?? "1mo");
            if (!data) return Response.json({ error: "No data for this symbol" }, { status: 404 });
            return Response.json(data, { headers });
          }
          const symbols = (url.searchParams.get("symbols") ?? "").split(",").filter((s) => SYMBOL.test(s));
          return Response.json({ quotes: await fetchQuotes(symbols) }, { headers });
        } catch (error) {
          console.error("market route failed", error);
          return Response.json({ error: "Market data is unavailable right now" }, { status: 502 });
        }
      },
    },
  },
});

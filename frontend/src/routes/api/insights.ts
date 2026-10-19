import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/ai/run-id.server";

const MODEL = "openai/gpt-6-astra";
const GATEWAY = "https://ai.gateway.lovable.dev/v1";

/** Pulls the investor's real data from the Express API using their own session token. */
async function loadHoldings(apiUrl: string, auth: string) {
  const get = async (path: string) => {
    const res = await fetch(`${apiUrl}${path}`, { headers: { Authorization: auth } });
    const body = (await res.json().catch(() => null)) as { success?: boolean; data?: unknown; message?: string } | null;
    if (!res.ok || !body?.success) {
      const err = new Error(body?.message ?? `API request failed (${res.status})`) as Error & { status: number };
      err.status = res.status === 401 ? 401 : 502;
      throw err;
    }
    return body.data;
  };
  const [dashboard, positions, wallet] = await Promise.all([
    get("/dashboard"),
    get("/investments/mine/list?limit=50").catch(() => null),
    get("/wallet").catch(() => null),
  ]);
  return { dashboard, positions, wallet };
}

function json(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/insights")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return json(500, "The insights assistant is not configured.");

        const auth = request.headers.get("authorization");
        if (!auth?.startsWith("Bearer ")) return json(401, "Please sign in to use insights.");

        const body = (await request.json().catch(() => null)) as
          | { messages?: UIMessage[]; demoHoldings?: unknown }
          | null;
        if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
          return json(400, "No question was sent.");
        }
        const messages = body.messages.slice(-30);

        const apiUrl =
          process.env["API_URL"] ?? process.env["VITE_API_URL"] ?? "http://localhost:5000/api";
        const demo = String(import.meta.env["VITE_DEMO_MODE"]) === "true" && auth.startsWith("Bearer demo.");
        let holdings: unknown = demo ? body.demoHoldings : undefined;
        if (demo && !holdings) return json(401, "Your session has expired. Please sign in again.");
        if (!demo) try {
          holdings = await loadHoldings(apiUrl.replace(/\/+$/, ""), auth);
        } catch (error) {
          const e = error as Error & { status?: number };
          if (e.status === 401) return json(401, "Your session has expired. Please sign in again.");
          return json(502, "We couldn't load your portfolio data right now. Please try again shortly.");
        }

        const system = `You are Meridian's portfolio analyst, helping one investor understand their own holdings on the Meridian Capital platform.
Ground every statement in the JSON data below. Quote exact figures (USD) from it. If the data doesn't contain something, say so plainly — never invent holdings, prices, or returns.
Be concise, use short markdown sections or bullets. Offer practical observations (concentration, maturity dates, idle wallet cash, risk mix, projected vs earned returns).
You provide educational insights, not personalised financial advice; add a one-line reminder of that only when recommending an action.
Today is ${new Date().toISOString().slice(0, 10)}.

INVESTOR DATA:
${JSON.stringify(holdings).slice(0, 60_000)}`;

        const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
        const provider = createOpenAI({
          baseURL: GATEWAY,
          apiKey,
          headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
          fetch: runIdFetch.fetch,
        });

        const result = streamText({
          model: provider.responses(MODEL),
          system,
          messages: await convertToModelMessages(messages),
          abortSignal: request.signal,
          providerOptions: {
            openai: {
              forceReasoning: true,
              reasoningEffort: "medium",
              reasoningSummary: "auto",
              store: false,
              include: ["reasoning.encrypted_content"],
            },
          },
        });

        return withLovableAiGatewayRunIdHeader(
          result.toUIMessageStreamResponse({
            originalMessages: messages,
            sendReasoning: true,
            onError: (error) => {
              const status = (error as { statusCode?: number })?.statusCode;
              if (status === 429) return "Too many requests right now — please wait a moment and try again.";
              if (status === 402) return "AI credits have run out for this workspace.";
              if (status === 403) return "The assistant isn't available for this request.";
              return "The assistant couldn't finish that answer. Please try again.";
            },
          }),
          runIdFetch,
        );
      },
    },
  },
});

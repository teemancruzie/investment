import { createFileRoute, Link } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { LineChart } from "lucide-react";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { tokenStore } from "@/services/api";
import { DEMO_MODE } from "@/demo/install";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";

const title = "Portfolio Insights — Meridian Capital";
const description = "Ask questions about your holdings and get insights grounded in your own portfolio data.";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InsightsPage,
});

const SUGGESTIONS = [
  "How is my portfolio performing overall?",
  "Which positions mature soonest?",
  "Am I too concentrated in one sector?",
  "How much idle cash is sitting in my wallet?",
];

function InsightsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  return (
    <div className="flex h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden px-5 pb-6 pt-28">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading your account…</p>
        ) : !isAuthenticated ? (
          <div className="mx-auto mt-10 max-w-lg rounded-lg border border-border/70 bg-card/40 p-8 text-center">
            <h1 className="font-display text-3xl">Sign in required</h1>
            <p className="mt-3 text-sm text-muted-foreground">Insights are based on your own holdings.</p>
            <Button asChild className="mt-6">
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
        ) : (
          <Chat />
        )}
      </main>
    </div>
  );
}

function Chat() {
  const [input, setInput] = useState("");
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/insights",
        headers: (): Record<string, string> => {
          const token = tokenStore.access;
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
        // Demo mode has no real server, so the browser sends its own sample holdings.
        prepareSendMessagesRequest: async ({ messages, body, headers }) => {
          if (!DEMO_MODE) return { ...(headers ? { headers } : {}), body: { ...body, messages } };
          const { demoHoldings } = await import("@/demo/mockApi");
          return { ...(headers ? { headers } : {}), body: { ...body, messages, demoHoldings: await demoHoldings(tokenStore.access) } };
        },
      }),
    [],
  );
  const { messages, sendMessage, status, stop, setMessages } = useChat({
    transport,
    onError: (error) => {
      let msg = error.message;
      try {
        msg = (JSON.parse(error.message) as { error?: string }).error ?? msg;
      } catch {
        /* plain message */
      }
      toast.error(msg || "Something went wrong.");
    },
  });
  const busy = status === "submitted" || status === "streaming";

  const ask = (text: string) => {
    if (!text.trim() || busy) return;
    void sendMessage({ text: text.trim() });
    setInput("");
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <header className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-full border border-gold/50 bg-gold/10 text-gold">
            <LineChart className="size-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl">Portfolio insights</h1>
            <p className="text-xs text-muted-foreground">Answers use your live holdings. Educational, not financial advice.</p>
          </div>
        </div>
        {messages.length > 0 ? (
          <Button variant="outline" size="sm" onClick={() => setMessages([])} disabled={busy}>
            New conversation
          </Button>
        ) : null}
      </header>

      <Conversation className="flex-1">
        <ConversationContent>
          {messages.length === 0 ? (
            <div className="mt-10 text-center">
              <p className="font-display text-3xl">What would you like to know?</p>
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => ask(s)}
                    className="rounded-md border border-border/70 bg-card/40 px-4 py-3 text-left text-sm hover:border-gold/60"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {messages.map((m) => (
            <Message key={m.id} from={m.role}>
              <MessageContent
                className={
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-transparent px-0 text-foreground"
                }
              >
                {m.parts.map((part, i) =>
                  part.type === "text" ? (
                    m.role === "assistant" ? (
                      <MessageResponse key={i}>{part.text}</MessageResponse>
                    ) : (
                      <p key={i} className="whitespace-pre-wrap">{part.text}</p>
                    )
                  ) : null,
                )}
              </MessageContent>
            </Message>
          ))}
          {status === "submitted" ? <Shimmer>Reviewing your portfolio…</Shimmer> : null}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <PromptInput className="mt-3" onSubmit={(msg) => ask(msg.text ?? input)}>
        <PromptInputTextarea
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your holdings, returns, or wallet…"
        />
        <PromptInputFooter className="justify-end">
          <PromptInputSubmit status={status} disabled={!busy && !input.trim()} onStop={stop} />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}

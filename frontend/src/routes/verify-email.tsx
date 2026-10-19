import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { AuthShell } from "@/components/auth/AuthShell";
import { authService } from "@/services/auth.service";

const title = "Verify Your Email — Meridian Capital";
const description = "Confirm your email address to activate your Meridian Capital account.";

const searchSchema = z.object({ token: z.string().optional() });

export const Route = createFileRoute("/verify-email")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { token } = Route.useSearch();
  const [state, setState] = useState<"idle" | "pending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return;
    let active = true;
    setState("pending");
    authService
      .verifyEmail(token)
      .then(() => active && setState("done"))
      .catch((error: unknown) => {
        if (!active) return;
        setMessage(error instanceof Error ? error.message : "Verification failed");
        setState("error");
      });
    return () => {
      active = false;
    };
  }, [token]);

  const body = () => {
    if (!token)
      return "Open the verification link from your inbox to confirm your email address. You can also resend it from your dashboard settings.";
    if (state === "pending") return "Verifying your email…";
    if (state === "done")
      return "Your email is verified. You now have full access to funding and withdrawals.";
    if (state === "error") return message;
    return "";
  };

  return (
    <AuthShell
      eyebrow="Security"
      title={state === "done" ? "Email verified" : "Verify your email"}
      subtitle="Verification protects withdrawals and keeps your statements private."
      footer={
        <Link to="/login" className="font-medium text-foreground hover:text-gold">
          Continue to sign in →
        </Link>
      }
    >
      <div className="rounded-sm hairline bg-card p-6 text-sm leading-relaxed text-muted-foreground">
        {body()}
      </div>
    </AuthShell>
  );
}

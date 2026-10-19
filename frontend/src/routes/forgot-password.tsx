import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { SubmitButton, TextField } from "@/components/auth/fields";
import { authService } from "@/services/auth.service";

const title = "Reset Your Password — Meridian Capital";
const description = "Request a secure password reset link for your Meridian Capital account.";

const schema = z.object({ email: z.string().trim().email("Enter a valid email address").max(255) });
type Values = z.infer<typeof schema>;

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  const onSubmit = handleSubmit(async ({ email }) => {
    try {
      await authService.forgotPassword(email);
      setSent(true);
      toast.success("If that email exists, a reset link is on its way");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send the reset link");
    }
  });

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Reset your password"
      subtitle="Enter the email on your account and we'll send a secure, single-use link."
      footer={
        <Link to="/login" className="font-medium text-foreground hover:text-gold">
          ← Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div className="rounded-sm hairline bg-card p-6">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Check your inbox. The link expires in 30 minutes — if it doesn't arrive, check spam or
            try again.
          </p>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="mt-4 text-sm font-medium text-foreground hover:text-gold"
          >
            Use a different email
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...(errors.email?.message ? { error: errors.email.message } : {})}
            {...register("email")}
          />
          <SubmitButton pending={isSubmitting}>Send reset link</SubmitButton>
        </form>
      )}
    </AuthShell>
  );
}

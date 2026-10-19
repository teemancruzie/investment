import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordField, SubmitButton } from "@/components/auth/fields";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/auth.service";

const title = "Set a New Password — Meridian Capital";
const description = "Choose a new password for your Meridian Capital account.";

const searchSchema = z.object({ token: z.string().optional() });

const schema = z
  .object({
    password: z
      .string()
      .min(8, "At least 8 characters")
      .max(128)
      .regex(/[a-z]/, "Include a lowercase letter")
      .regex(/[A-Z]/, "Include an uppercase letter")
      .regex(/[0-9]/, "Include a number"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type Values = z.infer<typeof schema>;

export const Route = createFileRoute("/reset-password")({
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
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async ({ password }) => {
    if (!token) return;
    try {
      const user = await authService.resetPassword({ token, password });
      setUser(user);
      toast.success("Password updated");
      void navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to reset your password");
    }
  });

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Set a new password"
      subtitle="Choose something long and unique — you'll be signed in straight after."
      footer={
        <Link to="/login" className="font-medium text-foreground hover:text-gold">
          ← Back to sign in
        </Link>
      }
    >
      {!token ? (
        <div className="rounded-sm hairline bg-card p-6 text-sm leading-relaxed text-muted-foreground">
          This reset link is missing its token. Request a new one from the{" "}
          <Link to="/forgot-password" className="font-medium text-foreground hover:text-gold">
            forgot password
          </Link>{" "}
          page.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <PasswordField
            label="New password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            {...(errors.password?.message ? { error: errors.password.message } : {})}
            {...register("password")}
          />
          <PasswordField
            label="Confirm password"
            autoComplete="new-password"
            placeholder="Repeat your password"
            {...(errors.confirmPassword?.message ? { error: errors.confirmPassword.message } : {})}
            {...register("confirmPassword")}
          />
          <SubmitButton pending={isSubmitting}>Update password</SubmitButton>
        </form>
      )}
    </AuthShell>
  );
}

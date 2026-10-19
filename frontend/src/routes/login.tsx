import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordField, SubmitButton, TextField } from "@/components/auth/fields";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/auth.service";

const title = "Sign In — Meridian Capital";
const description = "Access your Meridian Capital portfolio, wallet and investment statements.";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(1, "Password is required").max(128),
});

type Values = z.infer<typeof schema>;

export const Route = createFileRoute("/login")({
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
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const user = await authService.login(values);
      setUser(user);
      toast.success(`Welcome back, ${user.firstName}`);
      void navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to sign in");
    }
  });

  return (
    <AuthShell
      eyebrow="Client access"
      title="Sign in to your account"
      subtitle="Review your portfolio, fund your wallet and track distributions."
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/register" className="font-medium text-foreground hover:text-gold">
            Open one in minutes
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          {...(errors.email?.message ? { error: errors.email.message } : {})}
          {...register("email")}
        />
        <PasswordField
          label="Password"
          autoComplete="current-password"
          placeholder="••••••••"
          {...(errors.password?.message ? { error: errors.password.message } : {})}
          {...register("password")}
        />
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-gold">
            Forgot your password?
          </Link>
        </div>
        <SubmitButton pending={isSubmitting}>Sign in</SubmitButton>
      </form>
    </AuthShell>
  );
}

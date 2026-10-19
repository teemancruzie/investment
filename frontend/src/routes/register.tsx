import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordField, SubmitButton, TextField } from "@/components/auth/fields";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/auth.service";

const title = "Open an Account — Meridian Capital";
const description =
  "Create your Meridian Capital account and start investing in private markets from $1,000.";

const schema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required").max(60),
    lastName: z.string().trim().min(1, "Last name is required").max(60),
    email: z.string().trim().email("Enter a valid email address").max(255),
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

export const Route = createFileRoute("/register")({
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
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async ({ confirmPassword: _ignored, ...values }) => {
    try {
      const user = await authService.register(values);
      setUser(user);
      toast.success("Account created — check your inbox to verify your email");
      void navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create your account");
    }
  });

  return (
    <AuthShell
      eyebrow="New investor"
      title="Open your account"
      subtitle="Two minutes to register. Verification and funding follow inside your dashboard."
      footer={
        <>
          Already a client?{" "}
          <Link to="/login" className="font-medium text-foreground hover:text-gold">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="First name"
            autoComplete="given-name"
            placeholder="John"
            {...(errors.firstName?.message ? { error: errors.firstName.message } : {})}
            {...register("firstName")}
          />
          <TextField
            label="Last name"
            autoComplete="family-name"
            placeholder="Doe"
            {...(errors.lastName?.message ? { error: errors.lastName.message } : {})}
            {...register("lastName")}
          />
        </div>
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
        <SubmitButton pending={isSubmitting}>Create account</SubmitButton>
        <p className="text-xs leading-relaxed text-muted-foreground">
          By continuing you agree to our terms and acknowledge that capital is at risk.
        </p>
      </form>
    </AuthShell>
  );
}

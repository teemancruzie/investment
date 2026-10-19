import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/context/AuthContext";
import { userService } from "@/services/user.service";
import { API_URL } from "@/services/api";
import { formatDate } from "@/lib/format";

const title = "Profile & Settings — Meridian Capital";
const description = "Update your investor profile, avatar, password and notification preferences.";

export const Route = createFileRoute("/settings")({
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
  component: SettingsPage,
});

const profileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(60),
  lastName: z.string().trim().min(1, "Last name is required").max(60),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  country: z.string().trim().max(60).optional().or(z.literal("")),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(8, "Enter your current password"),
    newPassword: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your new password"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type ProfileValues = z.infer<typeof profileSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

/** Uploaded avatars are served from the API host, not the Vite dev server. */
function avatarSrc(path: string | undefined) {
  if (!path) return "";
  if (/^(https?:|data:)/.test(path)) return path;
  return `${API_URL.replace(/\/api$/, "")}${path}`;
}

function SettingsPage() {
  const { user, isAuthenticated, isLoading, refresh } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-5 pb-24 pt-32 lg:px-8">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading your profile…</p>
        ) : !isAuthenticated || !user ? (
          <div className="mx-auto max-w-lg rounded-lg border border-border/70 bg-card/40 p-8 text-center">
            <h1 className="font-display text-3xl">Sign in required</h1>
            <Button asChild className="mt-6">
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
        ) : (
          <>
            <header className="mb-10">
              <p className="text-xs uppercase tracking-[0.3em] text-gold">Account</p>
              <h1 className="mt-3 font-display text-4xl md:text-5xl">Profile & settings</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Member since {formatDate(user.createdAt)} ·{" "}
                {user.isEmailVerified ? "Email verified" : "Email not verified"}
              </p>
            </header>

            <div className="space-y-8">
              <AvatarCard onDone={refresh} />
              <ProfileCard onDone={refresh} />
              <PasswordCard />
              <SecurityCard onDone={refresh} />
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function Section({ title: heading, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border/70 bg-card/40 p-6">
      <h2 className="font-display text-2xl">{heading}</h2>
      {hint ? <p className="mt-1 text-sm text-muted-foreground">{hint}</p> : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function AvatarCard({ onDone }: { onDone: () => Promise<void> }) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>("");

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const { url } = await userService.uploadAvatar(file);
      await userService.updateProfile({ avatar: url });
      return url;
    },
    onSuccess: async () => {
      toast.success("Avatar updated");
      await onDone();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const src = preview || avatarSrc(user?.avatar);
  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <Section title="Avatar" hint="JPG or PNG, up to 5MB.">
      <div className="flex flex-wrap items-center gap-5">
        <div className="grid size-20 place-items-center overflow-hidden rounded-full border border-border/70 bg-muted/20 font-display text-2xl">
          {src ? <img src={src} alt="Your avatar" className="size-full object-cover" /> : initials || "—"}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            setPreview(URL.createObjectURL(file));
            upload.mutate(file);
          }}
        />
        <Button variant="outline" disabled={upload.isPending} onClick={() => inputRef.current?.click()}>
          {upload.isPending ? "Uploading…" : "Upload new photo"}
        </Button>
      </div>
    </Section>
  );
}

function ProfileCard({ onDone }: { onDone: () => Promise<void> }) {
  const { user } = useAuth();
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      phone: user?.phone ?? "",
      country: user?.country ?? "",
    },
  });

  useEffect(() => {
    if (!user) return;
    form.reset({
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      phone: user.phone ?? "",
      country: user.country ?? "",
    });
  }, [user, form]);

  const mutation = useMutation({
    mutationFn: (values: ProfileValues) =>
      userService.updateProfile({
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone ?? "",
        country: values.country ?? "",
      }),
    onSuccess: async () => {
      toast.success("Profile saved");
      await onDone();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Section title="Personal details">
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <Field label="First name" error={form.formState.errors.firstName?.message}>
          <Input {...form.register("firstName")} />
        </Field>
        <Field label="Last name" error={form.formState.errors.lastName?.message}>
          <Input {...form.register("lastName")} />
        </Field>
        <Field label="Phone" error={form.formState.errors.phone?.message}>
          <Input {...form.register("phone")} placeholder="+1 555 000 0000" />
        </Field>
        <Field label="Country" error={form.formState.errors.country?.message}>
          <Input {...form.register("country")} placeholder="United States" />
        </Field>
        <Field label="Email">
          <Input value={user?.email ?? ""} readOnly disabled />
        </Field>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </Section>
  );
}

function PasswordCard() {
  const form = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: PasswordValues) =>
      userService.changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword }),
    onSuccess: () => {
      toast.success("Password changed");
      form.reset();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Section title="Password" hint="Choose a strong password you do not use elsewhere.">
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <Field label="Current password" error={form.formState.errors.currentPassword?.message}>
          <Input type="password" autoComplete="current-password" {...form.register("currentPassword")} />
        </Field>
        <div className="hidden sm:block" />
        <Field label="New password" error={form.formState.errors.newPassword?.message}>
          <Input type="password" autoComplete="new-password" {...form.register("newPassword")} />
        </Field>
        <Field label="Confirm new password" error={form.formState.errors.confirmPassword?.message}>
          <Input type="password" autoComplete="new-password" {...form.register("confirmPassword")} />
        </Field>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Updating…" : "Change password"}
          </Button>
        </div>
      </form>
    </Section>
  );
}

function SecurityCard({ onDone }: { onDone: () => Promise<void> }) {
  const { user } = useAuth();
  const mutation = useMutation({
    mutationFn: (enabled: boolean) => userService.updateSecurity({ twoFactorEnabled: enabled }),
    onSuccess: async () => {
      toast.success("Security settings updated");
      await onDone();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Section title="Security">
      <div className="flex items-center justify-between gap-6">
        <div>
          <p className="text-sm">Two-factor authentication</p>
          <p className="text-xs text-muted-foreground">Require a second factor when signing in.</p>
        </div>
        <Switch
          checked={Boolean(user?.twoFactorEnabled)}
          disabled={mutation.isPending}
          onCheckedChange={(checked) => mutation.mutate(checked)}
        />
      </div>
    </Section>
  );
}

function Field({ label, error, children }: { label: string; error?: string | undefined; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-[0.15em] text-muted-foreground">{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

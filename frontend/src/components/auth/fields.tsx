import { forwardRef, useState } from "react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: ReactNode;
};

const baseInput =
  "w-full rounded-sm border border-border bg-card px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-gold focus:ring-1 focus:ring-gold/40";

export const TextField = forwardRef<HTMLInputElement, FieldProps>(function TextField(
  { label, error, hint, className, ...props },
  ref
) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
      <input
        ref={ref}
        aria-invalid={Boolean(error)}
        className={cn(baseInput, error && "border-destructive focus:border-destructive", className)}
        {...props}
      />
      {error ? <span className="mt-1.5 block text-xs text-destructive">{error}</span> : hint}
    </label>
  );
});

export const PasswordField = forwardRef<HTMLInputElement, FieldProps>(function PasswordField(
  { label, error, hint, className, ...props },
  ref
) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
      <span className="relative block">
        <input
          ref={ref}
          type={visible ? "text" : "password"}
          aria-invalid={Boolean(error)}
          className={cn(
            baseInput,
            "pr-11",
            error && "border-destructive focus:border-destructive",
            className
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted-foreground transition-colors hover:text-gold"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </span>
      {error ? <span className="mt-1.5 block text-xs text-destructive">{error}</span> : hint}
    </label>
  );
});

export function SubmitButton({
  children,
  pending,
  ...props
}: { children: ReactNode; pending?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-sm bg-gold px-5 py-3 text-sm font-medium text-ink shadow-gold transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
      {...props}
    >
      {pending ? "Please wait…" : children}
    </button>
  );
}

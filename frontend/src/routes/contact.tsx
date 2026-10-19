import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const SUPPORT_EMAIL = "pappp537@gmail.com";
const title = "Contact Support — Meridian Capital";
const description = "Send complaints or questions to the Meridian Capital support team.";

export const Route = createFileRoute("/contact")({
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
  component: ContactPage,
});

function ContactPage() {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject || "Complaint")}&body=${encodeURIComponent(
    `${message}\n\n— ${name}`,
  )}`;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-36 lg:px-8">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Contact</p>
        <h1 className="mt-4 font-display text-4xl md:text-5xl">Complaints & support</h1>
        <p className="mt-5 text-muted-foreground">
          Have an issue with a deposit, withdrawal or your account? Email us at{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-gold underline-offset-4 hover:underline">
            {SUPPORT_EMAIL}
          </a>{" "}
          or use the form below.
        </p>
        <form
          className="mt-10 space-y-4 rounded-lg border border-border/70 bg-card/40 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            window.location.href = href;
          }}
        >
          <Input required placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <Textarea
            required
            rows={6}
            placeholder="Describe your complaint"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button type="submit" className="w-full">Send to support</Button>
          <p className="text-xs text-muted-foreground">This opens your email app with the message ready to send.</p>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
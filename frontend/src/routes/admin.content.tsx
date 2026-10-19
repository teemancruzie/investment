import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  contentKeys,
  contentService,
  type Faq,
  type TeamMember,
  type Testimonial,
} from "@/services/content.service";

export const Route = createFileRoute("/admin/content")({
  component: AdminContent,
});

const idOf = (row: { id?: string; _id?: string }) => row.id ?? row._id ?? "";

function AdminContent() {
  return (
    <Tabs defaultValue="faqs" className="space-y-6">
      <TabsList>
        <TabsTrigger value="faqs">FAQs</TabsTrigger>
        <TabsTrigger value="team">Team</TabsTrigger>
        <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
      </TabsList>

      <TabsContent value="faqs">
        <FaqManager />
      </TabsContent>
      <TabsContent value="team">
        <TeamManager />
      </TabsContent>
      <TabsContent value="testimonials">
        <TestimonialManager />
      </TabsContent>
    </Tabs>
  );
}

function useResource<T extends { id?: string; _id?: string }>(
  key: readonly unknown[],
  api: {
    list: (all?: boolean) => Promise<T[]>;
    create: (body: Partial<T>) => Promise<T>;
    update: (id: string, body: Partial<T>) => Promise<T>;
    remove: (id: string) => Promise<null>;
  }
) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["content"] });

  const query = useQuery({ queryKey: key, queryFn: () => api.list(true), retry: false });

  const create = useMutation({
    mutationFn: (body: Partial<T>) => api.create(body),
    onSuccess: () => {
      toast.success("Created");
      void invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<T> }) => api.update(id, body),
    onSuccess: () => {
      toast.success("Saved");
      void invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: () => {
      toast.success("Deleted");
      void invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return { query, create, update, remove };
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/70 bg-card/40 p-6">
      <h2 className="font-display text-2xl">{title}</h2>
      <div className="mt-5 space-y-4">{children}</div>
    </div>
  );
}

function ErrorNote({ error }: { error: unknown }) {
  if (!error) return null;
  return (
    <p className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
      {(error as Error).message}
    </p>
  );
}

/* --------------------------------- FAQs ---------------------------------- */

function FaqManager() {
  const { query, create, update, remove } = useResource<Faq>(contentKeys.faqs(true), contentService.faqs);
  const [draft, setDraft] = useState({ question: "", answer: "", category: "general" });

  return (
    <div className="space-y-6">
      <ErrorNote error={query.error} />

      <Panel title="Add an FAQ">
        <Input
          placeholder="Question"
          value={draft.question}
          onChange={(event) => setDraft({ ...draft, question: event.target.value })}
        />
        <Textarea
          placeholder="Answer"
          rows={3}
          value={draft.answer}
          onChange={(event) => setDraft({ ...draft, answer: event.target.value })}
        />
        <Input
          placeholder="Category"
          value={draft.category}
          onChange={(event) => setDraft({ ...draft, category: event.target.value })}
        />
        <Button
          disabled={create.isPending || !draft.question.trim() || !draft.answer.trim()}
          onClick={() =>
            create.mutate(
              { ...draft, isPublished: true },
              { onSuccess: () => setDraft({ question: "", answer: "", category: "general" }) }
            )
          }
        >
          {create.isPending ? "Adding…" : "Add FAQ"}
        </Button>
      </Panel>

      <div className="space-y-3">
        {(query.data ?? []).map((faq) => (
          <article key={idOf(faq)} className="rounded-lg border border-border/70 bg-card/40 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm">{faq.question}</p>
                <p className="mt-1 text-sm text-muted-foreground">{faq.answer}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {faq.category || "general"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Switch
                  checked={faq.isPublished}
                  onCheckedChange={(checked) =>
                    update.mutate({ id: idOf(faq), body: { isPublished: checked } })
                  }
                />
                <Button variant="outline" size="sm" onClick={() => remove.mutate(idOf(faq))}>
                  Delete
                </Button>
              </div>
            </div>
          </article>
        ))}
        {!query.isLoading && (query.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No FAQs yet.</p>
        ) : null}
      </div>
    </div>
  );
}

/* --------------------------------- Team ---------------------------------- */

function TeamManager() {
  const { query, create, update, remove } = useResource<TeamMember>(contentKeys.team(true), contentService.team);
  const [draft, setDraft] = useState({ name: "", title: "", bio: "", image: "", linkedin: "" });
  const [uploading, setUploading] = useState(false);

  return (
    <div className="space-y-6">
      <ErrorNote error={query.error} />

      <Panel title="Add a team member">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            placeholder="Full name"
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          />
          <Input
            placeholder="Title"
            value={draft.title}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          />
          <Input
            placeholder="LinkedIn URL"
            value={draft.linkedin}
            onChange={(event) => setDraft({ ...draft, linkedin: event.target.value })}
          />
          <Input
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setUploading(true);
              try {
                const { url } = await contentService.uploadTeamPhoto(file);
                setDraft((prev) => ({ ...prev, image: url }));
                toast.success("Photo uploaded");
              } catch (error) {
                toast.error((error as Error).message);
              } finally {
                setUploading(false);
              }
            }}
          />
        </div>
        <Textarea
          placeholder="Short bio"
          rows={3}
          value={draft.bio}
          onChange={(event) => setDraft({ ...draft, bio: event.target.value })}
        />
        <Button
          disabled={create.isPending || !draft.name.trim() || !draft.title.trim()}
          onClick={() =>
            create.mutate(
              { ...draft, isPublished: true },
              { onSuccess: () => setDraft({ name: "", title: "", bio: "", image: "", linkedin: "" }) }
            )
          }
        >
          {create.isPending ? "Adding…" : "Add member"}
        </Button>
      </Panel>

      <div className="space-y-3">
        {(query.data ?? []).map((member) => (
          <article
            key={idOf(member)}
            className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border/70 bg-card/40 p-5"
          >
            <div className="min-w-0">
              <p className="text-sm">{member.name}</p>
              <p className="text-xs text-muted-foreground">{member.title}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Switch
                checked={member.isPublished}
                onCheckedChange={(checked) =>
                  update.mutate({ id: idOf(member), body: { isPublished: checked } })
                }
              />
              <Button variant="outline" size="sm" onClick={() => remove.mutate(idOf(member))}>
                Delete
              </Button>
            </div>
          </article>
        ))}
        {!query.isLoading && (query.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No team members yet.</p>
        ) : null}
      </div>
    </div>
  );
}

/* ----------------------------- Testimonials ------------------------------ */

function TestimonialManager() {
  const { query, create, update, remove } = useResource<Testimonial>(
    contentKeys.testimonials(true),
    contentService.testimonials
  );
  const [draft, setDraft] = useState({ name: "", role: "", company: "", quote: "", rating: 5 });

  return (
    <div className="space-y-6">
      <ErrorNote error={query.error} />

      <Panel title="Add a testimonial">
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            placeholder="Name"
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          />
          <Input
            placeholder="Role"
            value={draft.role}
            onChange={(event) => setDraft({ ...draft, role: event.target.value })}
          />
          <Input
            placeholder="Company"
            value={draft.company}
            onChange={(event) => setDraft({ ...draft, company: event.target.value })}
          />
        </div>
        <Textarea
          placeholder="Quote"
          rows={3}
          value={draft.quote}
          onChange={(event) => setDraft({ ...draft, quote: event.target.value })}
        />
        <Input
          type="number"
          min={1}
          max={5}
          value={draft.rating}
          onChange={(event) => setDraft({ ...draft, rating: Number(event.target.value) })}
        />
        <Button
          disabled={create.isPending || !draft.name.trim() || !draft.quote.trim()}
          onClick={() =>
            create.mutate(
              { ...draft, isPublished: true },
              { onSuccess: () => setDraft({ name: "", role: "", company: "", quote: "", rating: 5 }) }
            )
          }
        >
          {create.isPending ? "Adding…" : "Add testimonial"}
        </Button>
      </Panel>

      <div className="space-y-3">
        {(query.data ?? []).map((row) => (
          <article key={idOf(row)} className="rounded-lg border border-border/70 bg-card/40 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm italic text-muted-foreground">“{row.quote}”</p>
                <p className="mt-2 text-sm">
                  {row.name}
                  {row.company ? <span className="text-muted-foreground"> · {row.company}</span> : null}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Switch
                  checked={row.isPublished}
                  onCheckedChange={(checked) => update.mutate({ id: idOf(row), body: { isPublished: checked } })}
                />
                <Button variant="outline" size="sm" onClick={() => remove.mutate(idOf(row))}>
                  Delete
                </Button>
              </div>
            </div>
          </article>
        ))}
        {!query.isLoading && (query.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No testimonials yet.</p>
        ) : null}
      </div>
    </div>
  );
}

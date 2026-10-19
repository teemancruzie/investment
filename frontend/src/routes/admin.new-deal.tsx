import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminService } from "@/services/admin.service";
import { investmentKeys, investmentService } from "@/services/investment.service";
import { uploadFile } from "@/services/user.service";

export const Route = createFileRoute("/admin/new-deal")({
  component: NewDeal,
});

const schema = z.object({
  title: z.string().trim().min(3, "Title is required").max(140),
  summary: z.string().trim().max(280).optional().or(z.literal("")),
  description: z.string().trim().min(20, "Describe the opportunity (20+ characters)"),
  category: z.string().min(1, "Pick a category"),
  location: z.string().trim().max(120).optional().or(z.literal("")),
  expectedAnnualReturn: z.coerce.number().min(0).max(200),
  durationMonths: z.coerce.number().int().min(1),
  minimumInvestment: z.coerce.number().min(0),
  fundingGoal: z.coerce.number().min(1),
  totalUnits: z.coerce.number().int().min(1),
  riskLevel: z.enum(["low", "medium", "high"]),
  status: z.enum(["draft", "active"]),
});

type Values = z.input<typeof schema>;

function NewDeal() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [image, setImage] = useState("");
  const [uploading, setUploading] = useState(false);

  const categories = useQuery({
    queryKey: investmentKeys.categories(),
    queryFn: () => investmentService.categories(),
    retry: false,
  });

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      summary: "",
      description: "",
      category: "",
      location: "",
      expectedAnnualReturn: 12,
      durationMonths: 12,
      minimumInvestment: 1000,
      fundingGoal: 500000,
      totalUnits: 500,
      riskLevel: "medium",
      status: "draft",
    },
  });

  const create = useMutation({
    mutationFn: (values: Values) =>
      adminService.createInvestment({ ...schema.parse(values), image }),
    onSuccess: () => {
      toast.success("Deal created");
      void queryClient.invalidateQueries({ queryKey: ["investments"] });
      void navigate({ to: "/admin/investments" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const errors = form.formState.errors;

  return (
    <form
      className="max-w-3xl space-y-6"
      onSubmit={form.handleSubmit((values) => create.mutate(values))}
    >
      <section className="space-y-4 rounded-lg border border-border/70 bg-card/40 p-6">
        <h2 className="font-display text-2xl">Opportunity</h2>

        <Field label="Title" error={errors.title?.message}>
          <Input {...form.register("title")} placeholder="Harbour District Logistics Fund" />
        </Field>
        <Field label="Summary" error={errors.summary?.message}>
          <Input {...form.register("summary")} placeholder="One-line pitch shown on the marketplace card" />
        </Field>
        <Field label="Description" error={errors.description?.message}>
          <Textarea rows={6} {...form.register("description")} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" error={errors.category?.message}>
            <Select value={form.watch("category")} onValueChange={(value) => form.setValue("category", value)}>
              <SelectTrigger>
                <SelectValue placeholder={categories.isLoading ? "Loading…" : "Select a category"} />
              </SelectTrigger>
              <SelectContent>
                {(categories.data ?? []).map((category) => (
                  <SelectItem key={category.id ?? category._id} value={category.id ?? category._id ?? ""}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Location" error={errors.location?.message}>
            <Input {...form.register("location")} placeholder="Rotterdam, NL" />
          </Field>
        </div>

        <Field label="Cover image">
          <Input
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setUploading(true);
              try {
                const result = await uploadFile("/uploads/investment", file);
                setImage(result.url);
                toast.success("Image uploaded");
              } catch (error) {
                toast.error((error as Error).message);
              } finally {
                setUploading(false);
              }
            }}
          />
        </Field>
      </section>

      <section className="space-y-4 rounded-lg border border-border/70 bg-card/40 p-6">
        <h2 className="font-display text-2xl">Terms</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Target annual return (%)" error={errors.expectedAnnualReturn?.message}>
            <Input type="number" step="0.1" {...form.register("expectedAnnualReturn")} />
          </Field>
          <Field label="Duration (months)" error={errors.durationMonths?.message}>
            <Input type="number" {...form.register("durationMonths")} />
          </Field>
          <Field label="Minimum ticket (USD)" error={errors.minimumInvestment?.message}>
            <Input type="number" {...form.register("minimumInvestment")} />
          </Field>
          <Field label="Funding goal (USD)" error={errors.fundingGoal?.message}>
            <Input type="number" {...form.register("fundingGoal")} />
          </Field>
          <Field label="Total units" error={errors.totalUnits?.message}>
            <Input type="number" {...form.register("totalUnits")} />
          </Field>
          <Field label="Risk level">
            <Select
              value={form.watch("riskLevel")}
              onValueChange={(value) => form.setValue("riskLevel", value as Values["riskLevel"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Publish state">
            <Select
              value={form.watch("status")}
              onValueChange={(value) => form.setValue("status", value as Values["status"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Live</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </section>

      <div className="flex gap-3">
        <Button type="submit" disabled={create.isPending || uploading}>
          {create.isPending ? "Creating…" : "Create deal"}
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate({ to: "/admin/investments" })}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-[0.15em] text-muted-foreground">{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

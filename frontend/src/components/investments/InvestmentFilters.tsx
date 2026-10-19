import { useEffect, useState } from "react";
import type { Category } from "@/services/investment.service";
import { Input } from "@/components/ui/input";

const RISKS = [
  { value: "", label: "All risk" },
  { value: "low", label: "Lower" },
  { value: "medium", label: "Moderate" },
  { value: "high", label: "Higher" },
];

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "return-desc", label: "Highest target return" },
  { value: "return-asc", label: "Lowest target return" },
  { value: "min-asc", label: "Lowest minimum" },
  { value: "funding-desc", label: "Most funded" },
];

export type FilterState = {
  search: string;
  category: string;
  riskLevel: string;
  sort: string;
};

export function InvestmentFilters({
  value,
  categories,
  onChange,
}: {
  value: FilterState;
  categories: Category[];
  onChange: (patch: Partial<FilterState>) => void;
}) {
  const [search, setSearch] = useState(value.search);

  useEffect(() => setSearch(value.search), [value.search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (search !== value.search) onChange({ search });
    }, 350);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const selectClass =
    "h-11 rounded-md border border-border/70 bg-card px-3 text-sm text-foreground outline-none focus:border-gold/60";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/60 p-4 lg:flex-row lg:items-center">
      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search opportunities, sectors or locations"
        aria-label="Search opportunities"
        className="h-11 flex-1 bg-card"
      />

      <select
        aria-label="Filter by category"
        className={selectClass}
        value={value.category}
        onChange={(event) => onChange({ category: event.target.value })}
      >
        <option value="">All categories</option>
        {categories.map((category) => (
          <option key={category.id ?? category._id} value={String(category.id ?? category._id)}>
            {category.name}
          </option>
        ))}
      </select>

      <select
        aria-label="Filter by risk level"
        className={selectClass}
        value={value.riskLevel}
        onChange={(event) => onChange({ riskLevel: event.target.value })}
      >
        {RISKS.map((risk) => (
          <option key={risk.value} value={risk.value}>
            {risk.label}
          </option>
        ))}
      </select>

      <select
        aria-label="Sort opportunities"
        className={selectClass}
        value={value.sort}
        onChange={(event) => onChange({ sort: event.target.value })}
      >
        {SORTS.map((sort) => (
          <option key={sort.value} value={sort.value}>
            {sort.label}
          </option>
        ))}
      </select>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { ComingSoonPage } from "@/components/layout/ComingSoonPage";

const title = "Investor FAQ — Meridian Capital";
const description =
  "Answers on minimums, fees, distributions, liquidity and custody for investing through Meridian Capital.";

export const Route = createFileRoute("/faq")({
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
  component: () => (
    <ComingSoonPage
      eyebrow="Support"
      title="Investor FAQ"
      description="The full, admin-editable FAQ library loads from the content API. The highlights are on the home page today."
    />
  ),
});

import { createFileRoute } from "@tanstack/react-router";
import { ComingSoonPage } from "@/components/layout/ComingSoonPage";

const title = "How Investing Works — Meridian Capital";
const description =
  "From account opening and diligence review to unit allocation, distributions and reinvestment at Meridian Capital.";

export const Route = createFileRoute("/how-it-works")({
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
      eyebrow="Process"
      title="How investing works"
      description="A detailed walkthrough of allocation, custody and distribution mechanics follows the investor dashboard build."
    />
  ),
});

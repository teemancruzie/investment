import { createFileRoute } from "@tanstack/react-router";
import { ComingSoonPage } from "@/components/layout/ComingSoonPage";

const title = "About Meridian Capital — Our Investment Team";
const description =
  "Meet the investment team behind Meridian Capital and the underwriting discipline applied to every listed opportunity.";

export const Route = createFileRoute("/about")({
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
      eyebrow="About"
      title="About Meridian Capital"
      description="Team profiles and our underwriting process are managed through the admin content API and land with the content-driven pages."
    />
  ),
});

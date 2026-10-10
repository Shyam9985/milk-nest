import { Activity, Building2, HeartPulse } from "lucide-react";

/** Chapter 03: the live band and the three reasons. */
export const whyUs = {
  eyebrow: "Live from the farms",
  headline: "Farms on Milk Nest, right now.",
  emphasis: "right now.",
  lead: "Not a brochure number. These are the records being written today.",

  /* the four figures of the band; `value` is picked from the live stats by key */
  figures: [
    { key: "active_cattle", label: "cattle on record", hint: "Every animal with its own profile" },
    { key: "branches", label: "farm branches", hint: (s) => `Across ${s.dairy_farms} dairy ${s.dairy_farms === 1 ? "farm" : "farms"}`, fallbackHint: "Single and multi-branch" },
    { key: "milk_week", label: "litres in the last 7 days", suffix: " L", hint: "Morning and evening yields" },
    { key: "milk_month", label: "litres this month", suffix: " L", hint: "Updated as entries come in" },
  ],

  liveNote: {
    ready: "Live figures from farms running on Milk Nest · refreshed every minute",
    loading: "Loading live figures…",
    error: "Live figures are unavailable right now. Please check back in a moment.",
  },

  benefits: [
    {
      icon: Activity,
      title: "See today without calling anyone",
      text: "Milk recorded, animals under treatment, calvings due - the whole farm day on one screen.",
    },
    {
      icon: HeartPulse,
      title: "Care that stays on schedule",
      text: "Follow-ups, dry-offs and calvings surface before they are due, not after they are missed.",
    },
    {
      icon: Building2,
      title: "One farm or a dozen",
      text: "The same records roll up branch by branch, with nothing extra to type.",
    },
  ],
};

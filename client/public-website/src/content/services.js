import { Beef, Building2, CalendarHeart, ChartColumn, Milk, Stethoscope } from "lucide-react";

/**
 * Chapter 02: what the product covers. Only what it does today - add a service here
 * when it ships. The marquee and the services grid both read this list.
 */
export const services = {
  eyebrow: "What it covers",
  headline: "Six areas. One record.",
  emphasis: "One record.",
  lead: "Recorded once in the shed, visible everywhere from the branch dashboard.",

  items: [
    {
      icon: Beef,
      title: "Cattle",
      text: "Breed, age, lineage and branch for every animal, in one profile.",
      accent: "from-navy-600 to-navy-400",
    },
    {
      icon: Milk,
      title: "Milk",
      text: "Morning and evening yields, daily, with the trend per animal.",
      accent: "from-splash to-navy-400",
    },
    {
      icon: Stethoscope,
      title: "Health",
      text: "Illness episodes, checkups, medicines and costs, with follow-up dates.",
      accent: "from-navy-700 to-navy-500",
    },
    {
      icon: CalendarHeart,
      title: "Breeding",
      text: "Conception, dry-off and calving dates for every pregnancy, calves included.",
      accent: "from-navy-500 to-splash",
    },
    {
      icon: ChartColumn,
      title: "Dashboard",
      text: "Production trends, herd composition and top producers, live.",
      accent: "from-splash to-navy-600",
    },
    {
      icon: Building2,
      title: "Branches",
      text: "Herd size and milk production compared across every location.",
      accent: "from-navy-400 to-splash",
    },
  ],
};

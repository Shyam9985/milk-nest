import { Droplets, LineChart, TrendingUp } from "lucide-react";

/** Chapter 04: the three steps. */
export const howItHelps = {
  eyebrow: "How it works",
  headline: "Record. Watch. Decide.",
  emphasis: "Decide.",

  steps: [
    {
      number: "01",
      icon: Droplets,
      title: "Record",
      text: "Cattle, yields, treatments and breeding events, as the day happens.",
      points: ["Morning & evening yields", "Treatment & checkup notes", "Breeding & calving events"],
    },
    {
      number: "02",
      icon: LineChart,
      title: "Watch",
      text: "Production and health trends move - and problems show while they are small.",
      points: ["Branch-wise comparison", "Health & calving alerts", "Daily operations view"],
    },
    {
      number: "03",
      icon: TrendingUp,
      title: "Decide",
      text: "Plan production, care for the herd and expand with the numbers in front of you.",
      points: ["Decision-ready dashboard", "Herd & yield trends", "Confident expansion"],
    },
  ],
};

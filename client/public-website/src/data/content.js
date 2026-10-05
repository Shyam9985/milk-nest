import {
  Activity,
  Beef,
  Building2,
  CalendarHeart,
  ChartColumn,
  Droplets,
  Gauge,
  HeartPulse,
  Leaf,
  LineChart,
  MapPin,
  Mail,
  Milk,
  Phone,
  ShieldCheck,
  Sprout,
  Stethoscope,
  TrendingUp,
  Users,
} from "lucide-react";

export const navItems = [
  { label: "Home", href: "#home", id: "home" },
  { label: "Services", href: "#services", id: "services" },
  { label: "Why Us", href: "#why-us", id: "why-us" },
  { label: "How It Helps", href: "#how-it-helps", id: "how-it-helps" },
  { label: "Contact", href: "#contact", id: "contact" },
];

export const trustBadges = [
  { icon: ShieldCheck, label: "Farm data stays private" },
  { icon: Building2, label: "Single & multi-branch" },
  { icon: Gauge, label: "Built for daily use" },
];

/* Only what the product does today. Add a service here when it ships - the marquee and
   the services grid both read this list. */
export const services = [
  {
    icon: Beef,
    title: "Cattle Management",
    text: "Breed, age, lineage, and branch mapping for every animal in one profile.",
    accent: "from-navy-600 to-navy-400",
  },
  {
    icon: Milk,
    title: "Milk Production",
    text: "Morning and evening yields captured daily, with per-cattle trends.",
    accent: "from-splash to-navy-400",
  },
  {
    icon: Stethoscope,
    title: "Health & Treatments",
    text: "Illness episodes, checkups, medicines, and treatment costs with follow-up dates.",
    accent: "from-navy-700 to-navy-500",
  },
  {
    icon: CalendarHeart,
    title: "Breeding & Pregnancy",
    text: "Conception, dry-off, and calving dates tracked for every pregnancy, calves included.",
    accent: "from-navy-500 to-splash",
  },
  {
    icon: ChartColumn,
    title: "Dashboard & Insights",
    text: "Production trends, herd composition, and top producers on one live dashboard.",
    accent: "from-splash to-navy-600",
  },
  {
    icon: Building2,
    title: "Branch Monitoring",
    text: "Compare herd size and milk production across every farm location.",
    accent: "from-navy-400 to-splash",
  },
];

export const benefits = [
  {
    icon: Sprout,
    title: "Less manual record keeping",
    text: "Notebook columns, loose slips, and end-of-month recall get replaced by one entry flow that takes seconds.",
  },
  {
    icon: Activity,
    title: "Better daily visibility",
    text: "See what happened on the farm today — milk recorded, animals under treatment, calvings due — without calling three people.",
  },
  {
    icon: Beef,
    title: "Organized cattle information",
    text: "Every animal carries its own history: breed, health, breeding, and yield, ready when you need it.",
  },
  {
    icon: Building2,
    title: "Single or multi-branch",
    text: "Run one farm or compare six. The same records roll up branch by branch without extra work.",
  },
  {
    icon: HeartPulse,
    title: "Health care that stays on schedule",
    text: "Follow-up checkups, dry-offs, and calvings surface as alerts before they are due, not after they are missed.",
  },
  {
    icon: Users,
    title: "Practical for farm teams",
    text: "Designed around how owners, managers, and workers actually move through a farm day.",
  },
];

export const steps = [
  {
    number: "01",
    icon: Droplets,
    title: "Record",
    text: "Capture cattle, milk yields, treatments, and breeding events as the day happens.",
    points: ["Morning & evening yields", "Treatment & checkup notes", "Breeding & calving events"],
  },
  {
    number: "02",
    icon: LineChart,
    title: "Monitor",
    text: "Watch production and health trends move — and notice problems while they are small.",
    points: ["Branch-wise comparison", "Health & calving alerts", "Daily operations view"],
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "Grow",
    text: "Use organized farm information to plan production, care for the herd, and expand with confidence.",
    points: ["Decision-ready dashboard", "Herd & yield trends", "Confident expansion"],
  },
];

export const audiences = [
  {
    icon: ShieldCheck,
    title: "Farm Owners",
    text: "The overall direction of production, herd health, and branch activity at a glance.",
  },
  {
    icon: Gauge,
    title: "Branch Managers",
    text: "Stay close to daily operations without chasing scattered notebooks and phone calls.",
  },
  {
    icon: Leaf,
    title: "Farm Teams",
    text: "Simple flows for cattle, milk, health, and routine activity records.",
  },
];

/* Contact details come from .env (VITE_CONTACT_*), so each deployment can show its own
   without a code change. A value left empty there simply drops its entry here. */
const contactPhone = (import.meta.env.VITE_CONTACT_PHONE || "").trim();
const contactEmail = (import.meta.env.VITE_CONTACT_EMAIL || "").trim();
const contactLocation = (import.meta.env.VITE_CONTACT_LOCATION || "").trim();

export const contactDetails = [
  contactPhone && {
    icon: Phone,
    label: "Phone",
    value: contactPhone,
    href: `tel:${contactPhone.replace(/[^+\d]/g, "")}`,
  },
  contactEmail && {
    icon: Mail,
    label: "Email",
    value: contactEmail,
    href: `mailto:${contactEmail}`,
  },
  contactLocation && { icon: MapPin, label: "Location", value: contactLocation, href: null },
].filter(Boolean);

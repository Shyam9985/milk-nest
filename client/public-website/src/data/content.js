import {
  Activity,
  Beef,
  Bell,
  Building2,
  CalendarCheck,
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
  Syringe,
  TrendingUp,
  Users,
  Wallet,
  Wheat,
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
    icon: Wallet,
    title: "Sales & Expenses",
    text: "Track milk sales, farm costs, and payment status as money moves.",
    accent: "from-navy-500 to-splash",
  },
  {
    icon: CalendarCheck,
    title: "Staff Attendance",
    text: "Daily attendance for farm teams, visible branch by branch.",
    accent: "from-navy-800 to-navy-600",
  },
  {
    icon: Syringe,
    title: "Vaccinations",
    text: "Health checkups, vaccination dates, and medicine notes with follow-ups.",
    accent: "from-navy-700 to-navy-500",
  },
  {
    icon: ChartColumn,
    title: "Reports & Insights",
    text: "Turn day-to-day records into reports you can actually decide from.",
    accent: "from-splash to-navy-600",
  },
  {
    icon: Building2,
    title: "Branch Monitoring",
    text: "Compare production, costs, and staffing across every farm location.",
    accent: "from-navy-400 to-splash",
  },
  {
    icon: Wheat,
    title: "Feed & Resources",
    text: "Feed usage, stock levels, and resource consumption without guesswork.",
    accent: "from-navy-600 to-splash",
  },
];

export const stats = [
  { value: 8, suffix: "", label: "farm areas covered", hint: "Cattle to cash flow" },
  { value: 2, suffix: "x", label: "daily milk entries", hint: "Morning and evening" },
  { value: 100, suffix: "%", label: "records in one place", hint: "No scattered notebooks" },
  { value: 24, suffix: "/7", label: "operational visibility", hint: "Any device, any branch" },
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
    text: "See what happened on the farm today — production, attendance, sales — without calling three people.",
  },
  {
    icon: Beef,
    title: "Organized cattle information",
    text: "Every animal carries its own history: breed, health, vaccinations, and yield, ready when you need it.",
  },
  {
    icon: Building2,
    title: "Single or multi-branch",
    text: "Run one farm or compare six. The same records roll up branch by branch without extra work.",
  },
  {
    icon: TrendingUp,
    title: "Clear money flow",
    text: "Sales, expenses, and pending payments sit next to production, so margin is never a surprise.",
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
    text: "Capture cattle, milk, sales, expenses, feed, and attendance as the day happens.",
    points: ["Morning & evening yields", "Expense and sale entries", "Attendance in one tap"],
  },
  {
    number: "02",
    icon: LineChart,
    title: "Monitor",
    text: "Watch production, cost, and health trends move — and notice problems while they are small.",
    points: ["Branch-wise comparison", "Health & vaccination alerts", "Daily operations view"],
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "Grow",
    text: "Use organized farm information to plan production, control cost, and expand with confidence.",
    points: ["Decision-ready reports", "Cost control signals", "Confident expansion"],
  },
];

export const audiences = [
  {
    icon: ShieldCheck,
    title: "Farm Owners",
    text: "The overall direction of production, expenses, staff, and branch activity at a glance.",
  },
  {
    icon: Gauge,
    title: "Branch Managers",
    text: "Stay close to daily operations without chasing scattered notebooks and phone calls.",
  },
  {
    icon: Leaf,
    title: "Farm Teams",
    text: "Simple flows for cattle, milk, attendance, and routine activity records.",
  },
];

export const contactDetails = [
  { icon: Phone, label: "Phone", value: "+91 99854 53023", href: "tel:+919985453023" },
  { icon: Mail, label: "Email", value: "hello@milknest.example", href: "mailto:hello@milknest.example" },
  { icon: MapPin, label: "Location", value: "Andhra Pradesh, India", href: null },
];

/* Sample telemetry rendered inside the hero's 3D dashboard. */
export const heroChart = [
  { day: "Mon", value: 58 },
  { day: "Tue", value: 71 },
  { day: "Wed", value: 64 },
  { day: "Thu", value: 83 },
  { day: "Fri", value: 76 },
  { day: "Sat", value: 94 },
  { day: "Sun", value: 88 },
];

export const heroNotifications = [
  {
    icon: Milk,
    title: "Evening yield recorded",
    meta: "482 L · Branch A",
    tone: "grass",
  },
  {
    icon: HeartPulse,
    title: "Vaccination due",
    meta: "3 cattle · this week",
    tone: "navy",
  },
  {
    icon: Bell,
    title: "Feed stock low",
    meta: "Reorder in 2 days",
    tone: "splash",
  },
];

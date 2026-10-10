import { Mail, MapPin, Phone } from "lucide-react";
import { env } from "./env";

/**
 * Site-wide facts: who we are and how to reach us. Chapter copy lives in
 * src/content; this file holds what every chapter shares.
 */

export const brand = Object.freeze({
  name: "Milk Nest",
  tagline: "Smart dairy farm management",
  madeBy: "Made with care for dairy farmers.",
  copyrightYear: new Date().getFullYear(),
});

/* Contact details come from .env (VITE_CONTACT_*), so each deployment can show its own
   without a code change. A value left empty there simply drops its entry here. */
export const contactDetails = [
  env.contact.phone && {
    icon: Phone,
    label: "Phone",
    value: env.contact.phone,
    href: `tel:${env.contact.phone.replace(/[^+\d]/g, "")}`,
  },
  env.contact.email && {
    icon: Mail,
    label: "Email",
    value: env.contact.email,
    href: `mailto:${env.contact.email}`,
  },
  env.contact.location && { icon: MapPin, label: "Location", value: env.contact.location, href: null },
].filter(Boolean);

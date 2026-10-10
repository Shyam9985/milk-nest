/**
 * Environment configuration, read once from Vite's import.meta.env.
 *
 * Only VITE_* variables reach the browser bundle, and everything that does is public:
 * never put a secret here or in the .env files this reads (see .env.example).
 * Components import from here instead of touching import.meta.env, so a renamed
 * variable is a one-line change.
 */

const read = (key, fallback = "") => String(import.meta.env[key] ?? fallback).trim();

export const env = Object.freeze({
  /* where the Milk Nest api listens, without a trailing slash. empty = same origin */
  serverUrl: read("VITE_SERVER_URL").replace(/\/+$/, ""),

  contact: Object.freeze({
    phone: read("VITE_CONTACT_PHONE"),
    email: read("VITE_CONTACT_EMAIL"),
    location: read("VITE_CONTACT_LOCATION"),
  }),
});

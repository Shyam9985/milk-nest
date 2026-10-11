import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  // The api only answers origins it has been told about (PUBLIC_SITE_ORIGIN in the root .env).
  // strictPort makes vite fail loudly when the port is taken instead of quietly moving to the
  // next one, where every api call would be refused by CORS.
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
});

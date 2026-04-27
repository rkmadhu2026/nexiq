import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/** Host patterns for dev/preview behind tunnels (leading "." = allow all subdomains). */
const tunnelAllowedHosts = [
  ".loca.lt",
  ".localtunnel.me",
  ".ngrok-free.app",
  ".ngrok.io",
  ".trycloudflare.com",
];

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 8080,
    // Prefer 8080; if something else is using it, Vite picks the next free port and prints the URL.
    strictPort: false,
    host: "0.0.0.0",
    allowedHosts: tunnelAllowedHosts,
  },
  preview: {
    port: 8080,
    strictPort: false,
    host: "0.0.0.0",
    allowedHosts: tunnelAllowedHosts,
  },
});

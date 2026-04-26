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
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: tunnelAllowedHosts,
  },
  preview: {
    port: 8080,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: tunnelAllowedHosts,
  },
});

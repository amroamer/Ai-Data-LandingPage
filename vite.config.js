/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/ai-data/",
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    // Pinned above Vite's default 5173/5174 swarm because other local
    // Docker containers (arch-assistant on 5173, invoice-agent on 5174)
    // map their Vite dev servers to those ports. Picking 5180 keeps us
    // out of the collision band.
    port: 5180,
    strictPort: true,
    proxy: {
      "/auth/api": {
        target: "http://localhost:8100",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.js"],
    css: false,
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Config do Vite: React + PWA (offline) + alias "@" para "src"
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        // PDFs e dados ficam no IndexedDB (Dexie), não precisam de cache do service worker.
        // Aqui cacheamos apenas o "app shell" (JS/CSS/HTML) para abrir offline.
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
      },
      manifest: {
        name: "Leitura — Leitor de PDF",
        short_name: "Leitura",
        description: "Leitor de PDF pessoal com anotações, citações e timer de leitura",
        theme_color: "#C96F4A",
        background_color: "#FAF6F0",
        display: "standalone",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
  resolve: {
    alias: { "@": "/src" },
  },
});

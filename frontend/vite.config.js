import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Clean Vite config for React + Essentia.js
export default defineConfig({
  plugins: [react()],
  build: {
    assetsInlineLimit: 0, // ensure WASM files aren’t inlined
  },
  server: {
    port: 5173,
    open: true,
  },
});
